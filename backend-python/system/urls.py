from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupportTicketViewSet,
    AuditListView,
    SystemSettingListView,
    SystemSettingDetailUpdateView,
    SupportTicketMessageListCreateView,
)

router = DefaultRouter()
router.register(r'support-tickets', SupportTicketViewSet, basename='support-ticket')

urlpatterns = [
    path('', include(router.urls)),
    path('audit/', AuditListView.as_view()),
    path('settings/', SystemSettingListView.as_view()),
    path('settings/<str:key>/', SystemSettingDetailUpdateView.as_view()),
    path('support-tickets/<int:ticket_id>/messages/', SupportTicketMessageListCreateView.as_view()),
]
