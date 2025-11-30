from rest_framework import serializers
from .models import Order, OrderItem, Invoice, Payment, Shipment, Discount, OrderDiscount, OrderStatusHistory
from products.models import Product
from products.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    class Meta:
        model = OrderItem
        fields = '__all__'

    def validate(self, attrs):
        product = attrs.get('product') or getattr(self.instance, 'product', None)
        quantity = attrs.get('quantity') or getattr(self.instance, 'quantity', None)
        if product is not None and quantity is not None:
            try:
                stock = int(getattr(product, 'stock', 0))
            except (TypeError, ValueError):
                stock = 0
            if stock >= 0 and int(quantity) > stock:
                raise serializers.ValidationError({'quantity': 'stock_insuficiente'})
        return attrs

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
            'total': {'read_only': True},
            'created_at': {'read_only': True},
        }

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = '__all__'

class OrderDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDiscount
        fields = '__all__'

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'
