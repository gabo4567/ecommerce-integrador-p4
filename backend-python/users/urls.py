from django.urls import path
from .views import (
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    MeView,
    MeDeleteView,
    AdminUserListCreateView,
    AdminUserDetailView,
)

urlpatterns = [
    # Admin users
    path('', AdminUserListCreateView.as_view(), name='admin_users'),
    path('<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    # Self-service endpoints
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('me/', MeView.as_view(), name='me'),
    path('me/delete/', MeDeleteView.as_view(), name='me_delete'),
]
