from django.urls import path
from .views import (
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    MeView,
    MeDeleteView,
)

urlpatterns = [
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('me/', MeView.as_view(), name='me'),
    path('me/delete/', MeDeleteView.as_view(), name='me_delete'),
]
