/* GomĐơn POS — bán tại quầy, gom đơn các sàn giao đồ ăn, quản lý thực đơn.
 * Không cần build, không cần server: dữ liệu lưu trong localStorage của trình duyệt.
 * Kết nối sàn hiện là GIẢ LẬP (xem PlatformAdapter bên dưới và README).
 */
(() => {
'use strict';

/* ================= Hằng số ================= */
const KEY = 'gomdon.v1';
const HOUR = 3600e3, DAY = 24 * HOUR;

const SOURCES = {
  store:  { name: 'Tại quán',   short: 'Q',  code: 'TQ', color: 'var(--s-store)' },
  grab:   { name: 'GrabFood',   short: 'G',  code: 'GF', color: 'var(--s-grab)' },
  shopee: { name: 'ShopeeFood', short: 'S',  code: 'SF', color: 'var(--s-shopee)' },
  befood: { name: 'beFood',     short: 'B',  code: 'BE', color: 'var(--s-befood)' },
  xanh:   { name: 'Xanh Ngon',  short: 'X',  code: 'XN', color: 'var(--s-xanh)' },
};
const FOOD_PLATFORMS = ['grab', 'shopee', 'befood', 'xanh'];
const ECOM_PLATFORMS = [
  { id: 'shopeemall', name: 'Shopee', note: 'Bán đồ đóng gói, sốt, combo khô' },
  { id: 'tiktok', name: 'TikTok Shop', note: 'Bán voucher, combo qua livestream' },
];
const STATUS = {
  new:       { label: 'Đơn mới',    cls: 'bad' },
  preparing: { label: 'Đang làm',   cls: 'warn' },
  ready:     { label: 'Chờ lấy',    cls: 'accent' },
  done:      { label: 'Hoàn tất',   cls: 'good' },
  cancelled: { label: 'Đã hủy',     cls: 'neutral' },
};
const LATE_MIN = 15; // đơn mới/đang làm quá 15 phút thì báo trễ

/* ================= Icon ================= */
const P = {
  store: '<path d="M4 10v10h16V10"/><path d="M3 4h18l-1.5 6a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z"/><path d="M10 20v-5h4v5"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  menu: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  plug: '<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  // nhóm món
  taco: '<path d="M3 16a9 9 0 0 1 18 0z"/><path d="M6 13c1-1 2 0 3-1s2 0 3-1 2 0 3-1 2 0 3 0"/><path d="M3 16h18"/>',
  chicken: '<path d="M14.5 4.5a5 5 0 0 1 2.8 8.5l-4.5 4.5-3.3-3.3 4.5-4.5"/><path d="M9.5 14.2l-3 3"/><circle cx="5" cy="19" r="2"/><path d="M14.5 4.5a5 5 0 0 0-4.6 6.4"/>',
  fries: '<path d="M6 10l1.5 11h9L18 10"/><path d="M8 10V4M11 10V3M14 10V4M17 10V6M5.5 10h13"/>',
  cup: '<path d="M6 7h12l-1.5 14h-9z"/><path d="M5 7h14M12 7l2-5h3"/>',
  dish: '<path d="M3 15h18M5 15a7 7 0 0 1 14 0"/><path d="M12 6v2"/><path d="M4 18h16"/>',
};
const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || P.dish}</svg>`;
const CAT_TINT = { taco: '#F6E2C3', chicken: '#F4D6CC', fries: '#F3EBC2', cup: '#D3E8E2', dish: '#E2E6E1' };
const CAT_TINT_DARK = { taco: '#3A2F1F', chicken: '#3A2622', fries: '#36321C', cup: '#1D332D', dish: '#262D29' };

/* ================= Tiện ích ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => Math.round(n).toLocaleString('vi-VN') + 'đ';
const moneyShort = n => n >= 1e6 ? (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);
const uid = () => Math.random().toString(36).slice(2, 9);
const round1000 = n => Math.ceil(n / 1000) * 1000;
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const hhmm = t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dmy = t => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const mins = t => Math.floor((Date.now() - t) / 60000);
const isDark = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
function rng(seed) { // mulberry32 — dữ liệu mẫu ổn định
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function pickWeighted(r, entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0); let x = r() * total;
  for (const [v, w] of entries) { if ((x -= w) < 0) return v; } return entries[0][0];
}

/* ================= Dữ liệu ================= */
function seedData() {
  const categories = [
    { id: 'c-taco', name: 'Bánh cuộn Taco', icon: 'taco' },
    { id: 'c-ga', name: 'Gà rán sốt', icon: 'chicken' },
    { id: 'c-anvat', name: 'Ăn vặt', icon: 'fries' },
    { id: 'c-nuoc', name: 'Nước uống', icon: 'cup' },
  ];
  const raw = [
    ['c-taco', 'Bánh Tacos Gà Xù', 40000], ['c-taco', 'Bánh Tacos Bò', 45000], ['c-taco', 'Bánh Tacos Gà Xù Bò', 50000],
    ['c-taco', 'Bánh Tacos Siêu Gà Xù', 55000], ['c-taco', 'Bánh Tacos Siêu Bò', 60000], ['c-taco', 'Taco Full Topping', 90000],
    ['c-ga', 'Gà rán sốt cay Hàn', 39000], ['c-ga', 'Gà rán sốt phô mai', 42000], ['c-ga', 'Cánh gà sốt mắm', 45000],
    ['c-anvat', 'Khoai tây lắc phô mai', 25000], ['c-anvat', 'Xúc xích Đức nướng', 20000], ['c-anvat', 'Phô mai que (5 cây)', 30000],
    ['c-nuoc', 'Trà đào cam sả', 25000], ['c-nuoc', 'Trà tắc mật ong', 15000], ['c-nuoc', 'Coca-Cola lon', 15000], ['c-nuoc', 'Nước suối', 10000],
  ];
  const items = raw.map(([cat, name, price], i) => ({
    id: 'i' + (i + 1), cat, name, price, available: i !== 11, img: '',
    platforms: Object.fromEntries(FOOD_PLATFORMS.map(p => [p, { on: !(p === 'befood' && cat === 'c-nuoc' && price <= 10000), price: null }])),
  }));
  const platforms = {
    grab:   { connected: true,  merchantId: 'GF-DEMO-1024', commission: 25, markup: 15, autoAccept: false },
    shopee: { connected: true,  merchantId: 'SF-DEMO-5531', commission: 22, markup: 12, autoAccept: false },
    befood: { connected: true,  merchantId: 'BE-DEMO-0087', commission: 20, markup: 10, autoAccept: true },
    xanh:   { connected: false, merchantId: '',             commission: 18, markup: 10, autoAccept: false },
  };
  const st = { v: 1, sample: true, shop: 'Quán Taco Demo', categories, items, platforms, orders: [], seq: 1, dirty: 0, lastSync: {} };

  // Đơn mẫu 30 ngày gần nhất
  const r = rng(20261117);
  const now = Date.now(), today = startOfDay(now);
  for (let d = 29; d >= 0; d--) {
    const day = today - d * DAY;
    const dow = new Date(day).getDay();
    const n = Math.round((14 + r() * 10) * (dow === 0 || dow === 6 ? 1.35 : 1));
    for (let k = 0; k < n; k++) {
      const hour = pickWeighted(r, [[10, 2], [11, 6], [12, 7], [13, 3], [14, 2], [15, 2], [16, 3], [17, 6], [18, 8], [19, 7], [20, 4], [21, 2]]);
      const at = day + hour * HOUR + Math.floor(r() * 60) * 60000;
      if (at > now - 20 * 60000) continue;
      const src = pickWeighted(r, [['store', 34], ['grab', 30], ['shopee', 20], ['befood', 16]]);
      const o = makeOrder(st, src, r, at);
      o.status = r() < 0.04 ? 'cancelled' : 'done';
      st.orders.push(o);
    }
  }
  // Đơn đang chạy để màn hình có trạng thái làm việc thật
  const live = [['grab', 'new', 2], ['shopee', 'new', 1], ['befood', 'preparing', 9], ['store', 'preparing', 6], ['grab', 'ready', 14]];
  for (const [src, status, ago] of live) { const o = makeOrder(st, src, r, now - ago * 60000); o.status = status; st.orders.push(o); }
  st.orders.sort((a, b) => a.at - b.at);
  st.lastSync = { grab: now - 3 * HOUR, shopee: now - 3 * HOUR, befood: now - 26 * HOUR };
  return st;
}

const NAMES = ['Anh Minh', 'Chị Thảo', 'Anh Tuấn', 'Chị Hà', 'Bạn Linh', 'Anh Khoa', 'Chị Ngọc', 'Bạn Duy', 'Chị Mai', 'Anh Phúc', 'Bạn Vy', 'Anh Hưng'];
const NOTES = ['', '', '', 'Ít cay', 'Không hành', 'Thêm sốt', 'Không lấy đá', 'Cho thêm tương ớt', 'Giao trước cổng'];

function platformPrice(st, item, src) {
  if (src === 'store') return item.price;
  const cfg = item.platforms?.[src];
  if (cfg?.price) return cfg.price;
  return round1000(item.price * (1 + (st.platforms[src]?.markup || 0) / 100));
}
function sellableOn(item, src) { return item.available && (src === 'store' || item.platforms?.[src]?.on); }

function makeOrder(st, src, r = Math.random, at = Date.now()) {
  const pool = st.items.filter(i => sellableOn(i, src));
  const nLines = pickWeighted(r, [[1, 4], [2, 4], [3, 2]]);
  const lines = [];
  for (let i = 0; i < nLines && pool.length; i++) {
    const it = pick(r, pool);
    const ex = lines.find(l => l.id === it.id);
    if (ex) ex.qty++; else lines.push({ id: it.id, name: it.name, price: platformPrice(st, it, src), qty: r() < 0.25 ? 2 : 1 });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const commission = src === 'store' ? 0 : Math.round(total * (st.platforms[src]?.commission || 0) / 100);
  const seq = st.seq++;
  return {
    id: uid(), code: `${SOURCES[src].code}-${String(seq).padStart(4, '0')}`, src, lines, total, commission,
    status: 'new', at, customer: src === 'store' ? '' : pick(r, NAMES), note: src === 'store' ? '' : pick(r, NOTES),
    pay: src === 'store' ? pick(r, ['Tiền mặt', 'Chuyển khoản']) : 'Thanh toán qua sàn', table: '',
  };
}

let S;
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const v = JSON.parse(raw); if (v && v.v === 1) return v; } } catch (e) { /* bỏ qua */ }
  return seedData();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bộ nhớ đầy hoặc bị chặn */ } }

/* ================= Kết nối sàn (giả lập) =================
 * Mỗi sàn thật sẽ có một adapter cùng giao diện:
 *   connect(creds) · pushMenu(items) · setAvailability(itemId, on) · acceptOrder(id) · rejectOrder(id) · markReady(id)
 * và một webhook phía server đẩy đơn mới về app. Bản demo này thay tất cả bằng giả lập cục bộ.
 */
const PlatformAdapter = {
  async pushMenu(pid) { await new Promise(r => setTimeout(r, 500 + Math.random() * 600)); return { ok: true, pid }; },
  simulateIncoming() {
    const live = FOOD_PLATFORMS.filter(p => S.platforms[p].connected);
    if (!live.length) return null;
    const src = pick(Math.random, live);
    const o = makeOrder(S, src);
    if (!o.lines.length) return null;
    if (S.platforms[src].autoAccept) o.status = 'preparing';
    S.orders.push(o);
    return o;
  },
};

/* ================= Trạng thái giao diện ================= */
const ui = {
  view: 'pos',
  posCat: 'all', posQuery: '', cart: [], orderType: 'Mang về', table: '', pay: 'Tiền mặt', cartNote: '',
  onlineTab: 'new', onlineSrc: 'all',
  menuCat: 'all',
  range: 7, chartHover: -1,
  sheet: null, // { kind, data }
  armed: null, // nút xác nhận 2 bước
  autoSim: true,
};
const VIEWS = ['pos', 'online', 'menu', 'reports', 'connect'];

/* ================= Render chung ================= */
function itemThumb(item) {
  const cat = S.categories.find(c => c.id === item.cat);
  const icon = cat?.icon || 'dish';
  const tint = (isDark() ? CAT_TINT_DARK : CAT_TINT)[icon] || 'var(--surface-2)';
  return `<div class="thumb" style="--tint:${tint}">${item.img ? `<img src="${esc(item.img)}" alt="">` : ic(icon)}</div>`;
}
const srcTag = src => `<span class="src" style="--c:${SOURCES[src].color}"><i></i>${SOURCES[src].name}</span>`;
const srcTile = src => `<div class="src-tile" style="--c:${SOURCES[src].color}" aria-hidden="true">${SOURCES[src].short}</div>`;
const countBy = st => S.orders.filter(o => o.status === st && o.src !== 'store').length;

function render() {
  const app = $('#app');
  const newCount = countBy('new');
  const scrollY = window.scrollY;
  const connected = FOOD_PLATFORMS.filter(p => S.platforms[p].connected).length;
  app.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="var(--accent)"/><path d="M120 300a136 136 0 0 1 272 0z" fill="var(--bg)"/><rect x="104" y="300" width="304" height="40" rx="20" fill="var(--s-befood)"/></svg>
        <div style="min-width:0"><div class="brand-name">GomĐơn</div><div class="brand-shop">${esc(S.shop)}</div></div>
      </div>
      <div class="spacer"></div>
      <span class="live ${connected ? '' : 'off'}" title="Số sàn đang kết nối">${connected ? `${connected} sàn đang nhận đơn` : 'Chưa kết nối sàn'}</span>
    </header>
    <main class="view" id="view">${viewHTML()}</main>
    <nav class="tabbar" aria-label="Điều hướng">
      ${tab('pos', 'store', 'Tại quán')}
      ${tab('online', 'bag', 'Đơn online', newCount)}
      ${tab('menu', 'menu', 'Thực đơn', S.dirty)}
      ${tab('reports', 'chart', 'Báo cáo')}
      ${tab('connect', 'plug', 'Kết nối')}
    </nav>
    ${ui.view === 'pos' ? cartBarHTML() : ''}
  </div>
  ${ui.sheet ? sheetHTML() : ''}`;
  window.scrollTo(0, scrollY);
  if (ui.view === 'reports') bindChart();
}
function tab(v, icon, label, badge) {
  return `<a class="tab" href="#${v}" ${ui.view === v ? 'aria-current="page"' : ''}>${ic(icon)}${label}${badge ? `<span class="badge">${badge}</span>` : ''}</a>`;
}
function viewHTML() {
  switch (ui.view) {
    case 'online': return onlineHTML();
    case 'menu': return menuHTML();
    case 'reports': return reportsHTML();
    case 'connect': return connectHTML();
    default: return posHTML();
  }
}

