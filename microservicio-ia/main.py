import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ai.gemini import GeminiService

load_dotenv()

class GenerateInput(BaseModel):
    name: str = Field(..., min_length=1)
    price: float = Field(..., ge=0)
    specs: Optional[str] = None

app = FastAPI()

origins = os.getenv("ALLOW_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origins] if origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

svc = GeminiService()

@app.get("/", response_class=PlainTextResponse)
async def root():
    return "Microservicio de IA funcionando correctamente"

@app.post("/api/generate-description")
async def generate_description(payload: GenerateInput):
    try:
        text = svc.generate_description(payload.name.strip(), float(payload.price), (payload.specs or "").strip() or None)
        return {"description": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail="error_generating_description")

class SpecInput(BaseModel):
    name: str
    price: float
    image_url: Optional[str] = None

@app.post("/api/generate-specs")
async def generate_specs(payload: SpecInput):
    try:
        data = svc.generate_specs(payload.name.strip(), float(payload.price), (payload.image_url or "").strip() or None)
        return data
    except Exception:
        raise HTTPException(status_code=500, detail="error_generating_specs")

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5002"))
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
