from django.urls import path
from .views import ConversationListView, ConversationDetailView, ChatMessageView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
    path("conversations/<int:pk>/messages/", ChatMessageView.as_view(), name="chat-message"),
]
