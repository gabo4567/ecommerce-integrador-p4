from django.contrib import admin
from .models import User, PasswordResetCode

admin.site.register(User)
@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "code", "created_at", "expires_at", "used")
    search_fields = ("user__username", "user__email", "code")
    list_filter = ("used",)
