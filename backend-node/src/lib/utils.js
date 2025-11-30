import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const favKey = 'favoriteProductIds';
export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(favKey) || '[]'); } catch { return []; }
}
export function toggleFavorite(id) {
  const current = new Set(getFavorites());
  if (current.has(id)) current.delete(id); else current.add(id);
  const arr = Array.from(current);
  try { localStorage.setItem(favKey, JSON.stringify(arr)); } catch {}
  return arr;
}
export function isFavorite(id) {
  return getFavorites().includes(id);
}

const ratingKey = 'productRatings';
export function getRating(id) {
  try { const map = JSON.parse(localStorage.getItem(ratingKey) || '{}'); return Number(map[id] || 0); } catch { return 0; }
}
export function setRating(id, rating) {
  const r = Math.min(5, Math.max(1, Math.round(rating)));
  try {
    const map = JSON.parse(localStorage.getItem(ratingKey) || '{}');
    map[id] = r;
    localStorage.setItem(ratingKey, JSON.stringify(map));
  } catch {}
}

const normalize = (s) => String(s || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

export function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function displayProductName(productOrName) {
  const name = typeof productOrName === 'string' ? String(productOrName || '') : String(productOrName?.name || '');
  const overrides = {
    'notebook asus vivobook': 'Notebook ASUS VivoBook Go 15',
  };
  const key = normalize(name);
  return overrides[key] || name;
}

export function statusLabel(s) {
  switch (norm(s)) {
    case 'preparing': return 'Preparando';
    case 'shipped': return 'Enviado';
    case 'delivered': return 'Entregado';
    case 'cancelled': return 'Cancelado';
    case 'pending': return 'Pendiente';
    case 'paid': return 'Pagado';
    default: return s;
  }
}

export function formatMoney(value) {
  const n = Math.round(Number(value) || 0);
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export const FREE_SHIPPING_THRESHOLD = 30000;

export const categoryPlaceholders = {
  indumentaria: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
  'hogar y cocina': 'https://atma.com.ar/media/catalog/product/cache/ae9e075ae40cb829d8245867e0850560/a/s/ast1523pi_catalogo.jpg',
  'deportes y fitness': 'https://cdn.pixabay.com/photo/2016/05/27/14/33/football-1419954_1280.jpg',
  tecnologia: 'https://laptopmedia.com/wp-content/uploads/2023/02/3-1-e1675262338300.jpg',
};

function isSafeImageUrl(u) {
  const s = String(u || '');
  if (!s) return false;
  const blocked = /(\.|\/|^)pinimg\.com\//i;
  return !blocked.test(s);
}

export const defaultProductPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'>Sin imagen</text></svg>";

export function getProductImageSrc(product) {
  const nameNorm = normalize(product?.name || '');
  const productImageOverrides = {
    'notebook lenovo ideapad 3 15ada05': 'https://media.medion.com/prod/medion/de_DE/0871/0767/0787/Lenovo_IdeaPad_3_15inch_Front_Side_Left_Black.png?w=2800',
    'smart tv samsung 55 uhd 4k au7000': 'https://static.nb.com.ar/i/nb_SAMSUNG-TV-LED-50-UHD-SMART-4K-50AU7000_ver_df748c83f7ecb14efdfec2dfbf57a9cc.jpg',
    'auriculares inalambricos jbl tune 510bt': 'https://m.media-amazon.com/images/I/61FUX7QmifS._AC_SL1500_.jpg',
    'celular motorola moto g54 256gb': 'https://www.abcdin.cl/dw/image/v2/BCPP_PRD/on/demandware.static/-/Sites-master-catalog/default/dw6120a78d/images/large/27391010.jpg?sw=1200&sh=1200&sm=fit',
    'notebook hp pavilion 15': 'https://www.notebookcheck.net/fileadmin/Notebooks/HP/Pavilion_15-ab022ng/4zu3_HP_Pavilion_15_ab002ng.jpg',
    'tablet apple ipad 10.2 9a gen': 'https://www.priceintanzania.com/wp-content/uploads/2021/09/iPad-10.2-2021-pic.jpg',
    'monitor lg 27 full hd': 'https://images.tcdn.com.br/img/img_prod/313499/monitor_lg_27_led_full_hd_ips_100hz_5ms_inclinacao_ajustavel_hdmi_preto_27ms500_b_21448_1_217d5dc30354302a68cf62a0233621c0.jpg',
    'camara canon eos rebel t7': 'https://http2.mlstatic.com/D_NQ_NP_749137-MLA42228239586_062020-F.jpg',
    'router tp-link archer ax50': 'https://www.impacto.com.pe/storage/products/md/169395037178758.jpg'
  };
  if (productImageOverrides[nameNorm]) {
    const u = productImageOverrides[nameNorm];
    if (isSafeImageUrl(u)) return u;
  }
  const first = product?.images && product.images[0]?.url;
  const isGeneric = (u) => {
    const s = String(u || '');
    return !s || s.startsWith('data:image/svg+xml') || s.includes('placeholder') || s.includes('dummyimage') || s.includes('via.placeholder.com');
  };
  if (first && !isGeneric(first) && isSafeImageUrl(first)) return first;
  const catName = product?.category?.name || '';
  const byCat = categoryPlaceholders[normalize(catName)];
  return (byCat && isSafeImageUrl(byCat)) ? byCat : defaultProductPlaceholder;
}

export function getProductImageCandidates(product) {
  const candidates = [];
  const catNorm = normalize(product?.category?.name || '');
  const nameNorm = normalize(product?.name || '');
  const productImageOverrides = {
    'notebook lenovo ideapad 3 15ada05': 'https://media.medion.com/prod/medion/de_DE/0871/0767/0787/Lenovo_IdeaPad_3_15inch_Front_Side_Left_Black.png?w=2800',
    'smart tv samsung 55 uhd 4k au7000': 'https://static.nb.com.ar/i/nb_SAMSUNG-TV-LED-50-UHD-SMART-4K-50AU7000_ver_df748c83f7ecb14efdfec2dfbf57a9cc.jpg',
    'auriculares inalambricos jbl tune 510bt': 'https://m.media-amazon.com/images/I/61FUX7QmifS._AC_SL1500_.jpg',
    'celular motorola moto g54 256gb': 'https://www.abcdin.cl/dw/image/v2/BCPP_PRD/on/demandware.static/-/Sites-master-catalog/default/dw6120a78d/images/large/27391010.jpg?sw=1200&sh=1200&sm=fit',
    'notebook hp pavilion 15': 'https://www.notebookcheck.net/fileadmin/Notebooks/HP/Pavilion_15-ab022ng/4zu3_HP_Pavilion_15_ab002ng.jpg',
    'tablet apple ipad 10.2 9a gen': 'https://www.priceintanzania.com/wp-content/uploads/2021/09/iPad-10.2-2021-pic.jpg',
    'monitor lg 27 full hd': 'https://images.tcdn.com.br/img/img_prod/313499/monitor_lg_27_led_full_hd_ips_100hz_5ms_inclinacao_ajustavel_hdmi_preto_27ms500_b_21448_1_217d5dc30354302a68cf62a0233621c0.jpg',
    'camara canon eos rebel t7': 'https://http2.mlstatic.com/D_NQ_NP_749137-MLA42228239586_062020-F.jpg',
    'router tp-link archer ax50': 'https://www.impacto.com.pe/storage/products/md/169395037178758.jpg'
  };
  if (productImageOverrides[nameNorm] && isSafeImageUrl(productImageOverrides[nameNorm])) candidates.push(productImageOverrides[nameNorm]);
  const byCat = categoryPlaceholders[catNorm];
  if (catNorm === 'hogar y cocina') {
    if (byCat) candidates.push(byCat);
  } else if (catNorm === 'indumentaria') {
    if (byCat) candidates.push(byCat);
  } else if (catNorm === 'deportes y fitness') {
    if (byCat) candidates.push(byCat);
  } else if (catNorm === 'tecnologia') {
    if (byCat) candidates.push(byCat);
  } else {
    const first = product?.images && product.images[0]?.url;
    const isGeneric = (u) => {
      const s = String(u || '');
      return !s || s.startsWith('data:image/svg+xml') || s.includes('placeholder') || s.includes('dummyimage') || s.includes('via.placeholder.com');
    };
    if (first && !isGeneric(first) && isSafeImageUrl(first)) candidates.push(first);
    if (byCat && isSafeImageUrl(byCat)) candidates.push(byCat);
  }
  if (catNorm === 'indumentaria') {
    candidates.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop');
  }
  if (catNorm === 'hogar y cocina') {
    candidates.push('https://images.unsplash.com/photo-1504754524773-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop');
  }
  if (catNorm === 'deportes y fitness') {
    candidates.push('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop');
  }
  candidates.push('https://picsum.photos/seed/indumentaria/600/400');
  candidates.push('/categories/indumentaria.svg');
  return candidates;
}

export function getCategoryImageCandidates(name) {
  const arr = [];
  const catNorm = normalize(name);
  const byCat = categoryPlaceholders[catNorm];
  if (byCat && isSafeImageUrl(byCat)) arr.push(byCat);
  if (catNorm === 'indumentaria') arr.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop');
  if (catNorm === 'hogar y cocina') arr.push('https://images.unsplash.com/photo-1504754524773-8f4f37790ca0?q=80&w=800&auto=format&fit=crop');
  arr.push('https://picsum.photos/seed/' + encodeURIComponent(normalize(name)) + '/200/200');
  arr.push('/categories/indumentaria.svg');
  return arr;
}

export function advanceImageFallback(e) {
  try {
    const img = e.currentTarget;
    const candidates = JSON.parse(img.dataset.candidates || '[]');
    const idx = Number(img.dataset.idx || 0);
    const next = candidates[idx + 1];
    if (next) {
      img.dataset.idx = String(idx + 1);
      img.src = next;
    } else {
      img.src = defaultProductPlaceholder;
    }
  } catch {}
}

const guestCartKey = 'guestCartItems';
export function getGuestCart() {
  try { return JSON.parse(localStorage.getItem(guestCartKey) || '[]'); } catch { return []; }
}
export function getGuestItemQty(id) {
  return getGuestCart().find(i => i.id === id)?.quantity || 0;
}
export function addGuestCartItem(id, price, quantity = 1) {
  try {
    const items = getGuestCart();
    const existing = items.find(i => i.id === id);
    if (existing) existing.quantity += quantity;
    else items.push({ id, price: Number(price) || 0, quantity });
    localStorage.setItem(guestCartKey, JSON.stringify(items));
    return items;
  } catch { return []; }
}
export function guestCartCount() {
  return getGuestCart().reduce((sum, it) => sum + Number(it.quantity || 0), 0);
}
export function updateGuestCartItem(id, quantity) {
  try {
    let items = getGuestCart();
    items = items.map(i => i.id === id ? { ...i, quantity } : i).filter(i => i.quantity > 0);
    localStorage.setItem(guestCartKey, JSON.stringify(items));
    return items;
  } catch { return []; }
}
export function removeGuestCartItem(id) {
  try {
    const items = getGuestCart().filter(i => i.id !== id);
    localStorage.setItem(guestCartKey, JSON.stringify(items));
    return items;
  } catch { return []; }
}

