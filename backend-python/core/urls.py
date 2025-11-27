from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework import routers
from products.views import ProductViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
<<<<<<< Updated upstream
from users.views import UserRegisterView
from .views import index, demo
=======
from users.views import UserRegisterView, EmailTokenObtainPairView, EmailLoginView
from django.urls import include
>>>>>>> Stashed changes

router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', lambda request: HttpResponse('<h1>Servidor funcionando correctamente</h1><p>API disponible en /api/</p>')),
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
    path('api/token/by-email/', EmailLoginView.as_view(), name='token_obtain_pair_by_email'),
    path('api/admin/', include('adminapi.urls')),
]
