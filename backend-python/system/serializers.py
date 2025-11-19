from rest_framework import serializers
from .models import SystemSetting, Audit, SupportTicket, TicketMessage

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = '__all__'

class AuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audit
        fields = '__all__'

class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'closed_at')

class TicketMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketMessage
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'ticket')
