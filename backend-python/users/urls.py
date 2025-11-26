from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UsersAdminViewSet,
)

router = DefaultRouter()
router.register(r'admin/users', UsersAdminViewSet, basename='admin-users')

urlpatterns = [
    path('', include(router.urls)),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
