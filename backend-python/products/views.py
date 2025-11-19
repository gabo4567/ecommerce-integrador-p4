from rest_framework import viewsets, permissions, generics
from .models import Product, Category, ProductVariant, ProductSpec, ProductImage
from .serializers import ProductSerializer, CategorySerializer, ProductVariantSerializer, ProductSpecSerializer, ProductImageSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    # Cambiado para permitir GET sin token y POST solo a usuarios autenticados
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# VARIANTS
class ProductVariantListCreateView(generics.ListCreateAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# SPECS
class ProductSpecListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSpecSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return ProductSpec.objects.filter(product_id=product_id)
        return ProductSpec.objects.all()

class ProductSpecDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductSpec.objects.all()
    serializer_class = ProductSpecSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# IMAGES
class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return ProductImage.objects.filter(product_id=product_id)
        return ProductImage.objects.all()

class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
