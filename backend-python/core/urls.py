from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from products.views import ProductViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('admin/', admin.site.urls),

    # ✅ Incluí las rutas de la app "products"
    path('api/', include('products.urls')),

    # ✅ Rutas de la app "users" (cambio y reset de contraseña)
    path('api/users/', include('users.urls')),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