/* ================= Tại quán (POS) ================= */
function posHTML() {
  const cats = [{ id: 'all', name: 'Tất cả', icon: 'dish' }, ...S.categories];
  return `
  <div class="pos">
    <div class="pos-main">
      <div class="pos-tools">
        <label class="search"><span class="sr-only" hidden>Tìm món</span>${ic('search')}
          <input class="input" id="posSearch" type="search" placeholder="Tìm món…" value="${esc(ui.posQuery)}" autocomplete="off"></label>
      </div>
      <div class="pos-body">
        <div class="cat-rail" role="group" aria-label="Nhóm món">
          ${cats.map(c => `<button class="cat-btn" data-act="pos-cat" data-id="${c.id}" aria-pressed="${ui.posCat === c.id}">${ic(c.icon)}${esc(c.name)}</button>`).join('')}
        </div>
        <div class="grid-items" id="posGrid">${posGridHTML()}</div>
      </div>
    </div>
    <aside class="cart-aside panel">${cartHTML()}</aside>
  </div>`;
}
function posGridHTML() {
  const q = ui.posQuery.trim().toLowerCase();
  const list = S.items.filter(i => (ui.posCat === 'all' || i.cat === ui.posCat) && (!q || norm(i.name).includes(norm(q))));
  if (!list.length) return `<div class="empty" style="grid-column:1/-1">${ic('search')}Không có món nào khớp “${esc(ui.posQuery)}”.</div>`;
  return list.map(i => {
    const inCart = ui.cart.find(c => c.id === i.id);
    return `<button class="item-card ${i.available ? '' : 'soldout'}" data-act="add" data-id="${i.id}" ${i.available ? '' : 'aria-disabled="true"'}>
      ${itemThumb(i)}
      ${!i.available ? '<span class="pill neutral soldout-tag">Hết món</span>' : inCart ? `<span class="qty-tag">${inCart.qty}</span>` : ''}
      <span class="add">${ic('plus')}</span>
      <span class="meta"><span class="name">${esc(i.name)}</span><span class="price num">${money(i.price)}</span></span>
    </button>`;
  }).join('');
}
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
const cartTotal = () => ui.cart.reduce((s, c) => { const it = S.items.find(i => i.id === c.id); return s + (it ? it.price * c.qty : 0); }, 0);
const cartQty = () => ui.cart.reduce((s, c) => s + c.qty, 0);

