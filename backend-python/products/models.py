from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# -----------------------------
# Variantes de producto (SKU)
# -----------------------------
class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=64, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=50, blank=True)
    storage = models.CharField(max_length=50, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['active']),
        ]

    def __str__(self):
        return f"Variant {self.sku} of product {self.product_id}"


# -----------------------------
# Especificaciones (ficha técnica)
# -----------------------------
class ProductSpec(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specs')
    key = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    unit = models.CharField(max_length=20, blank=True)
    display_order = models.IntegerField(default=0)
    searchable = models.BooleanField(default=True)

    class Meta:
        unique_together = ('product', 'key')
        indexes = [
            models.Index(fields=['product', 'key']),
        ]
        ordering = ['display_order', 'key']

    def __str__(self):
        return f"{self.key}: {self.value} ({self.product_id})"


# -----------------------------
# Imágenes de producto
# -----------------------------
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    variant = models.ForeignKey('ProductVariant', on_delete=models.CASCADE, null=True, blank=True, related_name='images')
    url = models.URLField(max_length=500)
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['variant']),
            models.Index(fields=['is_primary']),
        ]
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return f"Image for product {self.product_id} (variant {self.variant_id or 'none'})"


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    comment = models.TextField(blank=True)
    rating = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['product', 'user']),
        ]

    def __str__(self):
        return f"Review {self.rating} for product {self.product_id} by {self.user_id}"
