from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone


def display_name(user):
    full_name = (user.get_full_name() or '').strip()
    if full_name:
        return full_name
    return user.username or user.email or 'Usuario'


def send_templated_email(to_email: str, subject: str, template_name: str, context: dict, fail_silently: bool = False):
    html_content = render_to_string(template_name, context)
    text_content = strip_tags(html_content)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com'),
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=fail_silently)


def send_password_reset_code_email(user, code: str, expires_minutes: int = 2):
    subject = f"Código de recuperación de contraseña - {settings.SITE_NAME}"
    context = {
        'site_name': settings.SITE_NAME,
        'site_url': settings.SITE_URL,
        'name': display_name(user),
        'code': code,
        'expires_minutes': expires_minutes,
    }
    send_templated_email(
        to_email=user.email,
        subject=subject,
        template_name='users/password_reset_code_email.html',
        context=context,
    )


def send_password_changed_email(user):
    subject = f"Contraseña actualizada exitosamente - {settings.SITE_NAME}"
    context = {
        'site_name': settings.SITE_NAME,
        'site_url': settings.SITE_URL,
        'name': display_name(user),
        'now': timezone.now().strftime('%d/%m/%Y, %H:%M:%S'),
    }
    send_templated_email(
        to_email=user.email,
        subject=subject,
        template_name='users/password_changed_email.html',
        context=context,
    )


def send_password_reset_confirmed_email(user):
    subject = f"Tu contraseña ha sido restablecida - {settings.SITE_NAME}"
    context = {
        'site_name': settings.SITE_NAME,
        'site_url': settings.SITE_URL,
        'name': display_name(user),
    }
    send_templated_email(
        to_email=user.email,
        subject=subject,
        template_name='users/password_reset_confirmed_email.html',
        context=context,
    )