function cartHTML() {
  if (!ui.cart.length) return `<div class="cart"><div class="section-head"><h2 style="font-size:18px">Đơn tại quán</h2></div>
    <div class="empty">${ic('store')}Chạm vào món để thêm vào đơn.</div></div>`;
  return `<div class="cart">
    <div class="section-head"><h2 style="font-size:18px">Đơn tại quán</h2><button class="btn ghost sm" data-act="cart-clear">Xóa hết</button></div>
    <div class="cart-lines">${ui.cart.map(c => {
      const it = S.items.find(i => i.id === c.id); if (!it) return '';
      return `<div class="cart-line"><span class="n">${esc(it.name)}</span>
        <span class="stepper"><button data-act="qty" data-id="${c.id}" data-d="-1" aria-label="Bớt">${ic('minus')}</button><span class="num">${c.qty}</span><button data-act="qty" data-id="${c.id}" data-d="1" aria-label="Thêm">${ic('plus')}</button></span>
        <span class="p num">${money(it.price)} × ${c.qty} = ${money(it.price * c.qty)}</span></div>`;
    }).join('')}</div>
    <div class="row2">
      <label class="field"><span>Hình thức</span><select id="orderType">${['Mang về', 'Tại bàn'].map(o => `<option ${ui.orderType === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <label class="field"><span>Thanh toán</span><select id="payType">${['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map(o => `<option ${ui.pay === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    </div>
    ${ui.orderType === 'Tại bàn' ? `<label class="field"><span>Số bàn</span><input id="tableNo" inputmode="numeric" value="${esc(ui.table)}" placeholder="VD: 5"></label>` : ''}
    <label class="field"><span>Ghi chú cho bếp</span><input id="cartNote" value="${esc(ui.cartNote)}" placeholder="VD: ít cay, không hành"></label>
    <div class="totals num"><div><span class="muted">${cartQty()} món</span><span>${money(cartTotal())}</span></div>
      <div class="grand"><span>Tổng</span><span>${money(cartTotal())}</span></div></div>
    <button class="btn primary block" data-act="checkout">Thu ${money(cartTotal())} & gửi bếp</button>
  </div>`;
}
function cartBarHTML() {
  if (!ui.cart.length) return '';
  return `<button class="cart-bar" data-act="open-cart"><span class="grow"><span class="muted" style="color:inherit;opacity:.7;font-size:12px">${cartQty()} món</span><br><strong class="num">${money(cartTotal())}</strong></span><span class="go">Xem đơn</span></button>`;
}

/* ================= Đơn online ================= */
function onlineHTML() {
  const tabs = [['new', 'Mới'], ['preparing', 'Đang làm'], ['ready', 'Chờ lấy'], ['history', 'Lịch sử']];
  const active = o => ui.onlineSrc === 'all' || o.src === ui.onlineSrc;
  const counts = Object.fromEntries(tabs.map(([k]) => [k, k === 'history' ? 0 : S.orders.filter(o => o.status === k && active(o)).length]));
  const srcs = ['all', 'store', ...FOOD_PLATFORMS.filter(p => S.platforms[p].connected)];
  return `
  <div class="section-head">
    <h2>Đơn hàng</h2>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <label class="plat-row" style="gap:8px;font-size:13px"><span class="switch"><input type="checkbox" id="autoSim" ${ui.autoSim ? 'checked' : ''}><span></span></span>Tự sinh đơn thử</label>
      <button class="btn sm" data-act="simulate">${ic('bell')}Giả lập đơn mới</button>
    </div>
  </div>
  <div class="seg" role="group" aria-label="Trạng thái">${tabs.map(([k, l]) => `<button data-act="online-tab" data-id="${k}" aria-pressed="${ui.onlineTab === k}">${l}${counts[k] ? `<span class="badge">${counts[k]}</span>` : ''}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="Nguồn đơn">${srcs.map(s => `<button class="chip" data-act="online-src" data-id="${s}" aria-pressed="${ui.onlineSrc === s}">${s === 'all' ? 'Tất cả nguồn' : srcTag(s)}</button>`).join('')}</div>
  ${ui.onlineTab === 'history' ? historyHTML(active) : ticketsHTML(active)}`;
}
function ticketsHTML(active) {
  const list = S.orders.filter(o => o.status === ui.onlineTab && active(o)).sort((a, b) => a.at - b.at);
  if (!list.length) {
    const msg = { new: 'Chưa có đơn mới. Đơn từ các sàn sẽ hiện ở đây kèm chuông báo.', preparing: 'Bếp đang trống.', ready: 'Không có đơn nào chờ tài xế hoặc khách lấy.' }[ui.onlineTab];
    return `<div class="panel empty">${ic('bag')}${msg}</div>`;
  }
  return `<div class="orders">${list.map(ticketHTML).join('')}</div>`;
}
function ticketHTML(o) {
  const m = mins(o.at); const late = (o.status === 'new' || o.status === 'preparing') && m >= LATE_MIN;
  const net = o.total - o.commission;
  let actions = '';
  if (o.status === 'new') actions = `<button class="btn danger ${ui.armed === 'rej-' + o.id ? 'armed' : ''}" data-act="reject" data-id="${o.id}">${ui.armed === 'rej-' + o.id ? 'Bấm lần nữa để hủy' : 'Từ chối'}</button><button class="btn primary" data-act="advance" data-id="${o.id}">Nhận đơn</button>`;
  else if (o.status === 'preparing') actions = `<button class="btn primary" data-act="advance" data-id="${o.id}">${o.src === 'store' ? 'Đã giao khách' : 'Món đã xong'}</button>`;
  else if (o.status === 'ready') actions = `<button class="btn primary" data-act="advance" data-id="${o.id}">Tài xế đã lấy</button>`;
  const who = o.src === 'store' ? (o.table ? `Bàn ${esc(o.table)}` : 'Mang về') + ' · ' + esc(o.pay) : esc(o.customer);
  return `<article class="ticket ${o.status === 'new' ? 'is-new' : ''}">
    <div class="ticket-head">${srcTile(o.src)}
      <div class="grow"><div class="code">${esc(o.code)}</div><div class="sub">${SOURCES[o.src].name} · ${who}</div></div>
      <div style="text-align:right"><div class="timer ${late ? 'late' : ''}" data-at="${o.at}">${m} phút</div><div class="sub">${hhmm(o.at)}</div></div>
    </div>
    <div class="ticket-body">${o.lines.map(l => `<div class="l"><span><b class="num">${l.qty}×</b>${esc(l.name)}</span><span class="num muted">${money(l.price * l.qty)}</span></div>`).join('')}
      ${o.note ? `<div class="note">Ghi chú: ${esc(o.note)}</div>` : ''}</div>
    <div class="ticket-foot">
      <div class="sum"><strong class="num">${money(o.total)}</strong>${o.commission ? `<span class="muted num" style="font-size:12px">Thực nhận ${money(net)} (phí sàn ${money(o.commission)})</span>` : ''}</div>
      <div class="actions">${actions}</div>
    </div>
  </article>`;
}
function historyHTML(active) {
  const list = S.orders.filter(o => (o.status === 'done' || o.status === 'cancelled') && active(o)).sort((a, b) => b.at - a.at).slice(0, 60);
  if (!list.length) return `<div class="panel empty">${ic('bag')}Chưa có đơn hoàn tất.</div>`;
  return `<div class="panel history"><table class="tbl"><thead><tr><th>Mã đơn</th><th>Nguồn</th><th>Thời gian</th><th>Món</th><th class="r">Tổng</th><th class="r">Thực nhận</th><th>Trạng thái</th></tr></thead><tbody>
  ${list.map(o => `<tr><td><b>${esc(o.code)}</b></td><td>${srcTag(o.src)}</td><td class="num">${dmy(o.at)} ${hhmm(o.at)}</td>
    <td>${o.lines.reduce((s, l) => s + l.qty, 0)} món</td><td class="r num">${money(o.total)}</td><td class="r num">${o.status === 'done' ? money(o.total - o.commission) : '—'}</td>
    <td><span class="pill ${STATUS[o.status].cls}">${STATUS[o.status].label}</span></td></tr>`).join('')}
  </tbody></table></div><p class="muted" style="margin:0;font-size:12px">Hiển thị 60 đơn gần nhất.</p>`;
}

/* ================= Thực đơn ================= */
function menuHTML() {
  const live = FOOD_PLATFORMS.filter(p => S.platforms[p].connected);
  const cats = S.categories.filter(c => ui.menuCat === 'all' || c.id === ui.menuCat);
  const soldOut = S.items.filter(i => !i.available).length;
  return `
  <div class="section-head"><h2>Thực đơn</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="cat-new">Thêm nhóm</button><button class="btn primary sm" data-act="item-new">${ic('plus')}Thêm món</button></div></div>
  ${S.dirty ? `<div class="notice sync-banner">${ic('warn')}<div class="grow"><b>${S.dirty} thay đổi chưa đẩy lên sàn.</b> Giá, món hết hoặc món mới chỉ hiện trên ${live.map(p => SOURCES[p].name).join(', ') || 'các sàn'} sau khi đồng bộ.</div>
    <button class="btn primary sm" data-act="sync" ${live.length ? '' : 'disabled'}>${ic('sync')}Đồng bộ lên sàn</button></div>`
    : `<div class="notice info">${ic('info')}<div class="grow">Thực đơn đã khớp với ${live.length} sàn. ${soldOut ? `Đang tắt <b>${soldOut} món hết</b> trên mọi kênh.` : ''}</div></div>`}
  <div class="chips">${[{ id: 'all', name: 'Tất cả' }, ...S.categories].map(c => `<button class="chip" data-act="menu-cat" data-id="${c.id}" aria-pressed="${ui.menuCat === c.id}">${esc(c.name)}<span class="count">${c.id === 'all' ? S.items.length : S.items.filter(i => i.cat === c.id).length}</span></button>`).join('')}</div>
  <div class="panel menu-list">
    ${cats.map(c => {
      const items = S.items.filter(i => i.cat === c.id);
      return `<section class="menu-group"><h3><span>${esc(c.name)}</span><button class="btn ghost sm" data-act="cat-edit" data-id="${c.id}">Sửa nhóm</button></h3>
      ${items.length ? items.map(i => `<div class="menu-row">${itemThumb(i)}
        <button class="info" data-act="item-edit" data-id="${i.id}"><span class="n">${esc(i.name)}</span><span class="p num">${money(i.price)} tại quán</span>
          <span class="dots">${FOOD_PLATFORMS.filter(p => S.platforms[p].connected).map(p => `<span class="dot ${i.platforms[p]?.on ? '' : 'off'}" style="--c:${SOURCES[p].color}" title="${SOURCES[p].name}: ${i.platforms[p]?.on ? money(platformPrice(S, i, p)) : 'không bán'}">${SOURCES[p].short} ${i.platforms[p]?.on ? moneyShort(platformPrice(S, i, p)) : ''}</span>`).join('')}</span></button>
        <div class="right"><span class="avail-label" style="color:${i.available ? 'var(--good)' : 'var(--muted)'}">${i.available ? 'Còn' : 'Hết'}</span>
          <label class="switch" title="Còn món / Hết món"><input type="checkbox" data-act="avail" data-id="${i.id}" ${i.available ? 'checked' : ''} aria-label="${esc(i.name)} còn món"><span></span></label></div>
      </div>`).join('') : '<div class="empty" style="padding:16px">Nhóm này chưa có món.</div>'}</section>`;
    }).join('')}
  </div>`;
}

/* ================= Báo cáo ================= */
function reportData() {
  const now = Date.now(), today = startOfDay(now);
  const from = ui.range === 1 ? today : today - (ui.range - 1) * DAY;
  const prevFrom = from - (ui.range === 1 ? DAY : ui.range * DAY);
  const done = S.orders.filter(o => o.status === 'done');
  const cur = done.filter(o => o.at >= from), prev = done.filter(o => o.at >= prevFrom && o.at < from && (ui.range !== 1 || o.at < now - DAY));
  const sum = (arr, f) => arr.reduce((s, o) => s + f(o), 0);
  const k = arr => ({ gross: sum(arr, o => o.total), net: sum(arr, o => o.total - o.commission), n: arr.length });
  const K = k(cur), KP = k(prev);
  K.avg = K.n ? K.gross / K.n : 0; KP.avg = KP.n ? KP.gross / KP.n : 0;
  // cột biểu đồ
  const srcKeys = Object.keys(SOURCES);
  let cols;
  if (ui.range === 1) {
    cols = Array.from({ length: 13 }, (_, i) => ({ label: `${i + 10}h`, title: `${i + 10}:00 – ${i + 10}:59`, by: {} }));
    for (const o of cur) { const h = new Date(o.at).getHours(); const c = cols[Math.min(12, Math.max(0, h - 10))]; c.by[o.src] = (c.by[o.src] || 0) + o.total; }
  } else {
    cols = Array.from({ length: ui.range }, (_, i) => { const t = from + i * DAY; return { label: dmy(t), title: new Date(t).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }), by: {} }; });
    for (const o of cur) { const i = Math.floor((startOfDay(o.at) - from) / DAY); if (cols[i]) cols[i].by[o.src] = (cols[i].by[o.src] || 0) + o.total; }
  }
  const bySrc = srcKeys.map(s => { const a = cur.filter(o => o.src === s); return { s, n: a.length, gross: sum(a, o => o.total), fee: sum(a, o => o.commission) }; }).filter(r => r.n);
  const itemMap = {};
  for (const o of cur) for (const l of o.lines) { const m = itemMap[l.name] || (itemMap[l.name] = { name: l.name, qty: 0, rev: 0 }); m.qty += l.qty; m.rev += l.qty * l.price; }
  const top = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 6);
  return { K, KP, cols, bySrc, top, srcKeys };
}
function delta(a, b) {
  if (!b) return '<span class="d">Chưa có kỳ trước để so sánh</span>';
  const p = (a - b) / b * 100; const up = p >= 0;
  if (Math.abs(p) < 0.5) return '<span class="d">Ngang kỳ trước</span>';
  return `<span class="d"><b style="color:${up ? 'var(--good)' : 'var(--bad)'}">${up ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%</b> so với kỳ trước</span>`;
}
function reportsHTML() {
  const { K, KP, cols, bySrc, top, srcKeys } = reportData();
  const label = { 1: 'Hôm nay', 7: '7 ngày', 30: '30 ngày' };
  const used = srcKeys.filter(s => cols.some(c => c.by[s]));
  const maxTop = top[0]?.qty || 1;
  const tot = bySrc.reduce((a, r) => ({ n: a.n + r.n, gross: a.gross + r.gross, fee: a.fee + r.fee }), { n: 0, gross: 0, fee: 0 });
  return `
  <div class="section-head"><h2>Báo cáo</h2>
    <div class="seg" style="min-width:260px">${[1, 7, 30].map(r => `<button data-act="range" data-id="${r}" aria-pressed="${ui.range === r}">${label[r]}</button>`).join('')}</div></div>
  ${S.sample ? `<div class="notice info">${ic('info')}<div class="grow">Đang hiển thị <b>dữ liệu mẫu</b>. Xóa ở mục Kết nối → Cài đặt khi bắt đầu bán thật.</div></div>` : ''}
  <div class="kpis">
    <div class="panel kpi"><span class="eyebrow">Doanh thu</span><span class="v num">${money(K.gross)}</span>${delta(K.gross, KP.gross)}</div>
    <div class="panel kpi"><span class="eyebrow">Thực nhận</span><span class="v num">${money(K.net)}</span><span class="d">Sau phí sàn ${money(K.gross - K.net)}</span></div>
    <div class="panel kpi"><span class="eyebrow">Số đơn</span><span class="v num">${K.n.toLocaleString('vi-VN')}</span>${delta(K.n, KP.n)}</div>
    <div class="panel kpi"><span class="eyebrow">Giá trị TB/đơn</span><span class="v num">${money(K.avg)}</span>${delta(K.avg, KP.avg)}</div>
  </div>
  <div class="panel chart-panel">
    <div class="section-head"><h3 style="font-size:16px">Doanh thu theo ${ui.range === 1 ? 'giờ' : 'ngày'}</h3>
      <div class="legend">${used.map(s => srcTag(s)).join('')}</div></div>
    <div class="chart-wrap" id="chart">${chartSVG(cols, used)}</div>
  </div>
  <div class="two-col">
    <div class="panel history"><table class="tbl"><thead><tr><th>Nguồn</th><th class="r">Đơn</th><th class="r">Doanh thu</th><th class="r">Phí sàn</th><th class="r">Thực nhận</th></tr></thead>
      <tbody>${bySrc.map(r => `<tr><td>${srcTag(r.s)}</td><td class="r num">${r.n}</td><td class="r num">${money(r.gross)}</td><td class="r num">${money(r.fee)}</td><td class="r num">${money(r.gross - r.fee)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Tổng</td><td class="r num">${tot.n}</td><td class="r num">${money(tot.gross)}</td><td class="r num">${money(tot.fee)}</td><td class="r num">${money(tot.gross - tot.fee)}</td></tr></tfoot></table></div>
    <div class="panel"><div class="top-list"><h3 style="font-size:16px">Món bán chạy</h3>
      ${top.length ? top.map(t => `<div class="top-item"><div class="h"><span>${esc(t.name)}</span><span class="num muted">${t.qty} phần · ${money(t.rev)}</span></div><div class="bar"><i style="width:${(t.qty / maxTop * 100).toFixed(1)}%"></i></div></div>`).join('') : '<p class="muted">Chưa có đơn trong kỳ.</p>'}
    </div></div>
  </div>`;
}
function niceScale(v, parts = 4) { // trả về { max, step } với bước tròn (1, 2, 2.5, 5 × 10^n)
  const raw = Math.max(v, 100000) / parts; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  return { step, max: Math.ceil(Math.max(v, 1) / step) * step };
}
function chartSVG(cols, used) {
  const W = 900, H = 260, L = 44, R = 8, T = 10, B = 26;
  const totals = cols.map(c => used.reduce((s, k) => s + (c.by[k] || 0), 0));
  const { max, step } = niceScale(Math.max(...totals));
  const cw = (W - L - R) / cols.length, bw = Math.min(28, cw * 0.62);
  const y = v => T + (H - T - B) * (1 - v / max);
  const ticks = []; for (let t = 0; t <= max + 1; t += step) ticks.push(t);
  const every = cols.length > 16 ? Math.ceil(cols.length / 10) : 1;
  let out = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ doanh thu">`;
  out += ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${moneyShort(t)}</text>`).join('');
  cols.forEach((c, i) => {
    const x = L + i * cw + (cw - bw) / 2;
    out += `<g class="col" data-i="${i}"><rect class="hit" x="${L + i * cw}" y="${T}" width="${cw}" height="${H - T - B}" rx="4"/>`;
    let acc = 0; const segs = used.filter(k => c.by[k]);
    segs.forEach((k, j) => {
      const v = c.by[k]; const y1 = y(acc + v), y0 = y(acc); acc += v;
      const h = Math.max(0, y0 - y1 - (j < segs.length - 1 ? 2 : 0)); // khe 2px giữa các lớp
      const top = j === segs.length - 1;
      out += top && h > 4
        ? `<path d="M${x},${y0} V${y1 + 4} Q${x},${y1} ${x + 4},${y1} H${x + bw - 4} Q${x + bw},${y1} ${x + bw},${y1 + 4} V${y0} Z" fill="${SOURCES[k].color}"/>`
        : `<rect x="${x}" y="${y1}" width="${bw}" height="${h}" fill="${SOURCES[k].color}"/>`;
    });
    if (i % every === 0) out += `<text x="${L + i * cw + cw / 2}" y="${H - 8}" text-anchor="middle">${c.label}</text>`;
    out += '</g>';
  });
  return out + `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-width="1"/></svg>`;
}
function bindChart() {
  const wrap = $('#chart'); if (!wrap) return;
  const { cols, srcKeys } = reportData();
  let tip = null;
  const show = (g, ev) => {
    const i = +g.dataset.i, c = cols[i];
    wrap.querySelectorAll('.col.on').forEach(e => e.classList.remove('on')); g.classList.add('on');
    const rows = srcKeys.filter(k => c.by[k]);
    const total = rows.reduce((s, k) => s + c.by[k], 0);
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; wrap.appendChild(tip); }
    tip.innerHTML = `<div class="t">${esc(c.title)}</div>${rows.map(k => `<div class="r">${srcTag(k)}<span class="num">${money(c.by[k])}</span></div>`).join('') || '<div class="muted">Không có đơn</div>'}<div class="r" style="border-top:1px solid var(--line);padding-top:4px"><b>Tổng</b><b class="num">${money(total)}</b></div>`;
    const wr = wrap.getBoundingClientRect(), gr = g.getBoundingClientRect();
    let left = gr.left - wr.left + gr.width / 2 - tip.offsetWidth / 2;
    left = Math.max(0, Math.min(wr.width - tip.offsetWidth, left));
    tip.style.left = left + 'px'; tip.style.top = Math.max(-10, (ev?.clientY ?? gr.top) - wr.top - tip.offsetHeight - 14) + 'px';
  };
  wrap.querySelectorAll('.col').forEach(g => {
    g.addEventListener('pointerenter', e => show(g, e));
    g.addEventListener('pointermove', e => show(g, e));
  });
  wrap.addEventListener('pointerleave', () => { tip?.remove(); tip = null; wrap.querySelectorAll('.col.on').forEach(e => e.classList.remove('on')); });
}

/* ================= Kết nối ================= */
function connectHTML() {
  const today = startOfDay(Date.now());
  return `
  <div class="section-head"><h2>Kết nối đối tác</h2></div>
  <div class="notice">${ic('warn')}<div class="grow"><b>Bản demo: kết nối đang được giả lập.</b> Để nhận đơn thật, quán cần được từng sàn cấp quyền tích hợp (API đối tác) và app cần một máy chủ nhận webhook. Giao diện và luồng xử lý đơn đã sẵn sàng cho bước đó.</div></div>
  <span class="eyebrow">Nền tảng giao đồ ăn</span>
  <div class="plat-grid">${FOOD_PLATFORMS.map(p => {
    const c = S.platforms[p];
    const todays = S.orders.filter(o => o.src === p && o.at >= today && o.status === 'done');
    const items = S.items.filter(i => i.platforms[p]?.on).length;
    const ls = S.lastSync[p];
    return `<div class="panel plat">
      <div class="plat-head">${srcTile(p)}<div class="grow"><div class="n">${SOURCES[p].name}</div><div class="s">${c.connected ? `Mã quán ${esc(c.merchantId)}` : 'Chưa kết nối'}</div></div>
        <span class="pill ${c.connected ? 'good' : 'neutral'}">${c.connected ? 'Đã kết nối' : 'Chưa kết nối'}</span></div>
      ${c.connected ? `<div class="plat-stats"><div><b class="num">${todays.length}</b><span>đơn hôm nay</span></div><div><b class="num">${items}</b><span>món đang bán</span></div><div><b>${ls ? hhmm(ls) : '—'}</b><span>${ls && ls < today ? dmy(ls) : 'đồng bộ'}</span></div></div>
        <div class="plat-row"><span>Tự động nhận đơn</span><label class="switch"><input type="checkbox" data-act="auto-accept" data-id="${p}" ${c.autoAccept ? 'checked' : ''} aria-label="Tự động nhận đơn ${SOURCES[p].name}"><span></span></label></div>` : ''}
      <div class="row2">
        <label class="field"><span>Phí sàn (%)</span><input type="number" min="0" max="60" data-act="plat-num" data-k="commission" data-id="${p}" value="${c.commission}"></label>
        <label class="field"><span>Tăng giá so với quán (%)</span><input type="number" min="0" max="100" data-act="plat-num" data-k="markup" data-id="${p}" value="${c.markup}"></label>
      </div>
      ${c.connected
        ? `<button class="btn danger ${ui.armed === 'disc-' + p ? 'armed' : ''}" data-act="disconnect" data-id="${p}">${ui.armed === 'disc-' + p ? 'Bấm lần nữa để ngắt kết nối' : 'Ngắt kết nối'}</button>`
        : `<button class="btn primary" data-act="connect" data-id="${p}">Kết nối ${SOURCES[p].name}</button>`}
    </div>`;
  }).join('')}</div>
  <span class="eyebrow">Sàn thương mại điện tử</span>
  <div class="plat-grid">${ECOM_PLATFORMS.map(e => `<div class="panel plat soon"><div class="plat-head"><div class="src-tile" style="--c:var(--muted)">${e.name[0]}</div><div class="grow"><div class="n">${e.name}</div><div class="s">${e.note}</div></div><span class="pill neutral">Sắp có</span></div></div>`).join('')}</div>
  <span class="eyebrow">Cài đặt</span>
  <div class="panel plat">
    <label class="field"><span>Tên quán</span><input id="shopName" value="${esc(S.shop)}"></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn danger ${ui.armed === 'wipe' ? 'armed' : ''}" data-act="wipe">${ui.armed === 'wipe' ? 'Bấm lần nữa: xóa hết đơn' : 'Xóa dữ liệu mẫu (giữ thực đơn)'}</button>
      <button class="btn ${ui.armed === 'reset' ? 'danger armed' : ''}" data-act="reset">${ui.armed === 'reset' ? 'Bấm lần nữa để khôi phục' : 'Khôi phục bản demo ban đầu'}</button>
    </div>
    <p class="muted" style="margin:0;font-size:12px">Dữ liệu chỉ lưu trên trình duyệt của thiết bị này.</p>
  </div>`;
}

/* ================= Sheet (bảng trượt) ================= */
function sheetHTML() {
  const { kind, data } = ui.sheet;
  let title = '', body = '';
  if (kind === 'cart') { title = ''; body = cartHTML(); }
  if (kind === 'item') {
    const it = data;
    title = it._new ? 'Thêm món' : 'Sửa món';
    body = `<form id="itemForm" style="display:grid;gap:14px">
      <div class="photo-pick">${itemThumb(it)}<div style="display:grid;gap:6px"><label class="btn sm" style="width:max-content">${ic('cam')}Chọn ảnh<input type="file" id="itemImg" accept="image/*" hidden></label>
        ${it.img ? '<button type="button" class="btn ghost sm" data-act="img-clear">Bỏ ảnh</button>' : '<small class="muted">Ảnh được thu nhỏ để lưu trên máy.</small>'}</div></div>
      <label class="field"><span>Tên món</span><input id="fName" required value="${esc(it.name)}" placeholder="VD: Bánh Tacos Bò"></label>
      <div class="row2">
        <label class="field"><span>Giá tại quán (đ)</span><input id="fPrice" type="number" min="0" step="1000" required value="${it.price || ''}"></label>
        <label class="field"><span>Nhóm</span><select id="fCat">${S.categories.map(c => `<option value="${c.id}" ${c.id === it.cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      </div>
      <div class="field"><span>Bán trên sàn</span><small>Để trống giá = tự tính theo % tăng giá của sàn.</small></div>
      <div class="plat-prices">${FOOD_PLATFORMS.map(p => `<div class="plat-price">
        <label class="switch"><input type="checkbox" id="on-${p}" ${it.platforms[p]?.on ? 'checked' : ''} aria-label="Bán trên ${SOURCES[p].name}"><span></span></label>
        <div style="min-width:0"><div class="name">${srcTag(p)}</div><div class="hint num">${S.platforms[p].connected ? `Tự tính: ${money(platformPrice(S, { ...it, platforms: { [p]: {} } }, p))}` : 'Chưa kết nối'}</div></div>
        <input class="input num" id="pr-${p}" type="number" min="0" step="1000" placeholder="Tự tính" value="${it.platforms[p]?.price || ''}" aria-label="Giá trên ${SOURCES[p].name}">
      </div>`).join('')}</div>
      <div style="display:flex;gap:8px">${it._new ? '' : `<button type="button" class="btn danger ${ui.armed === 'del-' + it.id ? 'armed' : ''}" data-act="item-del">${ui.armed === 'del-' + it.id ? 'Bấm lần nữa để xóa' : 'Xóa món'}</button>`}
        <button class="btn primary" style="flex:1" type="submit">Lưu món</button></div>
    </form>`;
  }
  if (kind === 'cat') {
    title = data._new ? 'Thêm nhóm món' : 'Sửa nhóm món';
    const n = S.items.filter(i => i.cat === data.id).length;
    body = `<form id="catForm" style="display:grid;gap:14px">
      <label class="field"><span>Tên nhóm</span><input id="cName" required value="${esc(data.name)}"></label>
      <div class="field"><span>Biểu tượng</span><div class="chips">${['taco', 'chicken', 'fries', 'cup', 'dish'].map(k => `<button type="button" class="chip" data-act="cat-icon" data-id="${k}" aria-pressed="${data.icon === k}" aria-label="${k}">${ic(k, 'width="18" height="18"')}</button>`).join('')}</div></div>
      <div style="display:flex;gap:8px">${data._new ? '' : `<button type="button" class="btn danger ${ui.armed === 'cdel' ? 'armed' : ''}" data-act="cat-del" ${n ? 'disabled title="Chuyển hết món sang nhóm khác trước"' : ''}>${ui.armed === 'cdel' ? 'Bấm lần nữa để xóa' : 'Xóa nhóm'}</button>`}
        <button class="btn primary" style="flex:1" type="submit">Lưu nhóm</button></div>
      ${n && !data._new ? `<small class="muted">Nhóm có ${n} món nên chưa xóa được.</small>` : ''}
    </form>`;
  }
  if (kind === 'connect') {
    const p = data.id;
    title = `Kết nối ${SOURCES[p].name}`;
    body = `<form id="connForm" style="display:grid;gap:14px">
      <p class="muted" style="margin:0">Nhập mã cửa hàng trên ứng dụng đối tác của ${SOURCES[p].name}. Ở bản demo, bất kỳ mã nào cũng được chấp nhận và đơn sẽ được giả lập.</p>
      <label class="field"><span>Mã cửa hàng (Merchant ID)</span><input id="mId" required placeholder="VD: ${SOURCES[p].code}-123456"></label>
      <button class="btn primary block" type="submit">Kết nối</button></form>`;
  }
  return `<div class="sheet-wrap" role="dialog" aria-modal="true" aria-label="${esc(title || 'Đơn tại quán')}"><div class="scrim" data-act="close"></div>
    <div class="sheet"><div class="grab"></div>${title ? `<div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="Đóng">${ic('x')}</button></div>` : ''}${body}</div></div>`;
}

/* ================= Hành động ================= */
let toastT;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600);
}
let audioCtx;
function ding() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state !== 'running') return;
    [880, 1320].forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
      const t = audioCtx.currentTime + i * 0.16; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t); o.stop(t + 0.32);
    });
  } catch (e) { /* không có âm thanh */ }
}
function arm(key) { if (ui.armed === key) { ui.armed = null; return true; } ui.armed = key; render(); setTimeout(() => { if (ui.armed === key) { ui.armed = null; render(); } }, 4000); return false; }
function commit(msg) { save(); render(); if (msg) toast(msg); }
function openSheet(kind, data) { ui.sheet = { kind, data }; ui.armed = null; render(); }
function closeSheet() { ui.sheet = null; ui.armed = null; render(); }
function markDirty() { S.dirty++; }

