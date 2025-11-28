from django.db import models
from django.conf import settings
from products.models import Product, ProductVariant

class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='pending')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

# ---------------------------------------------
# Facturación y Pagos
# ---------------------------------------------

class Invoice(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='invoices')
    number = models.CharField(max_length=50)
    issue_date = models.DateField()
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='pending')  # pending, paid, void

    def __str__(self):
        return f"Invoice {self.number} (order {self.order_id})"


class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='pending')  # pending, approved, rejected
    transaction_id = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Payment {self.amount} for order {self.order_id}"


# ---------------------------------------------
# Descuentos
# ---------------------------------------------

class Discount(models.Model):
    name = models.CharField(max_length=100, unique=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class OrderDiscount(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_discounts')
    discount = models.ForeignKey(Discount, on_delete=models.PROTECT)
    applied_at = models.DateTimeField(auto_now_add=True)


# ---------------------------------------------
# Envíos
# ---------------------------------------------

class Shipment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='shipments')
    address = models.CharField(max_length=255)
    carrier = models.CharField(max_length=100)
    tracking_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, default='preparing')  # preparing, shipped, delivered, cancelled
    shipped_date = models.DateField(null=True, blank=True)
    delivered_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Shipment {self.tracking_number or 'N/A'} for order {self.order_id}"

    # El disparo del webhook se mueve a ShipmentViewSet.perform_update


# ---------------------------------------------
# Historial de estados del pedido
# ---------------------------------------------
class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['new_status']),
        ]

    def __str__(self):
        return f"Order {self.order_id}: {self.old_status} -> {self.new_status}"
