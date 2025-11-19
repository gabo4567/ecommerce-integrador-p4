from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, OrderItemViewSet,
    InvoiceViewSet, PaymentViewSet, ShipmentViewSet,
    DiscountViewSet, OrderDiscountViewSet, OrderStatusHistoryViewSet,
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'shipments', ShipmentViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'order-discounts', OrderDiscountViewSet)
router.register(r'order-status-history', OrderStatusHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