const actions = {
  'pos-cat': d => { ui.posCat = d.id; render(); },
  add: d => {
    const it = S.items.find(i => i.id === d.id); if (!it?.available) return toast('Món này đang hết.');
    const c = ui.cart.find(x => x.id === d.id); c ? c.qty++ : ui.cart.push({ id: d.id, qty: 1 }); render();
  },
  qty: d => { const c = ui.cart.find(x => x.id === d.id); if (!c) return; c.qty += +d.d; if (c.qty <= 0) ui.cart = ui.cart.filter(x => x !== c); if (!ui.cart.length && ui.sheet?.kind === 'cart') ui.sheet = null; render(); },
  'cart-clear': () => { ui.cart = []; ui.sheet = null; render(); },
  'open-cart': () => openSheet('cart'),
  checkout: () => {
    if (!ui.cart.length) return;
    const lines = ui.cart.map(c => { const it = S.items.find(i => i.id === c.id); return { id: it.id, name: it.name, price: it.price, qty: c.qty }; });
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const o = { id: uid(), code: `TQ-${String(S.seq++).padStart(4, '0')}`, src: 'store', lines, total, commission: 0, status: 'preparing', at: Date.now(), customer: '', note: ui.cartNote, pay: ui.pay, table: ui.orderType === 'Tại bàn' ? ui.table : '' };
    S.orders.push(o); ui.cart = []; ui.cartNote = ''; ui.table = ''; ui.sheet = null;
    commit(`Đã thu ${money(total)} · đơn ${o.code} đã gửi bếp`);
  },
  'online-tab': d => { ui.onlineTab = d.id; render(); },
  'online-src': d => { ui.onlineSrc = d.id; render(); },
  simulate: () => { const o = PlatformAdapter.simulateIncoming(); if (!o) return toast('Hãy kết nối ít nhất một sàn trước.'); ding(); commit(`Đơn mới ${o.code} từ ${SOURCES[o.src].name}`); },
  advance: d => {
    const o = S.orders.find(x => x.id === d.id); if (!o) return;
    const next = { new: 'preparing', preparing: o.src === 'store' ? 'done' : 'ready', ready: 'done' }[o.status];
    o.status = next; commit(`${o.code}: ${STATUS[next].label}`);
  },
  reject: d => { if (!arm('rej-' + d.id)) return; const o = S.orders.find(x => x.id === d.id); if (o) { o.status = 'cancelled'; commit(`Đã từ chối ${o.code}`); } },
  'menu-cat': d => { ui.menuCat = d.id; render(); },
  sync: async () => {
    const live = FOOD_PLATFORMS.filter(p => S.platforms[p].connected);
    toast(`Đang đẩy thực đơn lên ${live.length} sàn…`);
    await Promise.all(live.map(p => PlatformAdapter.pushMenu(p)));
    live.forEach(p => S.lastSync[p] = Date.now()); S.dirty = 0;
    commit(`Đã đồng bộ ${S.items.length} món lên ${live.map(p => SOURCES[p].name).join(', ')}`);
  },
  'item-new': () => openSheet('item', { _new: true, id: 'i' + uid(), name: '', price: 0, cat: ui.menuCat !== 'all' ? ui.menuCat : S.categories[0]?.id, available: true, img: '', platforms: Object.fromEntries(FOOD_PLATFORMS.map(p => [p, { on: true, price: null }])) }),
  'item-edit': d => { const it = S.items.find(i => i.id === d.id); if (it) openSheet('item', JSON.parse(JSON.stringify(it))); },
  'item-del': () => { const it = ui.sheet.data; if (!arm('del-' + it.id)) return; S.items = S.items.filter(i => i.id !== it.id); ui.cart = ui.cart.filter(c => c.id !== it.id); markDirty(); ui.sheet = null; commit(`Đã xóa ${it.name}`); },
  'img-clear': () => { readItemForm(); ui.sheet.data.img = ''; render(); },
  'cat-new': () => openSheet('cat', { _new: true, id: 'c' + uid(), name: '', icon: 'dish' }),
  'cat-edit': d => { const c = S.categories.find(x => x.id === d.id); if (c) openSheet('cat', { ...c }); },
  'cat-icon': d => { ui.sheet.data.name = $('#cName')?.value ?? ui.sheet.data.name; ui.sheet.data.icon = d.id; render(); },
  'cat-del': () => { const c = ui.sheet.data; if (!arm('cdel')) return; S.categories = S.categories.filter(x => x.id !== c.id); if (ui.menuCat === c.id) ui.menuCat = 'all'; ui.sheet = null; commit(`Đã xóa nhóm ${c.name}`); },
  connect: d => openSheet('connect', { id: d.id }),
  disconnect: d => { if (!arm('disc-' + d.id)) return; S.platforms[d.id].connected = false; if (ui.onlineSrc === d.id) ui.onlineSrc = 'all'; commit(`Đã ngắt ${SOURCES[d.id].name}`); },
  wipe: () => { if (!arm('wipe')) return; S.orders = []; S.sample = false; commit('Đã xóa toàn bộ đơn. Bắt đầu bán thật thôi!'); },
  reset: () => { if (!arm('reset')) return; S = seedData(); ui.cart = []; commit('Đã khôi phục bản demo'); },
  range: d => { ui.range = +d.id; render(); },
  close: () => closeSheet(),
};

