import os
from pathlib import Path
from dotenv import load_dotenv

# ------------------------------------------------------------
# BASE CONFIG
# ------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')   # carga backend-python/.env

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret')
DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = ['*']  # para desarrollo


# ------------------------------------------------------------
# APPS
# ------------------------------------------------------------
INSTALLED_APPS = [
    # Django apps por defecto
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceros
    'rest_framework',
    'corsheaders',

    # Apps del proyecto
    'users',
    'products',
    'orders',
    'system',
]


# ------------------------------------------------------------
# MIDDLEWARE
# ------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True  # sólo para desarrollo


# ------------------------------------------------------------
# URLS / WSGI
# ------------------------------------------------------------
ROOT_URLCONF = 'core.urls'

WSGI_APPLICATION = 'core.wsgi.application'


# ------------------------------------------------------------
# DATABASE
# ------------------------------------------------------------
DB_ENGINE = os.getenv('DB_ENGINE', 'postgres')
if DB_ENGINE == 'sqlite':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }


# ------------------------------------------------------------
# TEMPLATES (requerido por el panel de administración)
# ------------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ------------------------------------------------------------
# REST FRAMEWORK
# ------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}


# ------------------------------------------------------------
# AUTH & USER MODEL
# ------------------------------------------------------------
AUTH_USER_MODEL = 'users.User'


# ------------------------------------------------------------
# STATIC FILES
# ------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ------------------------------------------------------------
# CONFIG ADICIONAL
# ------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


from datetime import timedelta

# ------------------------------------------------------------
# JWT CONFIGURATION
# ------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),    # Access token dura 1 hora
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),    # Refresh token dura 7 días
    'ROTATE_REFRESH_TOKENS': True,                  # opcional, seguridad extra
}

# Ajustar REST_FRAMEWORK si no tiene JWT incluido
REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = (
    'rest_framework_simplejwt.authentication.JWTAuthentication',
)

# ------------------------------------------------------------
# EMAIL (configurable por entorno, por defecto consola)
# ------------------------------------------------------------
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '0') or 0)
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', '0') == '1'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', '0') == '1'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'no-reply@example.com')

# ------------------------------------------------------------
# Branding del sitio (para emails y enlaces)
# ------------------------------------------------------------
SITE_NAME = os.getenv('SITE_NAME', 'Feraytek')
SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')
