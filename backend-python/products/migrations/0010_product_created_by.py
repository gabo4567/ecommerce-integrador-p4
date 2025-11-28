from django.db import migrations, models
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [
        ('products', '0003_productvariant_productimage_productspec_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='created_by',
            field=models.ForeignKey(null=True, blank=True, on_delete=models.SET_NULL, related_name='created_products', to=settings.AUTH_USER_MODEL),
        ),
    ]

