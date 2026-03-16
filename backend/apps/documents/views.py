import logging
import threading
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer
from .utils.tasks import process_document
from .utils.embedder import delete_collection

logger = logging.getLogger(__name__)


class DocumentListView(APIView):
    def get(self, request):
        docs = Document.objects.all()
        serializer = DocumentSerializer(docs, many=True)
        return Response(serializer.data)


class DocumentUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload_serializer = DocumentUploadSerializer(data=request.data)
        if not upload_serializer.is_valid():
            return Response(upload_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = upload_serializer.validated_data["file"]
        doc = Document.objects.create(
            name=file.name,
            file=file,
            file_size=file.size,
        )

        # Process in background thread (no Celery needed for portfolio)
        thread = threading.Thread(target=process_document, args=(doc.id,), daemon=True)
        thread.start()

        serializer = DocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    def get_object(self, pk):
        try:
            return Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self.get_object(pk)
        if not doc:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DocumentSerializer(doc)
        return Response(serializer.data)

    def delete(self, request, pk):
        doc = self.get_object(pk)
        if not doc:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        # Delete ChromaDB collection
        if doc.collection_name:
            delete_collection(doc.collection_name)

        doc.file.delete(save=False)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
