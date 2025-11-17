from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet,
    ProductVariantListCreateView, ProductVariantDetailView,
    ProductSpecListCreateView, ProductSpecDetailView,
    ProductImageListCreateView, ProductImageDetailView,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('variants/', ProductVariantListCreateView.as_view()),
    path('variants/<int:pk>/', ProductVariantDetailView.as_view()),
    path('specs/', ProductSpecListCreateView.as_view()),
    path('specs/<int:pk>/', ProductSpecDetailView.as_view()),
    path('images/', ProductImageListCreateView.as_view()),
    path('images/<int:pk>/', ProductImageDetailView.as_view()),
]
