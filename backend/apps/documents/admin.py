from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["name", "status", "page_count", "chunk_count", "file_size", "created_at"]
    list_filter = ["status"]
    search_fields = ["name"]
    readonly_fields = ["collection_name", "file_size", "page_count", "chunk_count", "created_at", "updated_at"]
