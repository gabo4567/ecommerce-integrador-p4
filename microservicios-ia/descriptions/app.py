from flask import Flask, jsonify, request
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

def _compose_description(name: str, category: str, attributes: dict):
    parts = []
    parts.append(f"{name}: experiencia {category} diseñada para destacar")
    if attributes:
        attrs = ", ".join([f"{k}: {v}" for k, v in attributes.items()])
        parts.append(f"Características: {attrs}")
    parts.append("Optimizado para rendimiento y confiabilidad, ideal para quienes exigen más.")
    return " ".join(parts)

def _llm_generate(name: str, category: str, attributes: dict):
    api_key = os.getenv("OPENAI_API_KEY", "")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not api_key:
        return _compose_description(name, category, attributes)
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        prompt = (
            "Redacta una descripción persuasiva y breve (80-120 palabras) para un producto de tecnología. "
            f"Nombre: {name}. Categoría: {category}. Atributos: {attributes}. "
            "Usa tono elegante, enfatiza beneficios y termina con una llamada a la acción."
        )
        resp = client.chat.completions.create(model=model, messages=[{"role": "user", "content": prompt}])
        text = resp.choices[0].message.content.strip()
        return text
    except Exception:
        return _compose_description(name, category, attributes)

@app.post("/generate-description/")
def generate_description():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    category = payload.get("category")
    attributes = payload.get("attributes", {})
    if not name or not category:
        return jsonify({"error": "missing_name_or_category"}), 400
    desc = _llm_generate(str(name), str(category), attributes if isinstance(attributes, dict) else {})
    return jsonify({"description": desc})

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5002"))
    app.run(host="0.0.0.0", port=port)