function readItemForm() {
  const it = ui.sheet?.data; if (!it || !$('#fName')) return it;
  it.name = $('#fName').value.trim(); it.price = +$('#fPrice').value || 0; it.cat = $('#fCat').value;
  for (const p of FOOD_PLATFORMS) { it.platforms[p] = { on: $('#on-' + p).checked, price: +$('#pr-' + p).value || null }; }
  return it;
}

function onClick(e) {
  if (audioCtx?.state === 'suspended') audioCtx.resume(); else if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (er) { /* */ } }
  const el = e.target.closest('[data-act]'); if (!el || el.matches('input')) return;
  const fn = actions[el.dataset.act]; if (!fn) return;
  e.preventDefault(); fn(el.dataset);
}
function onChange(e) {
  const el = e.target;
  if (el.id === 'orderType') { ui.orderType = el.value; render(); return; }
  if (el.id === 'payType') { ui.pay = el.value; return; }
  if (el.id === 'autoSim') { ui.autoSim = el.checked; toast(el.checked ? 'Sẽ tự sinh đơn thử mỗi 40 giây' : 'Đã tắt tự sinh đơn'); return; }
  if (el.id === 'shopName') { S.shop = el.value.trim() || 'Quán của tôi'; commit('Đã lưu tên quán'); return; }
  if (el.id === 'itemImg' && el.files?.[0]) { readItemForm(); resizeImage(el.files[0]).then(url => { ui.sheet.data.img = url; render(); }).catch(() => toast('Không đọc được ảnh này.')); return; }
  const act = el.dataset.act;
  if (act === 'avail') { const it = S.items.find(i => i.id === el.dataset.id); it.available = el.checked; markDirty(); commit(`${it.name}: ${it.available ? 'còn món' : 'đã báo hết'}`); }
  if (act === 'auto-accept') { S.platforms[el.dataset.id].autoAccept = el.checked; commit(`${SOURCES[el.dataset.id].name}: ${el.checked ? 'tự động nhận đơn' : 'nhận đơn thủ công'}`); }
  if (act === 'plat-num') { const v = Math.max(0, Math.min(100, +el.value || 0)); S.platforms[el.dataset.id][el.dataset.k] = v; if (el.dataset.k === 'markup') markDirty(); commit('Đã lưu'); }
}
function onInput(e) {
  const el = e.target;
  if (el.id === 'posSearch') { ui.posQuery = el.value; const g = $('#posGrid'); if (g) g.innerHTML = posGridHTML(); }
  if (el.id === 'cartNote') ui.cartNote = el.value;
  if (el.id === 'tableNo') ui.table = el.value;
}
function onSubmit(e) {
  e.preventDefault();
  if (e.target.id === 'itemForm') {
    const it = readItemForm(); if (!it.name || !it.price) return toast('Cần nhập tên và giá món.');
    const isNew = it._new; delete it._new;
    if (isNew) S.items.push(it); else S.items = S.items.map(i => i.id === it.id ? it : i);
    markDirty(); ui.sheet = null; commit(isNew ? `Đã thêm ${it.name}` : `Đã lưu ${it.name}`);
  }
  if (e.target.id === 'catForm') {
    const c = ui.sheet.data; c.name = $('#cName').value.trim(); if (!c.name) return;
    const isNew = c._new; delete c._new;
    if (isNew) S.categories.push(c); else S.categories = S.categories.map(x => x.id === c.id ? c : x);
    markDirty(); ui.sheet = null; commit(`Đã lưu nhóm ${c.name}`);
  }
  if (e.target.id === 'connForm') {
    const p = ui.sheet.data.id; const id = $('#mId').value.trim(); if (!id) return;
    Object.assign(S.platforms[p], { connected: true, merchantId: id }); S.lastSync[p] = Date.now();
    ui.sheet = null; commit(`Đã kết nối ${SOURCES[p].name}. Thực đơn đã được đẩy lên sàn.`);
  }
}
function resizeImage(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => { const img = new Image(); img.onerror = rej; img.onload = () => {
      const s = Math.min(1, 320 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.8)); }; img.src = fr.result; };
    fr.readAsDataURL(file);
  });
}

