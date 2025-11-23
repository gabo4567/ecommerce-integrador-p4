from flask import Flask, request, jsonify
import os
import time
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

PRODUCTS = pd.DataFrame([
    {"id": 101, "name": "Laptop Pro 16\"", "category": "laptops", "price": 1499, "tags": "laptop performance pro metal"},
    {"id": 102, "name": "Smartphone Ultra", "category": "smartphones", "price": 999, "tags": "smartphone camera oled 5g"},
    {"id": 103, "name": "Wireless Headphones", "category": "audio", "price": 199, "tags": "headphones wireless noise-cancel"},
    {"id": 104, "name": "4K Monitor 27\"", "category": "monitors", "price": 399, "tags": "monitor 4k ips 27-inch"},
    {"id": 105, "name": "Mechanical Keyboard RGB", "category": "peripherals", "price": 129, "tags": "keyboard mechanical rgb"},
    {"id": 106, "name": "Gaming Mouse", "category": "peripherals", "price": 79, "tags": "mouse gaming dpi ergonomic"},
    {"id": 107, "name": "USB-C Docking Station", "category": "accessories", "price": 149, "tags": "dock usb-c ports hub"},
    {"id": 108, "name": "Portable SSD 1TB", "category": "storage", "price": 169, "tags": "ssd portable fast nvme"},
])

USER_HISTORY = {
    1: {"purchased": [101, 103], "viewed": [104, 108]},
    2: {"purchased": [102], "viewed": [103, 105, 106]},
    3: {"purchased": [], "viewed": [104, 107]},
}

CACHE = {}
CACHE_TTL_SECONDS = int(os.getenv("RECS_CACHE_TTL", "300"))

def _get_similarity_matrix(df: pd.DataFrame):
    vectorizer = TfidfVectorizer(stop_words="english")
    X = vectorizer.fit_transform(df["tags"].fillna(""))
    sim = cosine_similarity(X)
    return sim

SIM_MATRIX = _get_similarity_matrix(PRODUCTS)

def _recommend_for_user(user_id: int, limit: int = 5):
    hist = USER_HISTORY.get(user_id, {"purchased": [], "viewed": []})
    seed_ids = list(set((hist.get("purchased") or []) + (hist.get("viewed") or [])))
    if not seed_ids:
        return PRODUCTS.sample(min(limit, len(PRODUCTS))).to_dict(orient="records")
    idx_map = {pid: PRODUCTS.index[PRODUCTS["id"] == pid][0] for pid in seed_ids if pid in set(PRODUCTS["id"]) }
    scores = pd.Series(0.0, index=PRODUCTS.index)
    for pid, idx in idx_map.items():
        scores += SIM_MATRIX[idx]
    seen = set(hist.get("purchased", [])) | set(hist.get("viewed", []))
    ranked = scores.sort_values(ascending=False).index
    recs = []
    for i in ranked:
        pid = int(PRODUCTS.loc[i, "id"])
        if pid in seen:
            continue
        recs.append(PRODUCTS.loc[i].to_dict())
        if len(recs) >= limit:
            break
    if not recs:
        recs = PRODUCTS.sample(min(limit, len(PRODUCTS))).to_dict(orient="records")
    return recs

@app.get("/recommendations/")
def get_recommendations():
    try:
        user_id = int(request.args.get("user_id", "0"))
        limit = int(request.args.get("limit", "5"))
    except ValueError:
        return jsonify({"error": "invalid_parameters"}), 400
    now = time.time()
    cache_key = f"u:{user_id}:l:{limit}"
    entry = CACHE.get(cache_key)
    if entry and now - entry["ts"] < CACHE_TTL_SECONDS:
        return jsonify({"user_id": user_id, "items": entry["data"]})
    data = _recommend_for_user(user_id, limit)
    CACHE[cache_key] = {"ts": now, "data": data}
    return jsonify({"user_id": user_id, "items": data})

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port)

