from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import PermissionDenied
from .models import Product, Category, ProductVariant, ProductSpec, ProductImage
from .serializers import ProductSerializer, CategorySerializer, ProductVariantSerializer, ProductSpecSerializer, ProductImageSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear categorías.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar categorías.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede eliminar categorías.")
        instance.active = False
        instance.save(update_fields=['active'])

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear productos.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar productos.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede eliminar productos.")
        instance.active = False
        instance.save(update_fields=['active'])

# VARIANTS
class ProductVariantListCreateView(generics.ListCreateAPIView):
    queryset = ProductVariant.objects.filter(active=True)
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear variantes.")
        serializer.save()

class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar variantes.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede eliminar variantes.")
        instance.active = False
        instance.save(update_fields=['active'])

# SPECS
class ProductSpecListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSpecSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        qs = ProductSpec.objects.filter(active=True)
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear especificaciones.")
        serializer.save()

class ProductSpecDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductSpec.objects.all()
    serializer_class = ProductSpecSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar especificaciones.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede eliminar especificaciones.")
        instance.active = False
        instance.save(update_fields=['active'])

# IMAGES
class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        qs = ProductImage.objects.filter(active=True)
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede crear imágenes.")
        serializer.save()

class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede actualizar imágenes.")
        serializer.save()
    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Solo staff puede eliminar imágenes.")
        instance.active = False
        instance.save(update_fields=['active'])
