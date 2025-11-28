import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Favorites helpers
const favKey = 'favoriteProductIds'
export function getFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem(favKey) || '[]') as number[] } catch { return [] }
}
export function toggleFavorite(id: number): number[] {
  const current = new Set(getFavorites())
  if (current.has(id)) current.delete(id); else current.add(id)
  const arr = Array.from(current)
  try { localStorage.setItem(favKey, JSON.stringify(arr)) } catch {}
  return arr
}
export function isFavorite(id: number): boolean {
  return getFavorites().includes(id)
}

// Ratings helpers (client-side)
const ratingKey = 'productRatings'
export function getRating(id: number): number {
  try { const map = JSON.parse(localStorage.getItem(ratingKey) || '{}') as Record<string, number>; return Number(map[id] || 0) } catch { return 0 }
}
export function setRating(id: number, rating: number): void {
  const r = Math.min(5, Math.max(1, Math.round(rating)))
  try {
    const map = JSON.parse(localStorage.getItem(ratingKey) || '{}') as Record<string, number>
    map[id] = r
    localStorage.setItem(ratingKey, JSON.stringify(map))
  } catch {}
}

const normalize = (s: any): string => String(s || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

export function norm(s: any): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export const categoryPlaceholders: Record<string, string> = {
  indumentaria: 'https://i.pinimg.com/originals/86/ec/f7/86ecf7168d1b00f2092d17efb015b4cf.jpg',
  'hogar y cocina': 'https://atma.com.ar/media/catalog/product/cache/ae9e075ae40cb829d8245867e0850560/a/s/ast1523pi_catalogo.jpg',
  'deportes y fitness': 'https://cdn.pixabay.com/photo/2016/05/27/14/33/football-1419954_1280.jpg',
  tecnologia: 'https://laptopmedia.com/wp-content/uploads/2023/02/3-1-e1675262338300.jpg',
}

export const defaultProductPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'>Sin imagen</text></svg>"

export function getProductImageSrc(product: any): string {
  const first = product?.images && product.images[0]?.url
  const isGeneric = (u: any) => {
    const s = String(u || '')
    return !s || s.startsWith('data:image/svg+xml') || s.includes('placeholder') || s.includes('dummyimage') || s.includes('via.placeholder.com')
  }
  if (first && !isGeneric(first)) return first
  const catName = product?.category?.name || ''
  const byCat = categoryPlaceholders[normalize(catName)]
  return byCat || defaultProductPlaceholder
}

export function getProductImageCandidates(product: any): string[] {
  const candidates: string[] = []
  const catNorm = normalize(product?.category?.name || '')
  const byCat = categoryPlaceholders[catNorm]
  if (catNorm === 'hogar y cocina') {
    if (byCat) candidates.push(byCat)
  } else if (catNorm === 'indumentaria') {
    if (byCat) candidates.push(byCat)
  } else if (catNorm === 'deportes y fitness') {
    if (byCat) candidates.push(byCat)
  } else if (catNorm === 'tecnologia') {
    if (byCat) candidates.push(byCat)
  } else {
    const first = product?.images && product.images[0]?.url
    const isGeneric = (u: any) => {
      const s = String(u || '')
      return !s || s.startsWith('data:image/svg+xml') || s.includes('placeholder') || s.includes('dummyimage') || s.includes('via.placeholder.com')
    }
    if (first && !isGeneric(first)) candidates.push(first)
    if (byCat) candidates.push(byCat)
  }
  // Otras fotos reales relacionadas por categoría
  if (catNorm === 'indumentaria') {
    candidates.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop')
  }
  if (catNorm === 'hogar y cocina') {
    candidates.push('https://images.unsplash.com/photo-1504754524773-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop')
  }
  if (catNorm === 'deportes y fitness') {
    candidates.push('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop')
  }
  if (catNorm === 'tecnologia') {
    candidates.push('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop')
  }
  // Fuente alternativa real
  candidates.push('https://picsum.photos/seed/indumentaria/600/400')
  // Último recurso local
  candidates.push('/categories/indumentaria.svg')
  return candidates
}

export function getCategoryImageCandidates(name: string): string[] {
  const arr: string[] = []
  const catNorm = normalize(name)
  const byCat = categoryPlaceholders[catNorm]
  if (byCat) arr.push(byCat)
  if (catNorm === 'indumentaria') arr.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop')
  if (catNorm === 'hogar y cocina') arr.push('https://images.unsplash.com/photo-1504754524773-8f4f37790ca0?q=80&w=800&auto=format&fit=crop')
  arr.push('https://picsum.photos/seed/' + encodeURIComponent(normalize(name)) + '/200/200')
  arr.push('/categories/indumentaria.svg')
  return arr
}

export function advanceImageFallback(e: any): void {
  try {
    const img = e.currentTarget as HTMLImageElement
    const candidates = JSON.parse(img.dataset.candidates || '[]') as string[]
    const idx = Number(img.dataset.idx || 0)
    const next = candidates[idx + 1]
    if (next) {
      img.dataset.idx = String(idx + 1)
      img.src = next
    } else {
      img.src = defaultProductPlaceholder
    }
  } catch {}
}
