from django.urls import path, include

urlpatterns = [
    path('api/users/', include('users.urls')),
    path('api/', include('products.urls')),
    path('api/', include('orders.urls')),
]
