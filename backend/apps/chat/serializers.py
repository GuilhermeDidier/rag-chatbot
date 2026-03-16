from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "source_chunks", "tokens_used", "created_at"]
        read_only_fields = ["id", "role", "source_chunks", "tokens_used", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    document_name = serializers.CharField(source="document.name", read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "document",
            "document_name",
            "title",
            "message_count",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "document_name", "message_count", "messages", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["document", "title"]


class ChatMessageCreateSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000)
