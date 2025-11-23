<<<<<<< HEAD
from django.db import migrations, models
=======
﻿from django.db import migrations, models
>>>>>>> origin/feat/system-support-api
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('system', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TicketMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ticket', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='system.supportticket')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
<<<<<<< HEAD
                'indexes': [models.Index(fields=['ticket'], name='system_ticketmessage_ticket_idx')],
=======
                'indexes': [models.Index(fields=['ticket'])],
>>>>>>> origin/feat/system-support-api
            },
        ),
    ]
