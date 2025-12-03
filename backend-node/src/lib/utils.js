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

function normLoose(s) {
  return norm(s).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickOverrideByTokens(nameLoose, overrides) {
  const nameTokens = new Set(nameLoose.split(' ').filter(Boolean));
  for (const [k, u] of Object.entries(overrides)) {
    const keyTokens = k.split(' ').filter(Boolean);
    const allInName = keyTokens.every(t => nameTokens.has(t));
    const allInKey = Array.from(nameTokens).every(t => keyTokens.includes(t));
    if ((allInName || allInKey) && isSafeImageUrl(u)) return u;
  }
  return null;
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
  'deportes y fitness': 'https://www.sports77.cat/315-thickbox_default/balon-de-futbol-adidas-euro-training.jpg',
  tecnologia: 'https://laptopmedia.com/wp-content/uploads/2023/02/3-1-e1675262338300.jpg',
};

function isSafeImageUrl(u) {
  const s = String(u || '');
  if (!s) return false;
  const blocked = /(\.|\/|^)pinimg\.com\//i.test(s) || /(\.|\/|^)m\.media\.amazon\.com\//i.test(s);
  return !blocked;
}

export const defaultProductPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'>Sin imagen</text></svg>";

export function getProductImageSrc(product) {
  const nameNorm = normalize(product?.name || '');
  const nameLoose = normLoose(product?.name || '');
  const productImageOverrides = {
    'notebook lenovo ideapad 3 15ada05': 'https://media.medion.com/prod/medion/de_DE/0871/0767/0787/Lenovo_IdeaPad_3_15inch_Front_Side_Left_Black.png?w=2800',
    'smart tv samsung 55 uhd 4k au7000': 'https://static.nb.com.ar/i/nb_SAMSUNG-TV-LED-50-UHD-SMART-4K-50AU7000_ver_df748c83f7ecb14efdfec2dfbf57a9cc.jpg',
    'auriculares inalambricos jbl tune 510bt': 'https://images.versus.io/objects/jbl-tune-510bt.front.variety.1637335774172.jpg',
    'celular motorola moto g54 256gb': 'https://www.abcdin.cl/dw/image/v2/BCPP_PRD/on/demandware.static/-/Sites-master-catalog/default/dw6120a78d/images/large/27391010.jpg?sw=1200&sh=1200&sm=fit',
    'notebook hp pavilion 15': 'https://www.notebookcheck.net/fileadmin/Notebooks/HP/Pavilion_15-ab022ng/4zu3_HP_Pavilion_15_ab002ng.jpg',
    'tablet apple ipad 10.2 9a gen': 'https://www.priceintanzania.com/wp-content/uploads/2021/09/iPad-10.2-2021-pic.jpg',
    'monitor lg 27 full hd': 'https://images.tcdn.com.br/img/img_prod/313499/monitor_lg_27_led_full_hd_ips_100hz_5ms_inclinacao_ajustavel_hdmi_preto_27ms500_b_21448_1_217d5dc30354302a68cf62a0233621c0.jpg',
    'camara canon eos rebel t7': 'https://http2.mlstatic.com/D_NQ_NP_749137-MLA42228239586_062020-F.jpg',
    'router tp-link archer ax50': 'https://www.impacto.com.pe/storage/products/md/169395037178758.jpg',
    'procesadora philips daily collection hr7310': 'https://images.philips.com/is/image/philipsconsumer/vrs_0eeb8a11bd52f7158300810fdf417a745d871e14?wid=700&hei=700&$pnglarge$',
    'pava electrica peabody pe kv8216': 'https://images.fravega.com/f1000/d0ef7af69d251a042b760bf1eb968048.jpg',
    'pava electrica peabody pe-kv8216': 'https://images.fravega.com/f1000/d0ef7af69d251a042b760bf1eb968048.jpg',
    'aspiradora atma as8900': 'https://http2.mlstatic.com/D_NQ_NP_838654-MLA80230080995_102024-O.webp',
    'microondas bgh quick chef 20l': 'https://http2.mlstatic.com/D_NQ_NP_828536-MLA52331716127_112022-F.jpg',
    'cafetera oster espresso primalatte ii': 'https://a-static.mlcdn.com.br/1500x1500/cafeteira-espresso-oster-primalatte-ii-red/oster/867/2510302f02a0c2f08df07784954fab87.jpg',
    'batidora philips hr3741': 'https://dropmax.pl/hpeciai/074360aac4c050076e633a3acf3f0ddf/pol_pm_13460-13460_1.jfif',
    'ventilador de pie liliana vrn35': 'https://images.fravega.com/f1000/aef2ee3d46582e852626e66127d33d5c.jpg',
    'tostadora atma ta8290': 'https://carrefourar.vtexassets.com/arquivos/ids/346404/7799111034938_03.jpg?v=638235709004000000',
    'licuadora oster pro 1200': 'https://i5-mx.walmartimages.com/mg/gm/1p/images/product-images/img_large/00003426447918l.jpg',
    'plancha a vapor philips gc1750': 'https://images.philips.com/is/image/philipsconsumer/173ea64b0435499fb9bbad1e00d0251c?$jpglarge$&wid=960',
    'zapatillas adidas runfalcon 3.0': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dwc7cbca34/products/ADHP7550/ADHP7550-6.JPG',
    'buzo nike sportswear club fleece': 'https://www.moov.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw0dc6e6a6/products/NICZ7857-010/NICZ7857-010-1.JPG',
    'remera puma essentials negra': 'https://http2.mlstatic.com/D_NQ_NP_707192-MLA87861631256_072025-O.webp',
    'pantalon deportivo adidas tiro 23': 'https://http2.mlstatic.com/D_NQ_NP_661530-MLM53887226648_022023-O.webp',
    'campera rompeviento topper urban': 'https://www.stockcenter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw86354d23/products/TO167530/TO167530-1.JPG',
    'zapatillas nike revolution 6': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw270cca79/products/NI_DC8992-003/NI_DC8992-003-6.JPG',
    'campera adidas essentials': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dwb5db5388/products/ADIC0433/ADIC0433-1.JPG',
    'remera adidas trefoil blanca': 'https://f.fcdn.app/imgs/5c9f90/www.sportmarket.com.uy/smaruy/4b00/original/catalogo/ADIC5144_410_1/1920-1200/remera-adidas-de-dama-trefoil-infill-adic5144-white.jpg',
    'pantalon nike dri-fit': 'https://www.tradeinn.com/f/13698/136986908/nike-pantalones-dri-fit-academy.jpg',
    'buzo puma evostripe': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw70d546db/products/PU684613-16/PU684613-16-1.JPG'
    , 'bicicleta mountain bike venzo r29': 'https://http2.mlstatic.com/D_NQ_NP_655079-MLA73943070815_012024-O.webp'
    , 'mancuernas hexagonales 10kg par': 'https://http2.mlstatic.com/D_NQ_NP_866736-MLC53779691119_022023-O-mancuernas-par-hexagonal-de-10-kg-engomada-distroflex.webp'
    , 'colchoneta de yoga antideslizante reebok': 'https://fitandcross.com/1622-large_default/colchoneta-de-entrenamiento-reebok-10-mm-acolchada-y-antideslizante.jpg'
    , 'pelota de futbol adidas al rihla': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dwe9cc29cc/products/AD_H57783/AD_H57783-1.JPG'
    , 'soga de saltar profesional everlast': 'https://http2.mlstatic.com/D_NQ_NP_699332-MLA41524228216_042020-O.webp'
    , 'reloj deportivo garmin forerunner 55': 'https://m.media-amazon.com/images/I/51YGVXYDFuS._AC_SL1500_.jpg'
    , 'botella termica stanley 1l': 'https://terraoutdoor.cl/wp-content/uploads/2024/04/220240229-5300-d2zca_5000x-1024x1024.png'
    , 'guantes de gimnasio reebok': 'https://triathlonperu.vtexassets.com/arquivos/ids/306918/RAGB-15616_1.jpg?v=638328151886430000'
    , 'banda elastica theraband set': 'https://imagedelivery.net/4fYuQyy-r8_rpBpcY7lH_A/sodimacCO/508414/w=1036,h=832,f=webp,fit=contain,q=85'
    , 'chaleco de entrenamiento trx': 'https://trxmexico.com/cdn/shop/files/KVVEST_1_600x_cd405cf3-8c65-4c13-97f7-de8419af4c09_1200x630.jpg?v=1743117830'
  };
  const isGeneric = (u) => {
    const s = String(u || '');
    return !s || s.startsWith('data:image/svg+xml') || s.includes('placeholder') || s.includes('dummyimage') || s.includes('via.placeholder.com');
  };
  const imgs = Array.isArray(product?.images) ? product.images.filter(im => im && im.active !== false) : [];
  const sorted = imgs.slice().sort((a, b) => {
    const ta = new Date(a?.created_at || 0).getTime();
    const tb = new Date(b?.created_at || 0).getTime();
    if (tb !== ta) return tb - ta;
    const sa = Number(a?.sort_order || 0);
    const sb = Number(b?.sort_order || 0);
    return sa - sb;
  });
  for (const im of sorted) { const u = String(im?.url || ''); if (u && !isGeneric(u) && isSafeImageUrl(u)) return u; }
  if (productImageOverrides[nameNorm] && isSafeImageUrl(productImageOverrides[nameNorm])) return productImageOverrides[nameNorm];
  const tokenMatch = pickOverrideByTokens(nameLoose, productImageOverrides);
  if (tokenMatch) return tokenMatch;
  const catName = product?.category?.name || '';
  const byCat = categoryPlaceholders[normalize(catName)];
  return (byCat && isSafeImageUrl(byCat)) ? byCat : defaultProductPlaceholder;
}

export function getProductImageCandidates(product) {
  const candidates = [];
  const catNorm = normalize(product?.category?.name || '');
  const nameNorm = normalize(product?.name || '');
  const nameLoose = normLoose(product?.name || '');
  const productImageOverrides = {
    'notebook lenovo ideapad 3 15ada05': 'https://media.medion.com/prod/medion/de_DE/0871/0767/0787/Lenovo_IdeaPad_3_15inch_Front_Side_Left_Black.png?w=2800',
    'smart tv samsung 55 uhd 4k au7000': 'https://static.nb.com.ar/i/nb_SAMSUNG-TV-LED-50-UHD-SMART-4K-50AU7000_ver_df748c83f7ecb14efdfec2dfbf57a9cc.jpg',
    'auriculares inalambricos jbl tune 510bt': 'https://images.versus.io/objects/jbl-tune-510bt.front.variety.1637335774172.jpg',
    'celular motorola moto g54 256gb': 'https://www.abcdin.cl/dw/image/v2/BCPP_PRD/on/demandware.static/-/Sites-master-catalog/default/dw6120a78d/images/large/27391010.jpg?sw=1200&sh=1200&sm=fit',
    'notebook hp pavilion 15': 'https://www.notebookcheck.net/fileadmin/Notebooks/HP/Pavilion_15-ab022ng/4zu3_HP_Pavilion_15_ab002ng.jpg',
    'tablet apple ipad 10.2 9a gen': 'https://www.priceintanzania.com/wp-content/uploads/2021/09/iPad-10.2-2021-pic.jpg',
    'monitor lg 27 full hd': 'https://images.tcdn.com.br/img/img_prod/313499/monitor_lg_27_led_full_hd_ips_100hz_5ms_inclinacao_ajustavel_hdmi_preto_27ms500_b_21448_1_217d5dc30354302a68cf62a0233621c0.jpg',
    'camara canon eos rebel t7': 'https://http2.mlstatic.com/D_NQ_NP_749137-MLA42228239586_062020-F.jpg',
    'router tp-link archer ax50': 'https://www.impacto.com.pe/storage/products/md/169395037178758.jpg',
    'procesadora philips daily collection hr7310': 'https://images.philips.com/is/image/philipsconsumer/vrs_0eeb8a11bd52f7158300810fdf417a745d871e14?wid=700&hei=700&$pnglarge$',
    'pava electrica peabody pe kv8216': 'https://images.fravega.com/f1000/d0ef7af69d251a042b760bf1eb968048.jpg',
    'pava electrica peabody pe-kv8216': 'https://images.fravega.com/f1000/d0ef7af69d251a042b760bf1eb968048.jpg',
    'aspiradora atma as8900': 'https://http2.mlstatic.com/D_NQ_NP_838654-MLA80230080995_102024-O.webp',
    'microondas bgh quick chef 20l': 'https://http2.mlstatic.com/D_NQ_NP_828536-MLA52331716127_112022-F.jpg',
    'cafetera oster espresso primalatte ii': 'https://a-static.mlcdn.com.br/1500x1500/cafeteira-espresso-oster-primalatte-ii-red/oster/867/2510302f02a0c2f08df07784954fab87.jpg',
    'batidora philips hr3741': 'https://dropmax.pl/hpeciai/074360aac4c050076e633a3acf3f0ddf/pol_pm_13460-13460_1.jfif',
    'ventilador de pie liliana vrn35': 'https://images.fravega.com/f1000/aef2ee3d46582e852626e66127d33d5c.jpg',
    'tostadora atma ta8290': 'https://carrefourar.vtexassets.com/arquivos/ids/346404/7799111034938_03.jpg?v=638235709004000000',
    'licuadora oster pro 1200': 'https://i5-mx.walmartimages.com/mg/gm/1p/images/product-images/img_large/00003426447918l.jpg',
    'plancha a vapor philips gc1750': 'https://images.philips.com/is/image/philipsconsumer/173ea64b0435499fb9bbad1e00d0251c?$jpglarge$&wid=960',
    'zapatillas adidas runfalcon 3.0': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dwc7cbca34/products/ADHP7550/ADHP7550-6.JPG',
    'buzo nike sportswear club fleece': 'https://www.moov.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw0dc6e6a6/products/NICZ7857-010/NICZ7857-010-1.JPG',
    'remera puma essentials negra': 'https://http2.mlstatic.com/D_NQ_NP_707192-MLA87861631256_072025-O.webp',
    'pantalon deportivo adidas tiro 23': 'https://http2.mlstatic.com/D_NQ_NP_661530-MLM53887226648_022023-O.webp',
    'campera rompeviento topper urban': 'https://www.stockcenter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw86354d23/products/TO167530/TO167530-1.JPG',
    'zapatillas nike revolution 6': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw270cca79/products/NI_DC8992-003/NI_DC8992-003-6.JPG',
    'campera adidas essentials': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dwb5db5388/products/ADIC0433/ADIC0433-1.JPG',
    'remera adidas trefoil blanca': 'https://f.fcdn.app/imgs/5c9f90/www.sportmarket.com.uy/smaruy/4b00/original/catalogo/ADIC5144_410_1/1920-1200/remera-adidas-de-dama-trefoil-infill-adic5144-white.jpg',
    'pantalon nike dri-fit': 'https://www.tradeinn.com/f/13698/136986908/nike-pantalones-dri-fit-academy.jpg',
    'buzo puma evostripe': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw70d546db/products/PU684613-16/PU684613-16-1.JPG'
    , 'bicicleta mountain bike venzo r29': 'https://http2.mlstatic.com/D_NQ_NP_655079-MLA73943070815_012024-O.webp'
    , 'mancuernas hexagonales 10kg par': 'https://http2.mlstatic.com/D_NQ_NP_866736-MLC53779691119_022023-O-mancuernas-par-hexagonal-de-10-kg-engomada-distroflex.webp'
    , 'colchoneta de yoga antideslizante reebok': 'https://fitandcross.com/1622-large_default/colchoneta-de-entrenamiento-reebok-10-mm-acolchada-y-antideslizante.jpg'
    , 'pelota de futbol adidas al rihla': 'https://www.dexter.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dwe9cc29cc/products/AD_H57783/AD_H57783-1.JPG'
    , 'soga de saltar profesional everlast': 'https://http2.mlstatic.com/D_NQ_NP_699332-MLA41524228216_042020-O.webp'
    , 'reloj deportivo garmin forerunner 55': 'https://m.media-amazon.com/images/I/51YGVXYDFuS._AC_SL1500_.jpg'
    , 'botella termica stanley 1l': 'https://terraoutdoor.cl/wp-content/uploads/2024/04/220240229-5300-d2zca_5000x-1024x1024.png'
    , 'guantes de gimnasio reebok': 'https://triathlonperu.vtexassets.com/arquivos/ids/306918/RAGB-15616_1.jpg?v=638328151886430000'
    , 'banda elastica theraband set': 'https://imagedelivery.net/4fYuQyy-r8_rpBpcY7lH_A/sodimacCO/508414/w=1036,h=832,f=webp,fit=contain,q=85'
    , 'chaleco de entrenamiento trx': 'https://trxmexico.com/cdn/shop/files/KVVEST_1_600x_cd405cf3-8c65-4c13-97f7-de8419af4c09_1200x630.jpg?v=1743117830'
  };
  const byCat = categoryPlaceholders[catNorm];
  const isGeneric = (u) => { const s = String(u || ''); return !s || s.startsWith('data:image/svg+xml') || s.includes('placeholder') || s.includes('dummyimage') || s.includes('via.placeholder.com'); };
  const imgs = Array.isArray(product?.images) ? product.images.filter(im => im && im.active !== false) : [];
  const sorted = imgs.slice().sort((a, b) => {
    const ta = new Date(a?.created_at || 0).getTime();
    const tb = new Date(b?.created_at || 0).getTime();
    if (tb !== ta) return tb - ta;
    const sa = Number(a?.sort_order || 0);
    const sb = Number(b?.sort_order || 0);
    return sa - sb;
  });
  const unique = [];
  const seen = new Set();
  for (const im of sorted) { const u = String(im?.url || ''); if (!u || isGeneric(u) || !isSafeImageUrl(u)) continue; if (seen.has(u)) continue; seen.add(u); unique.push(u); }
  candidates.push(...unique);
  if (unique.length === 0) {
    if (productImageOverrides[nameNorm] && isSafeImageUrl(productImageOverrides[nameNorm])) candidates.push(productImageOverrides[nameNorm]);
    else { const token = pickOverrideByTokens(nameLoose, productImageOverrides); if (token) candidates.push(token); }
    if (byCat && isSafeImageUrl(byCat)) candidates.push(byCat);
    candidates.push(defaultProductPlaceholder);
  }
  if (catNorm === 'indumentaria') {
    candidates.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop');
  }
  if (catNorm === 'hogar y cocina') {
    candidates.push('https://images.unsplash.com/photo-1504754524773-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop');
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

