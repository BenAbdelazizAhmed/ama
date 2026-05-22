import { Injectable, signal } from '@angular/core';

export interface AnimalAd {
  id: number;
  name: string;
  category: string;
  price: number;
  location: string;
  weight: string;
  gender: string;
  age: string;
  healthStatus: string;
  emoji: string;
  sellerName: string;
  sellerRating: number;
  featured: boolean;
  verified: boolean;
  phone: string;
  description: string;
  imageUrl?: string;
}

export interface Worker {
  id: number;
  name: string;
  title: string;
  location: string;
  experience: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string;
  price: number;
  priceUnit: string;
  available: boolean;
  skills: string;
  avatarUrl: string;
  coverUrl: string;
  description: string;
}

export interface ProfessionalProfile {
  id: number;
  fullName: string;
  region: string;
  serviceType: string;
  experienceDescription: string;
  price: number;
  period: string;
  availability: string;
  plan: string;
  status: string;
  createdAt: string;
}

export interface ServiceRequest {
  id: number;
  requestTitle: string;
  region: string;
  serviceType: string;
  details: string;
  budget: number;
  period: string;
  availability: string;
  status: string;
  createdAt: string;
}

export interface JobOffer {
  id: number;
  title: string;
  employer: string;
  logo: string;
  location: string;
  jobType: string;
  salary: string;
  period: string;
  badge: string;
  badgeText: string;
  description: string;
  tags: string;
  deadline: string;
}

export interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  priceType?: string;
  unit: string;
  quantity?: string;
  origin?: string;
  location: string;
  wilaya?: string;
  imageUrl: string;
  contactPhone: string;
  inStock?: boolean;
  featured?: boolean;
  deliveryAvailable?: boolean;
  certified?: boolean;
  sellerType?: string;
  companyName?: string;
  companyTagline?: string;
  companyVerified?: boolean;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerRating?: string;
  userId: number;
  createdAt: string;
}

export interface WholesaleItem {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  priceUnit: string;
  minQuantity: number;
  location: string;
  supplierName: string;
  imageUrl: string;
  contactPhone: string;
  userId: number;
  createdAt: string;
}

export interface UserInfo {
  fullName: string;
  email: string;
  avatar: string;
  role: string;
}

export interface Notification {
  icon: string;
  emoji: string;
  title: string;
  sub: string;
  time: string;
  read: boolean;
}

const LS = {
  get<T>(k: string, fallback: T): T {
    try {
      const r = localStorage.getItem(k);
      if (!r) return fallback;
      const p = JSON.parse(r);
      if (p && typeof p === 'object' && '__exp' in p && typeof (p as { __exp?: number }).__exp === 'number') {
        if (Date.now() > (p as { __exp: number }).__exp) {
          localStorage.removeItem(k);
          return fallback;
        }
      }
      return p && typeof p === 'object' && '__val' in p ? (p as { __val: T }).__val : (p as T);
    } catch { return fallback; }
  },
  set(k: string, v: unknown, ttlMs?: number) {
    try { localStorage.setItem(k, JSON.stringify(ttlMs ? { __val: v, __exp: Date.now() + ttlMs } : v)); } catch {}
  },
  del(k: string) { try { localStorage.removeItem(k); } catch {} }
};

@Injectable({ providedIn: 'root' })
export class StateService {
  readonly user = signal<UserInfo | null>(null);
  readonly cart = signal<AnimalAd[]>([]);
  readonly favs = signal<number[]>([]);
  readonly notifs = signal<Notification[]>([]);
  readonly animals = signal<AnimalAd[]>([]);
  readonly workers = signal<Worker[]>([]);
  readonly profiles = signal<ProfessionalProfile[]>([]);
  readonly requests = signal<ServiceRequest[]>([]);
  readonly jobs = signal<JobOffer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly wholesale = signal<WholesaleItem[]>([]);

  private apiBase = 'http://localhost:8081';
  private _token: string | null = null;
  private static readonly LS_ANIMALS = 'af_animals_cache';

