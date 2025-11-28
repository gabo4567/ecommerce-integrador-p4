from django.core.management.base import BaseCommand
from products.models import Product, ProductSpec

class Command(BaseCommand):
    help = "Crea especificaciones de ejemplo para todos los productos que no tienen especificaciones"

    def handle(self, *args, **options):
        created_total = 0
        for p in Product.objects.all():
            if ProductSpec.objects.filter(product=p).exists():
                continue
            specs = [
                { 'key': 'Marca', 'value': 'Genérica', 'unit': '' },
                { 'key': 'Modelo', 'value': f'Model {p.id}', 'unit': '' },
                { 'key': 'Color', 'value': 'Negro', 'unit': '' },
                { 'key': 'Peso', 'value': '1.2', 'unit': 'kg' },
                { 'key': 'Garantía', 'value': '12', 'unit': 'meses' },
            ]
            for i, s in enumerate(specs):
                ProductSpec.objects.create(product=p, key=s['key'], value=s['value'], unit=s['unit'], display_order=i)
                created_total += 1
        self.stdout.write(self.style.SUCCESS(f"Especificaciones creadas: {created_total}"))

