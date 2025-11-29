from rest_framework import serializers
from users.models import User
from products.models import Product, ProductVariant, ProductSpec, ProductImage, Category
from orders.models import Order, Shipment, OrderStatusHistory
from system.models import SupportTicket, TicketMessage, Audit

class AdminProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'display_name']
    def get_role(self, obj):
        return 'ADMIN' if obj.role == 'admin' or obj.is_staff else 'CLIENT'
    def get_display_name(self, obj):
        return 'Administrador' if (obj.role == 'admin' or obj.is_staff) else (obj.first_name or obj.email or obj.username)

class AdminProductSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False)
    class Meta:
        model = Product
        fields = ['id','name','description','price','stock','category','category_id','created_by','created_at']

class AdminOrderSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = Order
        fields = ['id','user','user_username','user_email','created_at','status','total']

class AdminShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ['id','order','address','carrier','tracking_number','status','shipped_date','delivered_date']

class AdminSupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['id','user','order','product','subject','message','status','priority','created_at']

class AdminTicketMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketMessage
        fields = ['id','ticket','user','message','created_at']

class AuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audit
        fields = ['id','user','action','created_at','details']

