from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from .models import SystemSetting, Audit, SupportTicket, TicketMessage
from .serializers import SystemSettingSerializer, AuditSerializer, SupportTicketSerializer, TicketMessageSerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        ticket = self.get_object()
        if not (request.user.is_staff or ticket.user_id == request.user.id):
            raise PermissionDenied("No tienes permiso para actualizar este ticket.")
        data = {}
        if 'priority' in request.data:
            data['priority'] = request.data['priority']
        if 'status' in request.data:
            data['status'] = request.data['status']
        serializer = self.get_serializer(ticket, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        if 'status' in data and data['status'] == 'closed' and instance.closed_at is None:
            instance.closed_at = timezone.now()
            instance.save(update_fields=['closed_at'])
            Audit.objects.create(user=request.user, action='support_ticket_closed', details=f"Ticket {instance.id} cerrado")
        return Response(self.get_serializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        ticket = self.get_object()
        if request.user.is_staff:
            # Soft delete: cerrar ticket en lugar de borrar
            if ticket.status != 'closed':
                ticket.status = 'closed'
                ticket.closed_at = timezone.now()
                ticket.save(update_fields=['status', 'closed_at'])
            Audit.objects.create(user=request.user, action='support_ticket_closed', details=f"Ticket {ticket.id} cerrado por staff")
            return Response(status=status.HTTP_204_NO_CONTENT)
        if ticket.user_id != request.user.id:
            raise PermissionDenied("No puedes eliminar este ticket.")
        if ticket.status != 'closed':
            ticket.status = 'closed'
            ticket.closed_at = timezone.now()
            ticket.save(update_fields=['status', 'closed_at'])
            Audit.objects.create(user=request.user, action='support_ticket_closed', details=f"Ticket {ticket.id} cerrado por cliente")
        return Response(status=status.HTTP_204_NO_CONTENT)

class AuditListCreateView(generics.ListCreateAPIView):
    queryset = Audit.objects.all().order_by('-created_at')
    serializer_class = AuditSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SystemSettingListView(generics.ListAPIView):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [permissions.AllowAny]

class SystemSettingDetailUpdateView(generics.RetrieveUpdateAPIView):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    lookup_field = 'key'

    def get_permissions(self):
        if self.request.method in ('PATCH', 'PUT'):
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        setting = self.get_object()
        Audit.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action='system_setting_updated',
            details=f"Key={setting.key} Value={setting.value}"
        )
        return response

class SupportTicketMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_ticket(self):
        return SupportTicket.objects.get(pk=self.kwargs['ticket_id'])

    def get_queryset(self):
        ticket = self.get_ticket()
        if not (self.request.user.is_staff or ticket.user_id == self.request.user.id):
            raise PermissionDenied("No tienes permiso para ver este ticket.")
        return TicketMessage.objects.filter(ticket=ticket).order_by('created_at')

    def perform_create(self, serializer):
        ticket = self.get_ticket()
        if not (self.request.user.is_staff or ticket.user_id == self.request.user.id):
            raise PermissionDenied("No tienes permiso para escribir en este ticket.")
        serializer.save(user=self.request.user, ticket=ticket)
