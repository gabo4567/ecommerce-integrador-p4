from django.core.management.base import BaseCommand
from products.models import Product

class Command(BaseCommand):
    help = "Establece stock=10 para todos los productos"

    def add_arguments(self, parser):
        parser.add_argument('--value', type=int, default=10, help='Valor de stock a establecer (por defecto 10)')

    def handle(self, *args, **options):
        value = options['value']
        updated = Product.objects.all().update(stock=value)
        self.stdout.write(self.style.SUCCESS(f"Stock actualizado a {value} para {updated} productos"))

