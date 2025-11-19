from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


def default_expiry():
    return timezone.now() + timedelta(minutes=2)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordResetCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(default=default_expiry)),
                ('used', models.BooleanField(default=False)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reset_codes', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]