  /** Profil affiché — toujours synchronisé avec le token tant que la session est ouverte */
  private static readonly LS_USER = 'af_user';

  constructor() {
    this._token = LS.get<string | null>('af_token', null);

    let savedUser = LS.get<UserInfo | null>(StateService.LS_USER, null);
    if (!savedUser) savedUser = LS.get<UserInfo | null>('af_user_remember', null);

    if (this._token) {
      if (savedUser) this.user.set(savedUser);
      else {
        const fromJwt = this.userFromJwt(this._token);
        if (fromJwt) {
          this.user.set(fromJwt);
          LS.set(StateService.LS_USER, fromJwt);
        }
      }
    } else {
      this.user.set(null);
      LS.del(StateService.LS_USER);
      LS.del('af_user_remember');
    }

    this.cart.set(LS.get<AnimalAd[]>('af_cart', []));
    this.favs.set(LS.get<number[]>('af_favs', []));
    this.notifs.set(LS.get<Notification[]>('af_notifs', []));
    const cached = LS.get<AnimalAd[]>(StateService.LS_ANIMALS, []);
    if (cached.length) this.animals.set(cached);
    this.loadAll();
  }

  /** Décode le JWT (sans vérifier la signature) pour restaurer email/rôle après un rechargement */
  private userFromJwt(token: string): UserInfo | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(json) as Record<string, unknown>;
      const email = String(payload['email'] ?? payload['sub'] ?? '').trim();
      if (!email) return null;
      const base = email.includes('@') ? email.split('@')[0] : email;
      return {
        fullName: base || 'مستخدم',
        email,
        avatar: '🌿',
        role: String(payload['role'] ?? 'CLIENT'),
      };
    } catch {
      return null;
    }
  }

  get token() { return this._token; }
  setToken(t: string | null) {
    this._token = t;
    if (t) LS.set('af_token', t);
    else {
      LS.del('af_token');
      LS.del(StateService.LS_USER);
      LS.del('af_user_remember');
    }
  }

  private getHeaders(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this._token) h['Authorization'] = `Bearer ${this._token}`;
    return h;
  }

  private async loadAll() {
    await Promise.all([
      this.fetchAnimals(),
      this.fetchWorkers(),
      this.fetchProfiles(),
      this.fetchRequests(),
      this.fetchJobs(),
      this.fetchProducts(),
      this.fetchWholesale(),
    ]);
  }

  /* ══ ANIMALS ══ */
  private async fetchAnimals() {
    try {
      const res = await fetch(`${this.apiBase}/api/animals`);
      if (!res.ok) return;
      const data = await res.json();
      const local = this.animals();
      const localMap = new Map(local.filter(a => a.imageUrl?.startsWith('data:')).map(a => [a.id, a.imageUrl]));
      const mapped = (data || []).map((a: any) => {
        const m = this.mapAnimal(a);
        const localUrl = localMap.get(Number(a.id)) || localMap.get(a.id);
        if (localUrl) m.imageUrl = localUrl;
        return m;
      });
      const localOnly = local.filter(a => !mapped.find((m: AnimalAd) => m.id === a.id));
      const merged = [...localOnly, ...mapped];
      this.animals.set(merged);
      LS.set(StateService.LS_ANIMALS, merged);
    } catch {}
  }

  private mapAnimal(a: any): AnimalAd {
    return {
      id: a.id, name: a.title || '—', category: a.category || '',
      price: Number(a.price) || 0, location: a.wilaya || '',
      weight: a.zone || '', gender: a.gender || '', age: a.age || '',
      healthStatus: a.healthStatus || '',
      emoji: this.getCatEmoji(a.category),
      sellerName: a.trustedSeller ? 'بائع موثق' : 'مستخدم',
      sellerRating: 4.8, featured: a.featured || false,
      verified: a.trustedSeller || false, phone: a.phone || '',
      description: a.description || '', imageUrl: a.images?.[0] || '',
    };
  }

  async addAnimal(ad: AnimalAd) {
    const tempId = ad.id;
    this.animals.update(list => { const next = [ad, ...list]; LS.set(StateService.LS_ANIMALS, next); return next; });
    try {
      const res = await fetch(`${this.apiBase}/api/animals`, {
        method: 'POST', headers: this.getHeaders(),
        body: JSON.stringify({
          title: ad.name, description: ad.description, category: ad.category,
          price: ad.price, wilaya: ad.location, zone: ad.weight, age: ad.age,
          gender: ad.gender, healthStatus: ad.healthStatus, phone: ad.phone,
          contactMethod: 'whatsapp', deliveryAvailable: false, vetCertificate: false,
          featured: ad.featured, trustedSeller: ad.verified, userId: null,
          images: ad.imageUrl ? [ad.imageUrl] : [],
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        this.animals.update(list => {
          const next = list.map(a => a.id === tempId && saved.id ? { ...a, id: saved.id } : a);
          LS.set(StateService.LS_ANIMALS, next);
          return next;
        });
      }
    } catch {}
  }

  /* ══ WORKERS ══ */
  private async fetchWorkers() {
    try {
      const res = await fetch(`${this.apiBase}/api/workers`);
      if (!res.ok) return;
      this.workers.set(await res.json());
    } catch {}
  }

  async addWorker(w: Worker) {
    this.workers.update(list => [w, ...list]);
    try {
      const { id: _clientId, ...rest } = w;
      const body = {
        ...rest,
        rating: Number(rest.rating) || 0,
        reviewCount: Math.floor(Number(rest.reviewCount)) || 0,
        completedJobs: Math.floor(Number(rest.completedJobs)) || 0,
        price: Math.floor(Number(rest.price)) || 0,
        available: !!rest.available,
      };
      const res = await fetch(`${this.apiBase}/api/workers`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) await this.fetchWorkers();
    } catch {}
  }

  async updateWorker(id: number, w: Worker) {
    try {
      const res = await fetch(`${this.apiBase}/api/workers/${id}`, {
        method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(w),
      });
      if (res.ok) this.fetchWorkers();
    } catch {}
  }

  async deleteWorker(id: number) {
    try {
      await fetch(`${this.apiBase}/api/workers/${id}`, { method: 'DELETE' });
      this.workers.update(list => list.filter(x => x.id !== id));
    } catch {}
  }

  /* ══ PROFILES ══ */
  private async fetchProfiles() {
    try {
      const res = await fetch(`${this.apiBase}/api/profiles`);
      if (!res.ok) return;
      this.profiles.set(await res.json());
    } catch {}
  }

  async addProfile(p: ProfessionalProfile) {
    this.profiles.update(list => [p, ...list]);
    try {
      const { id: _clientId, ...body } = p;
      const res = await fetch(`${this.apiBase}/api/profiles`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) await this.fetchProfiles();
    } catch {}
  }

  async deleteProfile(id: number) {
    try {
      await fetch(`${this.apiBase}/api/profiles/${id}`, { method: 'DELETE' });
      this.profiles.update(list => list.filter(x => x.id !== id));
    } catch {}
  }

  /* ══ SERVICE REQUESTS ══ */
  private async fetchRequests() {
    try {
      const res = await fetch(`${this.apiBase}/api/service-requests`);
      if (!res.ok) return;
      this.requests.set(await res.json());
    } catch {}
  }

  async addRequest(r: ServiceRequest) {
    this.requests.update(list => [r, ...list]);
    try {
      const { id: _clientId, ...body } = r;
      const res = await fetch(`${this.apiBase}/api/service-requests`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) await this.fetchRequests();
    } catch {}
  }

  async deleteRequest(id: number) {
    try {
      await fetch(`${this.apiBase}/api/service-requests/${id}`, { method: 'DELETE' });
      this.requests.update(list => list.filter(x => x.id !== id));
    } catch {}
  }

  /* ══ JOBS ══ */
  private async fetchJobs() {
    try {
      const res = await fetch(`${this.apiBase}/api/jobs`);
      if (!res.ok) return;
      this.jobs.set(await res.json());
    } catch {}
  }

  async addJob(j: JobOffer) {
    this.jobs.update(list => [j, ...list]);
    try {
      const { id: _clientId, ...body } = j;
      const res = await fetch(`${this.apiBase}/api/jobs`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) await this.fetchJobs();
    } catch {}
  }

  async deleteJob(id: number) {
    try {
      await fetch(`${this.apiBase}/api/jobs/${id}`, { method: 'DELETE' });
      this.jobs.update(list => list.filter(x => x.id !== id));
    } catch {}
  }

  /* ══ PRODUCTS ══ */
  private async fetchProducts() {
    try {
      const res = await fetch(`${this.apiBase}/api/products`);
      if (!res.ok) return;
      this.products.set(await res.json());
    } catch {}
  }

  async addProduct(p: Product) {
    this.products.update(list => [p, ...list]);
    try {
      await fetch(`${this.apiBase}/api/products`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(p),
      });
    } catch {}
  }

  async deleteProduct(id: number) {
    try {
      await fetch(`${this.apiBase}/api/products/${id}`, { method: 'DELETE' });
      this.products.update(list => list.filter(x => x.id !== id));
    } catch {}
  }

  /* ══ WHOLESALE ══ */
  private async fetchWholesale() {
    try {
      const res = await fetch(`${this.apiBase}/api/wholesale`);
      if (!res.ok) return;
      this.wholesale.set(await res.json());
    } catch {}
  }

  async addWholesale(w: WholesaleItem) {
    this.wholesale.update(list => [w, ...list]);
    try {
      await fetch(`${this.apiBase}/api/wholesale`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(w),
      });
    } catch {}
  }

  async deleteWholesale(id: number) {
    try {
      await fetch(`${this.apiBase}/api/wholesale/${id}`, { method: 'DELETE' });
      this.wholesale.update(list => list.filter(x => x.id !== id));
    } catch {}
  }

  /* ══ AUTH ══ */
  setUser(u: UserInfo | null, remember = false) {
    this.user.set(u);
    if (!u) {
      LS.del(StateService.LS_USER);
      LS.del('af_user_remember');
      return;
    }
    LS.set(StateService.LS_USER, u);
    if (remember) LS.set('af_user_remember', u, 30 * 24 * 60 * 60 * 1000);
  }

  logout() {
    this.user.set(null);
    this._token = null;
    this.cart.set([]);
    LS.del('af_cart');
    LS.del(StateService.LS_USER);
    LS.del('af_user_remember');
    LS.del('af_token');
  }

  /* ══ CART ══ */
  addToCart(ad: AnimalAd) {
    if (this.cart().find(x => x.id === ad.id)) return false;
    this.cart.update(list => [...list, ad]);
    LS.set('af_cart', this.cart());
    return true;
  }

  removeFromCart(id: number) {
    this.cart.update(list => list.filter(x => x.id !== id));
    LS.set('af_cart', this.cart());
  }

  /* ══ FAVORITES ══ */
  toggleFav(id: number): boolean {
    const has = this.favs().includes(id);
    if (has) this.favs.update(list => list.filter(x => x !== id));
    else this.favs.update(list => [...list, id]);
    LS.set('af_favs', this.favs());
    return !has;
  }

  isFav(id: number): boolean { return this.favs().includes(id); }

  /* ══ NOTIFICATIONS ══ */
  markNotifRead(index: number) {
    this.notifs.update(list => { list[index].read = true; return [...list]; });
  }

  markAllNotifsRead() {
    this.notifs.update(list => list.map(n => ({ ...n, read: true })));
  }

  unreadNotifCount(): number { return this.notifs().filter(n => !n.read).length; }

  /* ══ UTILITY ══ */
  fmtPrice(n: string | number): string {
    return Number.isFinite(+n) ? (+n).toLocaleString('fr-FR') : String(n);
  }

  esc(s: unknown): string {
    const str = typeof s === 'string' ? s : String(s ?? '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }

  getCatEmoji(cat: string): string {
    return { 'أغنام': '🐑', 'أبقار': '🐄', 'دواجن': '🐔', 'ماعز': '🐐', 'منتجات': '🌾', 'خدمات': '🚚' }[cat] || '🐑';
  }
}
