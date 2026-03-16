from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "name",
            "file_size",
            "file_size_mb",
            "page_count",
            "chunk_count",
            "status",
            "error_message",
            "collection_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "file_size",
            "file_size_mb",
            "page_count",
            "chunk_count",
            "status",
            "error_message",
            "collection_name",
            "created_at",
            "updated_at",
        ]

    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["file"]

    def validate_file(self, value):
        from django.conf import settings

        max_size = getattr(settings, "MAX_UPLOAD_SIZE_MB", 50) * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit."
            )
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are accepted.")
        return value
