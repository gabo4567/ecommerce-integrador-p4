from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from products.views import ProductViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.views import UserRegisterView
from .views import index, demo

router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Home
    path('', index),
    path('demo/', demo),

    # ✅ Incluí las rutas de la app "products"
    path('api/', include('products.urls')),

    # ✅ Rutas de la app "orders"
    path('api/', include('orders.urls')),

    # ✅ Rutas de la app "system"
    path('api/', include('system.urls')),

    # ✅ Rutas de la app "users" (cambio y reset de contraseña)
    path('api/users/', include('users.urls')),

    # Registro de usuario
    path('api/register/', UserRegisterView.as_view()),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
