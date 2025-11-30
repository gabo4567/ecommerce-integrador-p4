import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000/api/';
const CF_BASE = import.meta.env.VITE_CF_BASE_URL || 'http://127.0.0.1:5001/proyectoprog4-fb1eb/us-central1/';
const TOKEN = import.meta.env.VITE_SERVICE_TOKEN || localStorage.getItem('SERVICE_ACCESS_TOKEN') || '';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
});

export const cf = axios.create({
  baseURL: CF_BASE,
  headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
});

export const cfEnabled = Boolean(import.meta.env.VITE_CF_BASE_URL);

