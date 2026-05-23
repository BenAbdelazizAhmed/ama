import { Component, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy, NgZone, HostListener, effect } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { StateService, AnimalAd, UserInfo } from './services/state.service';
import { environment } from '../environments/environment';

declare const lucide: any;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('toastWrap') toastWrapRef!: ElementRef;
  @ViewChild('panelOverlay') panelOverlayRef!: ElementRef;
  @ViewChild('cartPanel') cartPanelRef!: ElementRef;
  @ViewChild('messagesPanel') messagesPanelRef!: ElementRef;
  @ViewChild('notifPanel') notifPanelRef!: ElementRef;
  @ViewChild('addPanel') addPanelRef!: ElementRef;
  @ViewChild('userDropdown') userDropdownRef!: ElementRef;
  @ViewChild('searchInput') searchInputRef!: ElementRef;
  @ViewChild('adsGrid') adsGridRef!: ElementRef;
  @ViewChild('pagination') paginationRef!: ElementRef;
  @ViewChild('detailsModal') detailsModalRef!: ElementRef;
  @ViewChild('authOverlay') authOverlayRef!: ElementRef;

  user: UserInfo | null = null;
  cart: AnimalAd[] = [];
  notifs: any[] = [];
  animals: AnimalAd[] = [];
  currentPage = 1;
  readonly PAGE_SIZE = 6;
  currentPanel: string | null = null;
  selectedAd: AnimalAd | null = null;
  dropOpen = false;
  currentAuthTab = 'login';
  currentRegStep = 1;
  darkMode = false;
  isScrolled = false;
  showBackTop = false;
  navHidden = false;
  routeTransition = false;
  currentYear = new Date().getFullYear();
  private lastScrollY = 0;
  private viewReady = false;
  addCategory = 'أغنام';
  regCategory = 'تربية الحيوانات';
  loginAttempts = { count: 0, blockedUntil: 0 };
  private filterTimer: any;
  private registerSubmitting = false;
  uploadedPhotos: File[] = [];
  private routerIconSub?: Subscription;

  private readonly API_BASE = environment.apiBaseUrl;

  constructor(public state: StateService, private router: Router, private zone: NgZone) {
    effect(() => {
      this.user = state.user();
      if (this.viewReady) {
        setTimeout(() => this.applyAuthState());
      }
    });
    effect(() => { this.cart = state.cart(); });
    effect(() => { this.notifs = state.notifs(); });
    effect(() => {
      this.animals = state.animals();
      if (this.adsGridRef?.nativeElement && this.animals.length) {
        this.renderAnimals(this.animals);
        this.updateSidebarStats();
      }
    });
  }

  ngOnInit() {
    this.darkMode = localStorage.getItem('amanafarm-theme') === 'dark';
    document.documentElement.classList.toggle('theme-dark', this.darkMode);
    this.onWindowScroll();
    this.routerIconSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.routeTransition = false;
        window.scrollTo({ top: 0, behavior: 'auto' });
        setTimeout(() => this.refreshIcons(), 40);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.viewReady = true;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      this.applyAuthState();
      const grid = this.adsGridRef?.nativeElement;
      if (grid) { grid.addEventListener('click', (ev: Event) => this.handleGridClick(ev)); }
      const pg = this.paginationRef?.nativeElement;
      if (pg) { pg.addEventListener('click', (ev: Event) => this.handlePaginationClick(ev)); }
    });
  }

  ngOnDestroy() {
    if (this.filterTimer) clearTimeout(this.filterTimer);
    this.routerIconSub?.unsubscribe();
  }

  private refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    this.isScrolled = y > 80;
    this.showBackTop = y > 520;
    this.navHidden = y > 180 && y > this.lastScrollY + 6;
    this.lastScrollY = Math.max(0, y);
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('theme-dark', this.darkMode);
    localStorage.setItem('amanafarm-theme', this.darkMode ? 'dark' : 'light');
    setTimeout(() => this.refreshIcons());
  }

  /* â•â• HELPERS â•â• */
  $(id: string): HTMLElement | null { return document.getElementById(id); }

  sv(s: string): string { return (document.getElementById(s) as HTMLInputElement)?.value?.trim() || ''; }

  /** Align with backend digit-only phones; registration UI shows +216 outside the input â€” prepend when absent */
  private normalizeTnMobile(raw: string): string {
    let d = raw.replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    while (d.startsWith('0')) d = d.slice(1);
    if (!d.startsWith('216')) d = '216' + d;
    return d;
  }

  scrollTo(id: string) {
    if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  fmt(n: string | number): string { return this.state.fmtPrice(n); }

  esc(s: unknown): string { return this.state.esc(s); }

  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  /* â•â• AUTH â•â• */
  applyAuthState() {
    const loggedIn = !!this.user;
    document.body.classList.toggle('logged-in', loggedIn);
    if (loggedIn) {
      const u = this.user!;
      const displayName = this.formatUserDisplayName(u);
      this.setText('userName', displayName);
      this.setText('userInitial', this.userInitial(displayName));
      this.setText('udAvt', u.avatar || '🌿');
      this.setText('udName', u.fullName || 'مستخدم');
      this.setText('udEmail', u.email || '');
      this.setHtml('userAvatar', `<span style="font-size:17px" aria-hidden="true">${u.avatar || '🌿'}</span>`);
      this.renderNotifPanel();
      this.renderMessagesPanel();
      this.updateCartBadge();
      this.updateNotifBadge();
      this.updateMsgBadge();
    } else {
      this.setText('userName', '—');
      this.setText('userInitial', 'م');
      this.setHtml('userAvatar', '<i data-lucide="user" width="17" stroke="var(--muted)" aria-hidden="true"></i>');
      if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [this.$('userAvatar')] });
    }
  }

  private formatUserDisplayName(u: UserInfo): string {
    const raw = String(u.fullName || u.email || '').trim();
    if (!raw) return 'مستخدم';
    const cleaned = raw.includes('@') ? raw.split('@')[0] : raw;
    const first = cleaned.split(/\s+/).filter(Boolean)[0] || cleaned;
    return first.replace(/^[a-z]/, c => c.toUpperCase());
  }

  private userInitial(name: string): string {
    return (name || 'مستخدم').trim().slice(0, 1).toUpperCase();
  }

  private setText(id: string, t: string) { const el = this.$(id); if (el) el.textContent = t; }
  private setHtml(id: string, h: string) { const el = this.$(id); if (el) el.innerHTML = h; }

  /* â•â• TOAST â•â• */
  toast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    const wrap = this.toastWrapRef?.nativeElement;
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : type === 'info' ? ' info' : '');
    el.setAttribute('role', 'status');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('fadeout'); setTimeout(() => el.remove(), 260); }, 2400);
  }

  /* â•â• AUTH MODAL â•â• */
  openAuthModal(tab = 'login') {
    this.$( 'authOverlay')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.switchAuthTab(tab);
  }

  closeModal(id: string) {
    this.$( id)?.classList.remove('show');
    document.body.style.overflow = '';
  }

  switchAuthTab(tab: string) {
    const id = 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1);
    ['panelLogin','panelRegister','panelSuccess','panelForgot'].forEach(p => this.$(p)?.classList.remove('active'));
    ['tabLogin','tabRegister'].forEach(t => { this.$(t)?.classList.remove('active'); this.$(t)?.setAttribute('aria-selected','false'); });
    this.$( id)?.classList.add('active');
    if (tab === 'login') { this.$( 'tabLogin')?.classList.add('active'); this.$( 'tabLogin')?.setAttribute('aria-selected','true'); }
    if (tab === 'register') { this.$( 'tabRegister')?.classList.add('active'); this.$( 'tabRegister')?.setAttribute('aria-selected','true'); }
    this.currentAuthTab = tab;
  }

  clearErrors() {
    document.querySelectorAll('.input-err').forEach(e => e.classList.remove('input-err'));
    document.querySelectorAll('.err-msg.show').forEach(e => e.classList.remove('show'));
  }

  showErr(inputId: string, errId: string) {
    this.$( inputId)?.classList.add('input-err');
    this.$( errId)?.classList.add('show');
  }

  isRateLimited(): boolean { return Date.now() < this.loginAttempts.blockedUntil; }

  registerAttempt(): boolean {
    this.loginAttempts.count++;
    if (this.loginAttempts.count >= 5) { this.loginAttempts.blockedUntil = Date.now() + 60000; this.loginAttempts.count = 0; return true; }
    return false;
  }

  async doLogin() {
    if (this.isRateLimited()) {
      this.$( 'loginRateNotice')?.classList.add('show');
      const remain = Math.ceil((this.loginAttempts.blockedUntil - Date.now()) / 1000);
      this.toast(`انتظر ${remain} ثانية قبل المحاولة من جديد`, 'error');
      return;
    }
    this.$( 'loginRateNotice')?.classList.remove('show');
    this.clearErrors();
    let ok = true;
    const emailVal = this.sv('loginEmail');
    const pwVal = this.sv('loginPassword');
    const isEmail = !!emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    const isPhone = emailVal.replace(/\D/g, '').length >= 8;
    if (!isEmail && !isPhone) { this.showErr('loginEmail','loginEmailErr'); ok = false; }
    if (pwVal.length < 3) { this.showErr('loginPassword','loginPasswordErr'); ok = false; }
    if (!ok) return;

    const btn = this.$('loginBtn') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'جاري التحقق...'; }

    try {
      const loginIdentifier = isEmail ? emailVal.trim() : this.normalizeTnMobile(emailVal);
      const res = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginIdentifier, password: pwVal })
      });
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        /* empty body */
      }
      if (res.ok && typeof data['token'] === 'string') {
        this.state.setToken(data['token']);
        this.finalizeLogin({
          fullName: (data['fullName'] as string) || (data['email'] as string),
          email: data['email'] as string,
          avatar: '🌿',
          role: (data['role'] as string) || 'CLIENT'
        }, false, !!(document.getElementById('rememberMe') as HTMLInputElement)?.checked);
        if (btn) btn.disabled = false;
        return;
      }
      if (btn) { btn.disabled = false; btn.textContent = 'تسجيل الدخول'; }
      this.toast(typeof data['error'] === 'string' ? data['error'] : 'فشل تسجيل الدخول', 'error');
    } catch {
      if (btn) { btn.disabled = false; btn.textContent = 'تسجيل الدخول'; }
      this.toast('تعذر الاتصال بالخادم', 'error');
    }
  }

  finalizeLogin(u: UserInfo, isNew: boolean, remember: boolean) {
    this.state.setUser(u, remember);
    this.state.notifs.set(this.notifs.map((n: any) => ({ ...n })));
    this.applyAuthState();
    this.setText('successTitle', isNew ? `أهلاً وسهلاً، ${this.esc(u.fullName || u.email)}` : `مرحباً من جديد، ${this.esc(u.fullName || u.email)}!`);
    this.setText('successSub', isNew ? 'تم إنشاء حسابك بنجاح.' : 'تم تسجيل دخولك بنجاح.');
    this.switchAuthTab('success');
    this.toast(isNew ? 'تم إنشاء الحساب بنجاح' : 'أهلاً بك من جديد');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  doLogout() {
    this.state.logout();
    this.applyAuthState();
    this.updateCartBadge();
    this.closePanel();
    this.closeDropdown();
    this.toast('تم تسجيل الخروج بنجاح');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* â•â• PANELS â•â• */
  openPanel(name: string) {
    if (!this.user) { this.openAuthModal('login'); this.toast('سجّل الدخول أولاً للوصول لهذه الميزة', 'error'); return; }
    this.closePanel(false);
    this.currentPanel = name;
    const panelMap: Record<string, string> = { cart: 'cartPanel', messages: 'messagesPanel', notif: 'notifPanel', add: 'addPanel' };
    const panel = this.$( panelMap[name]);
    if (!panel) return;
    panel.classList.add('open');
    this.$( 'panelOverlay')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    const actMap: Record<string, string> = { cart: 'cartAction', messages: 'messagesAction', notif: 'notifAction' };
    if (actMap[name]) this.$( actMap[name])?.classList.add('active-panel');
    if (name === 'cart') this.renderCart();
    if (name === 'notif') { this.renderNotifPanel(); this.updateNotifBadge(); }
    if (name === 'messages') this.renderMessagesPanel();
  }

  closePanel(restore = true) {
    document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
    this.$( 'panelOverlay')?.classList.remove('show');
    document.querySelectorAll('.hact').forEach(b => b.classList.remove('active-panel'));
    if (restore) document.body.style.overflow = '';
    this.currentPanel = null;
  }

  /* â•â• DROPDOWN â•â• */
  toggleDropdown(event: Event) {
    if (!this.user) { this.openAuthModal('login'); return; }
    event.stopPropagation();
    this.dropOpen = !this.dropOpen;
    this.userDropdownRef?.nativeElement.classList.toggle('show', this.dropOpen);
    this.$( 'userAction')?.setAttribute('aria-expanded', String(this.dropOpen));
  }

  closeDropdown() {
    this.dropOpen = false;
    this.userDropdownRef?.nativeElement.classList.remove('show');
    this.$( 'userAction')?.setAttribute('aria-expanded', 'false');
  }

  /* â•â• CART â•â• */
  updateCartBadge() {
    const n = this.cart.length, b = this.$('cartBadge');
    if (b) { b.textContent = String(n); b.classList.toggle('hidden', n === 0); }
  }

  renderCart() {
    const body = this.$('cartBody'), footer = this.$('cartFooter');
    if (!body || !footer) return;
    if (!this.cart.length) {
      body.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon" aria-hidden="true">🛒</div><p>السلة فارغة</p><p class="cart-empty-sub">احفظ الإعلانات اللي تهمك وقارن بينها قبل التواصل.</p></div>';
      footer.innerHTML = '';
      return;
    }
    body.innerHTML = this.cart.map((item: any) => `
      <div class="cart-item">
        <div class="cart-img" aria-hidden="true">${item.emoji || '🌿'}</div>
        <div class="cart-info">
          <div class="cart-name">${this.esc(item.name)}</div>
          <div class="cart-price">${this.fmt(item.price)} دت</div>
          <div class="cart-loc">📍 ${this.esc(item.location)}</div>
        </div>
        <button class="cart-remove" data-remove-id="${Number(item.id)}" aria-label="حذف ${this.esc(item.name)} من السلة">×</button>
      </div>
    `).join('');
    body.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', () => this.removeFromCart(Number((btn as HTMLElement).dataset['removeId'])));
    });
    const total = this.cart.reduce((s: number, x: any) => s + (+x.price || 0), 0);
    footer.innerHTML = `
      <div class="cart-total-row"><span class="cart-total-label">الإجمالي التقديري</span><span class="cart-total-val">${this.fmt(total)} دت</span></div>
      <button class="checkout-btn" id="checkoutBtn" type="button">متابعة الصفقة</button>`;
    footer.querySelector('#checkoutBtn')?.addEventListener('click', () => this.showComingSoon('الدفع الإلكتروني'));
  }

  addToCart(ad: AnimalAd) {
    if (!this.user) { this.openAuthModal('login'); this.toast('سجّل الدخول باش تحفظ الإعلان', 'error'); return; }
    if (this.state.addToCart(ad)) this.toast('تم حفظ الإعلان في السلة');
    else this.toast('الإعلان موجود مسبقاً في السلة', 'info');
    this.renderCart();
    this.updateCartBadge();
  }

  removeFromCart(id: number) {
    this.state.removeFromCart(id);
    this.renderCart();
    this.updateCartBadge();
  }

  /* â•â• NOTIFS â•â• */
  updateNotifBadge() {
    const n = this.state.unreadNotifCount(), b = this.$('notifBadge');
    if (b) { b.textContent = String(n); b.classList.toggle('hidden', n === 0); }
  }

  renderNotifPanel() {
    const body = this.$('notifBody');
    if (!body) return;
    if (!this.notifs.length) { body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-weight:800">لا توجد إشعارات حالياً</div>'; return; }
    body.innerHTML = this.notifs.map((n: any, i: number) => `
      <div class="notif-item${n.read ? '' : ' unread'}" data-notif-index="${i}" role="button" tabindex="0">
        <div class="notif-icon ${n.icon}" aria-hidden="true">${n.emoji}</div>
        <div class="notif-body">
          <div class="notif-title">${this.esc(n.title)}</div>
          <div class="notif-sub">${this.esc(n.sub)}</div>
          <div class="notif-time">${this.esc(n.time)}</div>
        </div>
      </div>
    `).join('');
    body.querySelectorAll<HTMLElement>('[data-notif-index]').forEach(item => {
      const mark = () => this.markNotifRead(Number(item.dataset['notifIndex']));
      item.addEventListener('click', mark);
      item.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          mark();
        }
      });
    });
  }

  markNotifRead(i: number) { this.state.markNotifRead(i); this.renderNotifPanel(); this.updateNotifBadge(); }
  markAllRead() { this.state.markAllNotifsRead(); this.renderNotifPanel(); this.updateNotifBadge(); this.toast('تم تعليم جميع الإشعارات كمقروءة'); }

  /* â•â• MESSAGES â•â• */
  updateMsgBadge() { const b = this.$('msgBadge'); if (b) { b.textContent = '0'; b.classList.add('hidden'); } }
  renderMessagesPanel() {
    const body = this.$('messagesBody');
    if (!body) return;
    body.innerHTML = `
      <div style="text-align:center;padding:36px 16px;color:var(--muted)">
        <div style="font-size:44px;margin-bottom:12px" aria-hidden="true">💬</div>
        <p style="font-size:14px;font-weight:900;color:var(--text-2)">مرحباً، ${this.esc(this.user?.fullName || 'مستخدم')}!</p>
        <p style="font-size:12.5px;margin-top:6px">ستظهر هنا المحادثات مع البياعة والشراية.</p>
        <p style="font-size:11.5px;margin-top:10px;color:var(--green);font-weight:800">حالياً التواصل المباشر عبر واتساب هو الأسرع.</p>
      </div>`;
  }

  /* â•â• ANIMALS RENDER â•â• */
  renderAnimals(list: AnimalAd[]) {
    const grid = this.adsGridRef?.nativeElement;
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<div class="empty-box" role="status">لا توجد إعلانات تطابق البحث. جرّب ولاية أو كلمة أخرى.</div>';
      if (this.paginationRef) this.paginationRef.nativeElement.innerHTML = '';
      return;
    }
    const totalPages = Math.ceil(list.length / this.PAGE_SIZE);
    if (this.currentPage > totalPages) this.currentPage = 1;
    const paginated = list.slice((this.currentPage - 1) * this.PAGE_SIZE, this.currentPage * this.PAGE_SIZE);
    grid.innerHTML = paginated.map((a: any) => {
      const liked = this.state.isFav(a.id) ? ' liked' : '';
      const chips = [a.weight, a.gender, a.age, a.healthStatus].filter(Boolean).map((x: string) => `<div class="ad-chip">${this.esc(x)}</div>`).join('');
      const imgHtml = a.imageUrl ? `<img data-card-img src="${this.esc(a.imageUrl)}" alt="${this.esc(a.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">` : '';
      return `
        <article class="ad-card" data-id="${Number(a.id)}" tabindex="0" role="article" aria-label="${this.esc(a.name)} - ${this.fmt(a.price)} دت">
          <div class="ad-photo">
            ${imgHtml}<span class="ad-photo-emoji" aria-hidden="true"${a.imageUrl ? ' style="display:none"' : ''}>${a.emoji || '🐑'}</span>
            <div class="card-badges">
              ${a.featured ? '<span class="card-badge badge-featured">مميز</span>' : '<span class="card-badge badge-new">جديد</span>'}
              ${a.verified ? '<span class="card-badge badge-verified">موثوق</span>' : ''}
            </div>
            <button class="heart-btn${liked}" data-action="fav" data-id="${Number(a.id)}" aria-label="${liked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}" aria-pressed="${liked ? 'true' : 'false'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
          </div>
          <div class="ad-body">
            <div class="ad-name">${this.esc(a.name)}</div>
            <div class="ad-loc"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${this.esc(a.location)}</div>
            <div class="ad-meta">${chips}</div>
            <div class="seller-row">
              <div class="seller-avt" aria-hidden="true">🌿</div>
              <div class="seller-name">${this.esc(a.sellerName || 'بائع موثوق')}</div>
              ${a.verified ? '<span class="verified-tag">موثوق</span>' : ''}
              <div class="seller-rating">تقييم ${a.sellerRating || 4.8}</div>
            </div>
            <div class="ad-bottom">
              <div class="ad-price">${this.fmt(a.price)} <span>دت</span></div>
              <div class="card-actions">
                <button class="details-btn" data-action="detail" data-id="${Number(a.id)}">تفاصيل</button>
                <button class="whatsapp-btn" data-action="wa" data-id="${Number(a.id)}">واتساب</button>
              </div>
            </div>
          </div>
        </article>`;
    }).join('');
    (grid as HTMLElement).querySelectorAll('[data-card-img]').forEach((node: Element) => {
      const img = node as HTMLImageElement;
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const fallback = img.nextElementSibling as HTMLElement | null;
        if (fallback) fallback.style.display = 'flex';
      }, { once: true });
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [grid] });
    this.renderPagination(totalPages, list.length);
  }

  renderPagination(total: number, totalItems: number) {
    const pg = this.paginationRef?.nativeElement;
    if (!pg) return;
    if (total <= 1) { pg.innerHTML = ''; return; }
    let html = `<span class="page-info">${totalItems} إعلان · صفحة ${this.currentPage}/${total}</span>`;
    const maxShow = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxShow / 2));
    let end = Math.min(total, start + maxShow - 1);
    if (end - start + 1 < maxShow) start = Math.max(1, end - maxShow + 1);
    if (start > 1) html += `<button class="page-btn" data-page="1">1</button>${start > 2 ? '<span style="align-self:center;color:var(--muted)">...</span>' : ''}`;
    for (let i = start; i <= end; i++) html += `<button class="page-btn${i === this.currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    if (end < total) html += `${end < total - 1 ? '<span style="align-self:center;color:var(--muted)">...</span>' : ''}<button class="page-btn" data-page="${total}">${total}</button>`;
    pg.innerHTML = html;
  }

  private handleGridClick(e: Event) {
    this.zone.run(() => {
      const target = e.target as HTMLElement;
      const card = target.closest('.ad-card') as HTMLElement;
      const actionBtn = target.closest('[data-action]') as HTMLElement;
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = Number(actionBtn.dataset.id);
        if (action === 'detail') { e.preventDefault(); this.goAnimalDetail(id); }
        else if (action === 'wa') { e.stopPropagation(); this.openWa(id); }
        else if (action === 'fav') { e.stopPropagation(); this.toggleFav(e, id); }
        return;
      }
      if (card) {
        const id = Number(card.dataset.id);
        if (id) this.goAnimalDetail(id);
      }
    });
  }

  private handlePaginationClick(e: Event) {
    const btn = (e.target as HTMLElement).closest('.page-btn') as HTMLElement;
    if (btn && btn.dataset.page) {
      this.gotoPage(Number(btn.dataset.page));
    }
  }

  updateSidebarStats() {
    const total = this.animals.length;
    const totalPrice = this.animals.reduce((s, a) => s + a.price, 0);
    const avg = total > 0 ? Math.round(totalPrice / total) : 0;
    const verified = this.animals.filter(a => a.verified).length;
    this.setText('sideCount', String(total || '-'));
    this.setText('sideAvg', avg ? this.fmt(avg) : '-');
    this.setText('sideVerified', String(verified || '-'));
    const rc = this.$('resultCount');
    if (rc) rc.textContent = String(total);
  }

  applyFilter() {
    this.currentPage = 1;
    const q = this.sv('searchInput').toLowerCase();
    const activePill = document.querySelector('.pill.active');
    const filter = (activePill as HTMLElement)?.dataset?.filter || 'all';
    const sort = (this.$('sortSelect') as HTMLSelectElement)?.value || 'newest';
    let list = [...this.animals];
    if (filter !== 'all' && filter !== 'featured') list = list.filter(a => (a.category || '').includes(filter));
    if (filter === 'featured') list = list.filter(a => a.featured);
    if (q) list = list.filter(a => (a.name + ' ' + a.category + ' ' + a.location + ' ' + (a.sellerName || '')).toLowerCase().includes(q));
    if (sort === 'cheap') list.sort((a, b) => a.price - b.price);
    if (sort === 'expensive') list.sort((a, b) => b.price - a.price);
    this.renderAnimals(list);
    this.updateSidebarStats();
  }

  debouncedFilter() { if (this.filterTimer) clearTimeout(this.filterTimer); this.filterTimer = setTimeout(() => this.applyFilter(), 300); }

  filterByCategory(cat: string) {
    document.querySelectorAll('.pill').forEach(p => (p as HTMLElement).classList.toggle('active', (p as HTMLElement).dataset.filter === cat));
    this.applyFilter();
  }

  gotoPage(n: number) { this.currentPage = n; this.applyFilter(); document.getElementById('market')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  goAnimalDetail(id: number) {
    window.scrollTo(0, 0);
void this.router.navigate(['/animals', id]);
  }

  /* â•â• FAVS â•â• */
  toggleFav(event: Event, id: number) {
    event.stopPropagation();
    if (!this.user) { this.openAuthModal('login'); this.toast('سجّل الدخول لحفظ المفضلة', 'error'); return; }
    const liked = this.state.toggleFav(id);
    this.toast(liked ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
  }

  /* â•â• DETAILS MODAL â•â• */
  openDetails(id: number) {
    const a = this.animals.find(x => x.id === id);
    if (!a) return;
    this.selectedAd = a;
    this.setText('modalTitle', a.name);
    this.setHtml('modalImgWrap', `<span aria-hidden="true" style="font-size:68px">${a.emoji || '🐑'}</span>`);
    this.setHtml('modalLocation', `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${this.esc(a.location)}`);
    this.setText('modalDescription', a.description || '');
    this.setText('modalPrice', this.fmt(a.price) + ' دت');
    this.setHtml('modalMeta', [a.weight, a.gender, a.age, a.healthStatus].filter(Boolean).map((x: string) => `<div class="ad-chip">${this.esc(x)}</div>`).join(''));
    this.$( 'detailsModal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [this.$('detailsModal')] });
  }

  openWa(id: number) {
    const a = this.animals.find(x => x.id === id);
    if (!a) { this.toast('الإعلان غير موجود', 'error'); return; }
    let phone = String(a.phone || '').replace(/\D/g, '');
    if (!phone) { this.toast('رقم الهاتف غير متوفر لهذا الإعلان', 'error'); return; }
    if (phone.length === 8) phone = '216' + phone;
    if (!/^\d{11,12}$/.test(phone)) { this.toast('رقم الهاتف غير صحيح', 'error'); return; }
    const name = a.name.replace(/[^\u0600-\u06FFa-zA-Z0-9 ]/g, '').substring(0, 50);
    const msg = encodeURIComponent(`مرحبا، نحب نسأل على ${name} بسعر ${this.fmt(a.price)} دت في ${a.location}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  /* â•â• ADD ANNONCE â•â• */
  selectCat(el: HTMLElement) {
    document.querySelectorAll('#addCatGrid .cat-btn').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
    el.classList.add('selected'); el.setAttribute('aria-checked', 'true');
    this.addCategory = el.dataset['cat'] || 'أغنام';
  }

  previewPhotos(input: any) {
    const wrap = this.$('photoPreviews');
    if (!wrap) return;
    this.uploadedPhotos = [];
    wrap.innerHTML = '';
    Array.from(input?.files || []).slice(0, 5).forEach((f: any) => {
      if (f.size > 2 * 1024 * 1024) { this.toast('حجم الصورة يجب أن يكون أقل من 2MB', 'error'); return; }
      if (!['image/jpeg','image/png','image/webp'].includes(f.type)) { this.toast('نوع الملف غير مدعوم', 'error'); return; }
      this.uploadedPhotos.push(f);
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url; img.className = 'photo-preview'; img.alt = 'معاينة صورة الإعلان';
      img.onload = () => URL.revokeObjectURL(url);
      wrap.appendChild(img);
    });
  }

  submitAnnonce() {
    if (!this.user) { this.openAuthModal('login'); this.toast('سجّل الدخول أولاً', 'error'); return; }
    const title = this.sv('addTitle'), price = this.sv('addPrice'), wilaya = this.sv('addWilaya'), phone = this.sv('addPhone');
    if (!title || title.length < 3) { (this.$('addTitle') as HTMLElement)?.classList.add('err'); this.toast('أضف عنواناً واضحاً للإعلان (3 أحرف على الأقل)', 'error'); return; }
    if (!price || +price <= 0 || +price > 999999) { (this.$('addPrice') as HTMLElement)?.classList.add('err'); this.toast('أضف سعراً صحيحاً أكبر من صفر', 'error'); return; }
    if (!wilaya) { (this.$('addWilaya') as HTMLElement)?.classList.add('err'); this.toast('اختر الولاية', 'error'); return; }
    if (!phone || phone.replace(/\D/g, '').length < 8) { (this.$('addPhone') as HTMLElement)?.classList.add('err'); this.toast('أضف رقم هاتف صحيح', 'error'); return; }

    const btn = this.$('submitAnnonceBtn') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'جاري النشر...'; }

    setTimeout(async () => {
      let imageUrl = '';
      if (this.uploadedPhotos.length > 0) {
        imageUrl = await this.fileToDataUrl(this.uploadedPhotos[0]);
      }
      const newAd: AnimalAd = {
        id: Date.now(),
        name: this.esc(title.substring(0, 100)),
        category: this.addCategory,
        price: Math.min(+price, 999999),
        location: wilaya,
        weight: this.esc(this.sv('addWeight').substring(0, 30)),
        gender: this.sv('addGender'),
        age: 'جديد',
        healthStatus: '',
        emoji: this.state.getCatEmoji(this.addCategory),
        sellerName: this.esc(this.user!.fullName.substring(0, 50)),
        sellerRating: 5.0,
        featured: false,
        verified: true,
        phone: phone.replace(/\D/g, '').substring(0, 15),
        description: this.esc(this.sv('addDesc').substring(0, 1000)),
        imageUrl,
      };
      this.state.addAnimal(newAd);
      this.currentPage = 1;
      this.applyFilter();
      (this.$('addForm') as HTMLElement).style.display = 'none';
      (this.$('addSuccess') as HTMLElement).style.display = 'block';
      (this.$('addFooter') as HTMLElement).style.display = 'none';
      if (btn) { btn.disabled = false; btn.textContent = 'نشر إعلان موثوق'; }
      this.toast('تم نشر إعلانك بنجاح');
    }, 900);
  }

  resetAddForm() {
    (this.$('addForm') as HTMLElement).style.display = 'block';
    (this.$('addSuccess') as HTMLElement).style.display = 'none';
    (this.$('addFooter') as HTMLElement).style.display = 'block';
    ['addTitle','addPrice','addWeight','addDesc','addPhone'].forEach(id => { const el = this.$(id) as HTMLInputElement; if (el) { el.value = ''; el.classList.remove('err'); }});
    (this.$('addWilaya') as HTMLSelectElement).value = '';
    (this.$('addGender') as HTMLSelectElement).value = '';
    this.uploadedPhotos = [];
    this.$('photoPreviews')!.innerHTML = '';
    document.querySelectorAll('#addCatGrid .cat-btn').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked','false'); });
    const first = document.querySelector('#addCatGrid .cat-btn') as HTMLElement;
    if (first) { first.classList.add('selected'); first.setAttribute('aria-checked','true'); }
    this.addCategory = 'أغنام';
  }

  /* â•â• REGISTRATION â•â• */
  goRegStep(n: number) {
    if (n > this.currentRegStep && !this.validateRegStep(this.currentRegStep)) return;
    this.currentRegStep = n;
    document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
    this.$( 'regStep' + n)?.classList.add('active');
    for (let i = 1; i <= 3; i++) {
      const si = this.$('si' + i);
      if (!si) continue;
      si.classList.remove('active','done');
      const dot = si.querySelector('.step-dot');
      if (i < n) si.classList.add('done');
      if (i === n) si.classList.add('active');
    }
  }

  validateRegStep(step: number): boolean {
    this.clearErrors();
    let ok = true;
    if (step === 1) {
      if (this.sv('regFirst').length < 2) { this.showErr('regFirst','regFirstErr'); ok = false; }
      if (this.sv('regLast').length < 2) { this.showErr('regLast','regLastErr'); ok = false; }
      if (!this.sv('regEmail').match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { this.showErr('regEmail','regEmailErr'); ok = false; }
      if (this.sv('regPhone').replace(/\D/g, '').length < 8) { this.showErr('regPhone','regPhoneErr'); ok = false; }
    }
    if (step === 2) {
      if (this.sv('regPassword').length < 8) { this.showErr('regPassword','regPasswordErr'); ok = false; }
      if (this.sv('regPassword') !== this.sv('regConfirm')) { this.showErr('regConfirm','regConfirmErr'); ok = false; }
    }
    return ok;
  }

  selectRegCat(el: HTMLElement) {
    document.querySelectorAll('.reg-cat').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked','false'); });
    el.classList.add('selected'); el.setAttribute('aria-checked','true');
    this.regCategory = el.dataset['cat'] || 'تربية الحيوانات';
  }

  checkPwStrength(pw: string) {
    const bar = this.$('pwBar'), lbl = this.$('pwLabel');
    if (!bar) return;
    bar.className = 'pw-strength-bar';
    if (!pw.length) { (bar as HTMLElement).style.width = '0'; if (lbl) lbl.textContent = ''; return; }
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Za-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    bar.classList.add(s <= 1 ? 'weak' : s <= 2 ? 'medium' : 'strong');
    if (lbl) { lbl.textContent = s <= 1 ? 'ضعيفة' : s <= 2 ? 'متوسطة' : 'قوية'; lbl.style.color = s <= 1 ? '#e74c3c' : s <= 2 ? 'var(--gold)' : 'var(--green)'; }
  }

  async doRegister() {
    if (!this.validateRegStep(1) || !this.validateRegStep(2)) return;
    if (this.registerSubmitting) return;
    this.registerSubmitting = true;

    const btn = document.querySelector('#regStep3 .submit-btn') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'جاري إنشاء الحساب...'; }

    const rawPassword = this.sv('regPassword');
    const payload = {
      firstName: this.sv('regFirst').substring(0, 50),
      lastName: this.sv('regLast').substring(0, 50),
      email: this.sv('regEmail').substring(0, 100),
      phone: this.normalizeTnMobile(this.sv('regPhone')),
      fullName: (this.sv('regFirst') + ' ' + this.sv('regLast')).trim(),
    };

    try {
      const res = await fetch(`${this.API_BASE}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, password: rawPassword })
      });
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        /* empty body */
      }
      if (res.ok && typeof data['token'] === 'string') {
        this.state.setToken(data['token']);
        if (btn) { btn.disabled = false; btn.textContent = 'إنشاء الحساب'; }
        this.finalizeLogin({
          fullName: (data['fullName'] as string) || payload.fullName,
          email: payload.email,
          avatar: '🌿',
          role: (data['role'] as string) || 'CLIENT'
        }, true, false);
      } else {
        if (btn) { btn.disabled = false; btn.textContent = 'إنشاء الحساب'; }
        const err = typeof data['error'] === 'string' ? data['error'] : '';
        let msg = err || 'فشل إنشاء الحساب';
        if (err.includes('Email')) msg = 'البريد الإلكتروني مستخدم مسبقاً';
        else if (err.includes('Telephone')) msg = 'رقم الهاتف مستخدم مسبقاً';
        this.toast(msg, 'error');
      }
    } catch {
      if (btn) { btn.disabled = false; btn.textContent = 'إنشاء الحساب'; }
      this.toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      this.registerSubmitting = false;
    }
  }

  doForgot() {
    if (!this.sv('forgotInput')) { this.toast('يرجى إدخال البريد أو الهاتف', 'error'); return; }
    this.toast('تم إرسال رابط الاستعادة على بريدك');
    setTimeout(() => this.switchAuthTab('login'), 2000);
  }

  /* â•â• MISC â•â• */
  showComingSoon(feature: string) {
    this.toast(`${feature} قريباً في AMANAFARM`, 'info');
  }

  goPost() {
    if (!this.user) { this.openAuthModal('login'); this.toast('سجّل الدخول لإضافة إعلان', 'error'); return; }
    this.openPanel('add');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event) {
    const ua = this.$('userAction');
    if (ua && !ua.contains(event.target as Node)) this.closeDropdown();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeModal('detailsModal');
      this.closeModal('authOverlay');
      this.closePanel();
      this.closeDropdown();
    }
  }
}

