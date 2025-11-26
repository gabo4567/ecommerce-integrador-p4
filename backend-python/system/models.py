from django.db import models
from django.conf import settings


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.key


class Policy(models.Model):
    name = models.CharField(max_length=100)
    condition = models.CharField(max_length=255)
    action = models.CharField(max_length=255)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Audit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)


class Log(models.Model):
    level = models.CharField(max_length=50)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# ---------------------------------------------
# Soporte (tickets)
# ---------------------------------------------
class SupportTicket(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=50, default='open')
    priority = models.CharField(max_length=20, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"Ticket {self.id} ({self.status}) by {self.user_id}"

class TicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['ticket'], name='system_ticket_id_idx')]

    def __str__(self):
        return f"Msg {self.id} ticket {self.ticket_id}"
