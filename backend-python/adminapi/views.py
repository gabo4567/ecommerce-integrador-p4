import os
from django.utils.timezone import now
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
import requests

from .permissions import IsAdminRole
from .serializers import (
    AdminProductSerializer, AdminOrderSerializer, AdminShipmentSerializer,
    AdminSupportTicketSerializer, AdminTicketMessageSerializer, AuditSerializer, AdminProfileSerializer
)
from products.models import Product, Category
from orders.models import Order, Shipment, OrderStatusHistory
from system.models import SupportTicket, TicketMessage, Audit
from users.models import User

def create_audit(user, action, entity=None, entity_id=None, details='', data=None):
    text = details
    if entity or entity_id:
        text = f"{details} | entity={entity} id={entity_id}"
    if data:
        try:
            import json
            text += f" | data={json.dumps(data)[:1000]}"
        except Exception:
            pass
    Audit.objects.create(user=user, action=action, details=text)

class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'

class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminProductSerializer
    pagination_class = AdminPagination
    queryset = Product.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        q = self.request.query_params.get('q')
        if category:
            qs = qs.filter(category_id=category)
        if q:
            qs = qs.filter(name__icontains=q)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        create_audit(self.request.user, 'admin_product_create', 'product', obj.id, 'Producto creado')

    def perform_update(self, serializer):
        obj = serializer.save()
        create_audit(self.request.user, 'admin_product_update', 'product', obj.id, 'Producto actualizado')

    def perform_destroy(self, instance):
        # Soft delete: marcar inactivo en lugar de borrar
        instance.active = False
        instance.save(update_fields=['active'])
        create_audit(self.request.user, 'admin_product_delete', 'product', instance.id, 'Producto inactivado')

    @action(detail=False, methods=['get'])
    def mine(self, request):
        qs = Product.objects.filter(created_by=request.user).order_by('-created_at')
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminOrderSerializer
    pagination_class = AdminPagination
    queryset = Order.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        status_f = self.request.query_params.get('status')
        df = self.request.query_params.get('date_from')
        dt = self.request.query_params.get('date_to')
        customer = self.request.query_params.get('customer')
        if status_f:
            qs = qs.filter(status=status_f)
        if df:
            qs = qs.filter(created_at__date__gte=df)
        if dt:
            qs = qs.filter(created_at__date__lte=dt)
        if customer:
            qs = qs.filter(user_id=customer)
        return qs

    @action(detail=True, methods=['post'])
    def shipments(self, request, pk=None):
        order = self.get_object()
        ser = AdminShipmentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        shipment = ser.save(order=order)
        if request.data.get('status'):
            order.status = request.data['status']
            order.save()
            OrderStatusHistory.objects.create(order=order, old_status='preparing', new_status=order.status, changed_by=request.user, reason='admin')
        create_audit(request.user, 'admin_order_create_shipment', 'order', order.id, 'Shipment creado', request.data)
        return Response(AdminShipmentSerializer(shipment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'detail':'status requerido'}, status=400)
        old = order.status
        order.status = new_status
        order.save()
        OrderStatusHistory.objects.create(order=order, old_status=old, new_status=new_status, changed_by=request.user, reason=request.data.get('reason','admin'))
        create_audit(request.user, 'admin_order_change_status', 'order', order.id, f'{old}->{new_status}')
        return Response(AdminOrderSerializer(order).data)

class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminProfileSerializer
    pagination_class = AdminPagination
    queryset = User.objects.all().order_by('-date_joined')

    @action(detail=True, methods=['patch'])
    def set_role(self, request, pk=None):
        u = self.get_object()
        role = request.data.get('role')
        if role not in ('ADMIN','CLIENT','admin','customer'):
            return Response({'detail':'role inválido'}, status=400)
        u.role = 'admin' if role in ('ADMIN','admin') else 'customer'
        u.is_staff = (u.role == 'admin')
        u.save()
        create_audit(request.user, 'admin_user_set_role', 'user', u.id, f'role={u.role}')
        return Response(AdminProfileSerializer(u).data)

class AdminSupportViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminSupportTicketSerializer
    pagination_class = AdminPagination
    queryset = SupportTicket.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        ser = AdminTicketMessageSerializer(data={'ticket': ticket.id, 'user': request.user.id, 'message': request.data.get('message','')})
        ser.is_valid(raise_exception=True)
        msg = ser.save()
        create_audit(request.user, 'admin_support_reply', 'ticket', ticket.id, 'Respuesta de soporte')
        return Response(AdminTicketMessageSerializer(msg).data, status=201)

class AdminAuditViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AuditSerializer
    pagination_class = AdminPagination
    queryset = Audit.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.query_params.get('user')
        entity = self.request.query_params.get('entity')
        if user:
            qs = qs.filter(user_id=user)
        if entity:
            qs = qs.filter(details__icontains=f"entity={entity}")
        return qs

class CloudProxyView(APIView):
    permission_classes = [IsAdminRole]
    def post(self, request, *args, **kwargs):
        target = kwargs.get('target')
        url = os.getenv('CLOUD_PROMO_URL') if target == 'promo' else os.getenv('CLOUD_INVENTORY_URL')
        if not url:
            return Response({'detail':'URL no configurada'}, status=400)
        try:
            r = requests.post(url, json=request.data, timeout=30)
            create_audit(request.user, f'cloud_{target}', details=f'status={r.status_code}', data=request.data)
            return Response({'status': r.status_code, 'data': r.json() if r.content else None})
        except Exception as e:
            create_audit(request.user, f'cloud_{target}_error', details=str(e))
            return Response({'detail': str(e)}, status=500)
