from django.db import migrations, models
class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_passwordresetcode'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresetcode',
            name='expires_at',
            field=models.DateTimeField(),
        ),
    ]
