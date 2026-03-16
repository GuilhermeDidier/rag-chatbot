from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "ok", "service": "rag-chatbot-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.chat.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