/* ================= Điều hướng & vòng lặp ================= */
function route() {
  const h = (location.hash || '').slice(1);
  ui.view = VIEWS.includes(h) ? h : 'pos'; ui.sheet = null; ui.armed = null;
  render(); window.scrollTo(0, 0);
}
function tick() {
  document.querySelectorAll('.timer[data-at]').forEach(el => { const m = mins(+el.dataset.at); el.textContent = m + ' phút'; el.classList.toggle('late', m >= LATE_MIN); });
}
let simCounter = 0;
function loop() {
  tick();
  if (ui.autoSim && ++simCounter >= 4) { // ~40 giây
    simCounter = 0;
    const o = PlatformAdapter.simulateIncoming();
    if (o) { save(); ding(); toast(`Đơn mới ${o.code} từ ${SOURCES[o.src].name}`); if (!ui.sheet && !(document.activeElement && document.activeElement.matches('input,select,textarea'))) render(); }
  }
}

S = load(); save();
document.addEventListener('click', onClick);
document.addEventListener('change', onChange);
document.addEventListener('input', onInput);
document.addEventListener('submit', onSubmit);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.sheet) closeSheet(); });
window.addEventListener('hashchange', route);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', render);
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
route();
setInterval(loop, 10000);
if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(() => {}); }
})();
