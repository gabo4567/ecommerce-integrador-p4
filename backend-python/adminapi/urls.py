from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminProductViewSet, AdminOrderViewSet, AdminUserViewSet, AdminSupportViewSet, AdminAuditViewSet, CloudProxyView

router = DefaultRouter()
router.register(r'products', AdminProductViewSet, basename='admin-products')
router.register(r'orders', AdminOrderViewSet, basename='admin-orders')
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'support-tickets', AdminSupportViewSet, basename='admin-support')
router.register(r'audit', AdminAuditViewSet, basename='admin-audit')

urlpatterns = [
    path('', include(router.urls)),
    path('cloud/promo-apply/', CloudProxyView.as_view(), {'target':'promo'}),
    path('cloud/inventory-sync/', CloudProxyView.as_view(), {'target':'inventory'}),
]

