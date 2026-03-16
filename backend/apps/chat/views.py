import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Conversation, Message
from apps.documents.models import Document
from .serializers import (
    ConversationSerializer,
    ConversationCreateSerializer,
    ChatMessageCreateSerializer,
    MessageSerializer,
)
from .utils.retriever import retrieve_chunks
from .utils.prompt_builder import build_messages
from .utils.groq_client import chat_completion

logger = logging.getLogger(__name__)


class ConversationListView(APIView):
    def get(self, request):
        convs = Conversation.objects.select_related("document").all()
        serializer = ConversationSerializer(convs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ConversationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        doc_id = serializer.validated_data["document"].id
        try:
            doc = Document.objects.get(id=doc_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        if doc.status != Document.Status.COMPLETED:
            return Response(
                {"error": f"Document is not ready (status: {doc.status})"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conv = Conversation.objects.create(
            document=doc,
            title=serializer.validated_data.get("title", f"Chat about {doc.name}"),
        )
        out_serializer = ConversationSerializer(conv)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    def get_object(self, pk):
        try:
            return Conversation.objects.select_related("document").get(pk=pk)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, pk):
        conv = self.get_object(pk)
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ConversationSerializer(conv)
        return Response(serializer.data)

    def delete(self, request, pk):
        conv = self.get_object(pk)
        if not conv:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageView(APIView):
    def post(self, request, pk):
        try:
            conv = Conversation.objects.select_related("document").get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChatMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data["question"]

        # Save user message
        user_message = Message.objects.create(
            conversation=conv,
            role=Message.Role.USER,
            content=question,
        )

        # Retrieve relevant chunks
        collection_name = conv.document.collection_name
        chunks = retrieve_chunks(collection_name, question)

        # Build conversation history
        past_messages = conv.messages.exclude(id=user_message.id).order_by("created_at")
        history = [{"role": m.role, "content": m.content} for m in past_messages]

        # Build prompt and call LLM
        try:
            messages = build_messages(question, chunks, history)
            result = chat_completion(messages)
        except RuntimeError as e:
            user_message.delete()
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Save assistant message
        source_chunks = [
            {
                "text": c["text"][:300],  # truncate for storage
                "page_number": c["page_number"],
                "similarity": c["similarity"],
            }
            for c in chunks
        ]

        assistant_message = Message.objects.create(
            conversation=conv,
            role=Message.Role.ASSISTANT,
            content=result["content"],
            source_chunks=source_chunks,
            tokens_used=result["tokens_used"],
        )

        # Update conversation title from first user message
        if conv.messages.count() == 2:  # first exchange
            short_q = question[:60] + ("..." if len(question) > 60 else "")
            conv.title = short_q
            conv.save(update_fields=["title", "updated_at"])

        return Response(
            {
                "user_message": MessageSerializer(user_message).data,
                "assistant_message": MessageSerializer(assistant_message).data,
            },
            status=status.HTTP_201_CREATED,
        )
