# Microservicio de IA — Descripciones de Productos (Gemini)

## Objetivo
Generar descripciones profesionales de productos para el e-commerce mediante un endpoint HTTP y la API de Gemini.

## Endpoints
- POST `/api/generate-description`
  - Body JSON:
    - `name` (string)
    - `price` (number)
    - `specs` (string opcional)
  - Respuesta JSON:
    - `{ "description": "texto generado..." }`

## Variables de entorno
Crea `.env` en esta carpeta con:
```
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-1.5-flash
PORT=5002
ALLOW_ORIGINS=*
```

## Instalación y ejecución
```
python -m venv .venv
.venv/Scripts/activate  # Windows
pip install -r requirements.txt
python main.py
```

## Notas
- Usa FastAPI + Uvicorn.
- El prompt guía la redacción orientada a ventas, en español, con extensión entre 120 y 200 palabras.
- Si el modelo no puede verificar especificaciones, mantiene la redacción sin inventar información.
