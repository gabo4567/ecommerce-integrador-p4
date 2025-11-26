from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status as drf_status
from .models import Order, OrderItem, Invoice, Payment, Shipment, Discount, OrderDiscount, OrderStatusHistory
from .serializers import (
    OrderSerializer, OrderItemSerializer,
    InvoiceSerializer, PaymentSerializer, ShipmentSerializer,
    DiscountSerializer, OrderDiscountSerializer, OrderStatusHistorySerializer,
)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != 'pending':
            return Response({'detail': 'Solo se puede cancelar pedidos en estado pending'}, status=drf_status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = OrderItem.objects.filter(order__user=self.request.user)
        order_id = self.request.query_params.get('order')
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs

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

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Invoice.objects.all()
        return Invoice.objects.filter(order__user=self.request.user)

    def perform_create(self, serializer):
        order = serializer.validated_data.get('order')
        if not self.request.user.is_staff and order.user != self.request.user:
            raise PermissionDenied("No puedes generar factura de otro usuario.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'void'
        instance.save()
        return Response(status=drf_status.HTTP_204_NO_CONTENT)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__user=self.request.user)

    def perform_create(self, serializer):
        order = serializer.validated_data.get('order')
        if not self.request.user.is_staff and order.user != self.request.user:
            raise PermissionDenied("No puedes registrar pago de otro usuario.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar pagos.")
        serializer.save()

class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Shipment.objects.all()
        return Shipment.objects.filter(order__user=self.request.user)

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear envíos.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar envíos.")
        serializer.save()

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear descuentos.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede editar descuentos.")
        serializer.save()

class OrderDiscountViewSet(viewsets.ModelViewSet):
    queryset = OrderDiscount.objects.all()
    serializer_class = OrderDiscountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return OrderDiscount.objects.all()
        return OrderDiscount.objects.filter(order__user=self.request.user)

    def perform_create(self, serializer):
        order = serializer.validated_data.get('order')
        if not self.request.user.is_staff and order.user != self.request.user:
            raise PermissionDenied("No puedes aplicar descuentos a pedidos de otro usuario.")
        serializer.save()

class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = OrderStatusHistory.objects.all()
    serializer_class = OrderStatusHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = OrderStatusHistory.objects.all() if self.request.user.is_staff else OrderStatusHistory.objects.filter(order__user=self.request.user)
        order_id = self.request.query_params.get('order')
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede registrar cambios manualmente.")
        serializer.save(changed_by=self.request.user)
