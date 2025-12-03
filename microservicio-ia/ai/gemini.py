from typing import Optional, Any
import os
import importlib
_genai: Any = None
try:
    _genai = importlib.import_module("google.generativeai")
except Exception:
    _genai = None

def _compose_description(name: str, price: float, specs: Optional[str]) -> str:
    base = (
        f"{name} es una opción ideal para quienes buscan calidad y rendimiento en su día a día. "
        f"Con un precio de ${price:,.2f}, ofrece una experiencia confiable y alineada a las necesidades del usuario. "
        "Su diseño práctico y la construcción sólida permiten un uso prolongado con resultados consistentes. "
        "Entre sus beneficios se destacan la facilidad de uso, el desempeño equilibrado y la versatilidad para distintas situaciones. "
        "Sus características principales se orientan a maximizar la utilidad sin complicaciones, manteniendo una estética moderna y funcional. "
    )
    add = (
        f"Especificaciones: {specs}. " if specs else ""
    )
    tail = (
        "Una elección recomendada para quienes priorizan valor y funcionalidad. "
        "Descubrí cómo puede mejorar tu rutina y llevá tu experiencia al siguiente nivel."
    )
    return (base + add + tail).strip()

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.enabled = bool(key) and (_genai is not None)
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.model: Any = None
        if self.enabled:
            try:
                _genai.configure(api_key=key)
                self.model = _genai.GenerativeModel(self.model_name)
            except Exception:
                self.enabled = False
                self.model = None

    def generate_description(self, name: str, price: float, specs: Optional[str] = None) -> str:
        if not self.enabled or not self.model:
            return _compose_description(name, price, specs)
        prompt = (
            "Actuá como un redactor profesional de e-commerce. Generá una descripción clara y orientada a ventas usando estos datos:\n"
            f"- Nombre: {name}\n"
            f"- Precio: {price}\n"
            f"- Especificaciones: {specs or 'N/D'}\n"
            "La descripción debe explicar qué es el producto, para qué sirve, beneficios, características principales y diferenciales sin inventar información. "
            "Extensión: entre 120 y 200 palabras. Español neutro. Evita información no verificable."
        )
        try:
            resp = self.model.generate_content(prompt)
            text = getattr(resp, "text", "")
            return text.strip() or _compose_description(name, price, specs)
        except Exception:
            return _compose_description(name, price, specs)

    def generate_specs(self, name: str, price: float, image_url: Optional[str] = None) -> dict:
        if not self.enabled or not self.model:
            # Fallback heurístico mínimo
            return {
                "brand": "Marca genérica premium",
                "model": f"Modelo {name[:12].strip()}",
                "color": "Negro",
                "weight": "1.2 kg",
                "dimensions": "N/D",
                "materials": "Plástico y metal",
                "warranty": "12 meses",
                "features": ["Diseño funcional", "Buen rendimiento"],
                "usage": "Uso diario y general",
                "short_description": _compose_description(name, price, None)[:260]
            }
        prompt = (
            "Generá especificaciones realistas y específicas de un producto basándote solo en nombre, imagen y precio. "
            "Ignora la categoría. Responde estrictamente en JSON con estas claves: "
            "brand, model, color, weight, dimensions, materials, warranty, features (array), usage, short_description. "
            "No inventes características imposibles. El color debe ajustarse a la imagen si es claro. Español.\n"
            f"Nombre: {name}\nPrecio: {price}\nImagen: {image_url or 'N/D'}\n"
        )
        try:
            resp = self.model.generate_content(prompt)
            text = getattr(resp, "text", "").strip()
            import json
            data = json.loads(text)
            return data
        except Exception:
            return {
                "brand": "Marca genérica premium",
                "model": f"Modelo {name[:12].strip()}",
                "color": "Negro",
                "weight": "1.2 kg",
                "dimensions": "N/D",
                "materials": "Plástico y metal",
                "warranty": "12 meses",
                "features": ["Diseño funcional", "Buen rendimiento"],
                "usage": "Uso diario y general",
                "short_description": _compose_description(name, price, None)[:260]
            }
