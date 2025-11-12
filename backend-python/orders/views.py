from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OrderItem.objects.filter(order__user=self.request.user)

    def perform_create(self, serializer):
        order = serializer.validated_data.get('order')
        if order.user != self.request.user:
            raise PermissionDenied("No puedes modificar pedidos de otro usuario.")
        instance = serializer.save()
        self._update_order_total(instance.order)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._update_order_total(instance.order)

    def perform_destroy(self, instance):
        order = instance.order
        instance.delete()
        self._update_order_total(order)

    def _update_order_total(self, order):
        total = sum(item.quantity * item.unit_price for item in order.items.all())
        Order.objects.filter(pk=order.pk).update(total=total)
