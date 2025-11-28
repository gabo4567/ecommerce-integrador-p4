import json
from django.urls import reverse
from rest_framework.test import APIClient
import pytest
from users.models import User
from products.models import Product, Category

@pytest.mark.django_db
def test_is_admin_required():
    client = APIClient()
    # client no autenticado
    resp = client.get('/api/admin/products/')
    assert resp.status_code in (401,403)

@pytest.mark.django_db
def test_admin_products_mine_and_all():
    admin = User.objects.create_user(username='administrador', password='Admin123!', role='admin', is_staff=True)
    cat = Category.objects.create(name='Electrónica')
    p1 = Product.objects.create(name='A', description='', price=1, stock=1, category=cat, created_by=admin)
    p2 = Product.objects.create(name='B', description='', price=1, stock=1, category=cat)
    client = APIClient()
    client.force_authenticate(user=admin)
    r_all = client.get('/api/admin/products/')
    assert r_all.status_code == 200
    assert any(x['id']==p1.id for x in r_all.data['results'])
    assert any(x['id']==p2.id for x in r_all.data['results'])
    r_mine = client.get('/api/admin/products/mine/')
    assert r_mine.status_code == 200
    ids = [x['id'] for x in r_mine.data['results']]
    assert p1.id in ids and p2.id not in ids

