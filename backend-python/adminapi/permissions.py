from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        u = getattr(request, 'user', None)
        return bool(u and u.is_authenticated and (getattr(u, 'role', None) == 'admin' or getattr(u, 'is_staff', False)))

