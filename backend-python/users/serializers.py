from rest_framework import serializers
from typing import Any, Dict, Optional, cast
from typing import Any, Dict, Optional, cast
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import PasswordResetCode
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from django.utils import timezone
from .emails import (
    send_password_reset_code_email,
    send_password_changed_email,
    send_password_reset_confirmed_email,
)

User = cast(Any, get_user_model())

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone', 'address', 'role', 'date_joined']
        extra_kwargs = {'password': {'write_only': True}}

    def get_role(self, obj):
        return 'admin' if getattr(obj, 'is_staff', False) or getattr(obj, 'is_superuser', False) else 'user'

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'customer')
        token['is_staff'] = user.is_staff
        return token


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        if email and not attrs.get('username'):
            try:
                user = User.objects.get(email__iexact=email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass
        return super().validate(attrs)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        user = self.context['request'].user
        current_password = cast(str, attrs.get('current_password', ''))
        new_password = cast(str, attrs.get('new_password', ''))
        confirm_password = cast(str, attrs.get('confirm_password', ''))
        if not user.check_password(current_password):
            raise serializers.ValidationError({'current_password': 'Contraseña actual incorrecta'})
        if new_password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'La confirmación no coincide'})
        if current_password == new_password:
            raise serializers.ValidationError({'new_password': 'La nueva contraseña no puede ser igual a la actual'})
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            msgs = [str(m) for m in getattr(e, 'messages', [str(e)])]
            raise serializers.ValidationError({'new_password': msgs})
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        vd = cast(Dict[str, Any], self.validated_data)
        new_password = cast(str, vd.get('new_password', ''))
        user.set_password(new_password)
        user.save()
        # Email de notificación (HTML)
        if user.email:
            # Incluye fecha/hora actual para mostrar en plantilla
            send_password_changed_email(user)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        User = get_user_model()
        email = cast(str, attrs.get('email', ''))
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # No revelamos si existe o no (respuesta uniforme)
            attrs['user'] = None
            return attrs
        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        vd = cast(Dict[str, Any], self.validated_data)
        user = cast(Optional[Any], vd.get('user'))
        if not user:
            return None
        # Generar código simple de 6 dígitos alfanumérico
        code = ''.join(random.choices(string.digits, k=6))
        prc = PasswordResetCode.objects.create(user=user, code=code)
        if user.email:
            # Usa plantilla HTML con branding
            send_password_reset_code_email(user, code, expires_minutes=2)
        return prc


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        User = get_user_model()
        email = cast(str, attrs.get('email', ''))
        code = cast(str, attrs.get('code', ''))
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Usuario no encontrado'})

        try:
            prc = PasswordResetCode.objects.filter(user=user, code=code).latest('created_at')
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError({'code': 'Código inválido'})

        if not prc.is_valid():
            raise serializers.ValidationError({'code': 'Código expirado o ya usado'})

        new_password = cast(str, attrs.get('new_password', ''))
        confirm_password = cast(str, attrs.get('confirm_password', ''))
        if new_password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'La confirmación no coincide'})

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})

        attrs['user'] = user
        attrs['prc'] = prc
        return attrs

    def save(self, **kwargs):
        vd = cast(Dict[str, Any], self.validated_data)
        user = cast(Any, vd.get('user'))
        prc = cast(PasswordResetCode, vd.get('prc'))
        new_password = cast(str, vd.get('new_password', ''))
        user.set_password(new_password)
        user.save()
        prc.used = True
        prc.save()
        # Email de confirmación (HTML)
        if user.email:
            send_password_reset_confirmed_email(user)
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'is_staff', 'is_active']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password(User.objects.make_random_password())
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
