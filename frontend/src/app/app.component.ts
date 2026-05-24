import { Component, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy, HostListener, effect } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { StateService, UserInfo } from './services/state.service';
import { environment } from '../environments/environment';

declare const lucide: any;
declare const google: any;
declare const FB: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('toastWrap') toastWrapRef!: ElementRef<HTMLElement>;
  @ViewChild('userDropdown') userDropdownRef!: ElementRef<HTMLElement>;

  user: UserInfo | null = null;
  dropOpen = false;
  currentAuthTab = 'login';
  currentRegStep = 1;
  darkMode = false;
  isScrolled = false;
  showBackTop = false;
  navHidden = false;
  routeTransition = false;
  canPublishPrimary = false;
  showPublishChooser = false;
  publishLabel = 'نشر إعلان';
  regCategory = 'تربية الحيوانات';
  loginAttempts = { count: 0, blockedUntil: 0 };
  siteStats = {
    publishedAds: 0,
    siteVisits: 0,
    registeredUsers: 0,
  };

  private lastScrollY = 0;
  private viewReady = false;
  private registerSubmitting = false;
  private routerIconSub?: Subscription;
  private readonly API_BASE = environment.apiBaseUrl;
  private googleScriptPromise?: Promise<void>;
  private facebookScriptPromise?: Promise<void>;
  private googleInitialized = false;
  private facebookInitialized = false;

  constructor(public state: StateService, private router: Router) {
    effect(() => {
      this.user = state.user();
      this.updatePublishCtaState();
      if (this.viewReady) setTimeout(() => this.syncPublishHeaderDom());
      if (this.viewReady) setTimeout(() => this.applyAuthState());
    });
  }

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('amanafarm-theme') === 'dark';
    document.documentElement.classList.toggle('theme-dark', this.darkMode);
    this.onWindowScroll();
    void this.loadSiteStats();
    this.routerIconSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.routeTransition = false;
        window.scrollTo({ top: 0, behavior: 'auto' });
        setTimeout(() => this.refreshIcons(), 40);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.viewReady = true;
      this.refreshIcons();
      this.applyAuthState();
      this.applySocialLoginState();
      this.bindSocialLoginButtons();
      this.bindRegisterCategoryButtons();
      this.bindPublishHeaderButton();
      this.bindAppShellControls();
      this.updatePublishCtaState();
      this.syncPublishHeaderDom();
      this.renderAuthBrandStats();
    });
  }

  ngOnDestroy(): void {
    this.routerIconSub?.unsubscribe();
  }

  private refreshIcons(): void {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    this.isScrolled = y > 80;
    this.showBackTop = y > 520;
    this.navHidden = y > 180 && y > this.lastScrollY + 6;
    this.lastScrollY = Math.max(0, y);
  }

  @HostListener('window:amanafarm-login-required', ['$event'])
  onLoginRequired(event?: CustomEvent<{ action?: string }>): void {
    if (this.user) return;
    const action = event?.detail?.action;
    if (action) sessionStorage.setItem('amanafarm-pending-action', action);
    this.openAuthModal('login');
    this.toast('سجّل الدخول باش تنجم تضيف في AMANAFARM', 'error');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event): void {
    const ua = this.$('userAction');
    if (ua && !ua.contains(event.target as Node)) this.closeDropdown();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closePublishChooser();
      this.closeModal('authOverlay');
      this.closeDropdown();
    }
  }

  $(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  sv(id: string): string {
    return (document.getElementById(id) as HTMLInputElement | null)?.value?.trim() || '';
  }

  esc(s: unknown): string {
    return this.state.esc(s);
  }

  scrollTo(id: string): void {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  applyFilter(): void {
    const q = this.sv('searchInput');
    void this.router.navigate(['/animals'], q ? { queryParams: { q } } : undefined);
  }

  private canPublishPrimaryComputed(): boolean {
    return this.state.canPublish('animal') || this.state.canPublish('product') || this.state.canPublish('service');
  }

  private publishLabelComputed(): string {
    const role = String(this.user?.role || '').toLowerCase();
    if (role.includes('service')) return 'إضافة خدمة';
    if (role.includes('seller')) return 'إضافة منتج';
    return 'نشر إعلان';
  }

  private updatePublishCtaState(): void {
    this.canPublishPrimary = this.canPublishPrimaryComputed();
    const role = String(this.user?.role || '').toLowerCase();
    if (role.includes('service')) this.publishLabel = 'إضافة خدمة';
    else if (role.includes('seller')) this.publishLabel = 'إضافة منتج';
    else this.publishLabel = 'نشر إعلان';
  }

  private syncPublishHeaderDom(): void {
    this.updatePublishCtaState();
    this.setHidden('publishHeaderBtn', !!this.user && !this.canPublishPrimary);
    this.setText('publishHeaderLabel', this.publishLabel);
  }

  goPublish(): void {
    if (!this.user) {
      sessionStorage.setItem('amanafarm-pending-action', 'publish');
      this.openAuthModal('login');
      this.toast('سجّل الدخول باش تنجم تنشر إعلان', 'error');
      return;
    }

    const role = String(this.user?.role || '').toLowerCase();
    if (role.includes('service')) {
      void this.router.navigate(['/services']);
      return;
    }

    const canPublishAnimal = this.state.canPublish('animal');
    const canPublishProduct = this.state.canPublish('product');
    if (canPublishAnimal && canPublishProduct) {
      this.showPublishChooser = true;
      setTimeout(() => this.refreshIcons());
      return;
    }
    if (canPublishProduct) {
      this.openPublishTarget('product');
      return;
    }
    if (canPublishAnimal) {
      this.openPublishTarget('animal');
      return;
    }
    this.showPublishChooser = true;
    setTimeout(() => this.refreshIcons());
  }

  closePublishChooser(): void {
    this.showPublishChooser = false;
  }

  openPublishTarget(kind: 'animal' | 'product'): void {
    this.showPublishChooser = false;
    const route = kind === 'product' ? '/products' : '/animals';
    void this.router.navigate([route], {
      queryParams: { publish: kind, open: Date.now() },
    });
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('theme-dark', this.darkMode);
    localStorage.setItem('amanafarm-theme', this.darkMode ? 'dark' : 'light');
    setTimeout(() => this.refreshIcons());
  }

  applyAuthState(): void {
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
    } else {
      this.setText('userName', '—');
      this.setText('userInitial', 'م');
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

  private setText(id: string, text: string): void {
    const el = this.$(id);
    if (el) el.textContent = text;
  }

  private renderAuthBrandStats(): void {
    this.setText('authPublishedAdsStat', this.formatStat(this.siteStats.publishedAds));
    this.setText('authSiteVisitsStat', this.formatStat(this.siteStats.siteVisits));
    this.setText('authRegisteredUsersStat', this.formatStat(this.siteStats.registeredUsers));
  }

  private applySocialLoginState(): void {
    const googleEnabled = !!(environment as any).googleClientId;
    const facebookEnabled = !!(environment as any).facebookAppId;
    const hasSocial = googleEnabled || facebookEnabled;

    this.setHidden('socialLoginBtns', !hasSocial);
    this.setHidden('socialLoginDivider', !hasSocial);
    this.setHidden('googleLoginBtn', !googleEnabled);
    this.setHidden('facebookLoginBtn', !facebookEnabled);
  }

  private bindSocialLoginButtons(): void {
    const googleBtn = this.$('googleLoginBtn');
    const facebookBtn = this.$('facebookLoginBtn');

    googleBtn?.addEventListener('click', () => void this.loginWithGoogle(), { passive: true });
    facebookBtn?.addEventListener('click', () => void this.loginWithFacebook(), { passive: true });
  }

  private bindRegisterCategoryButtons(): void {
    const bind = (id: string, category: string) => {
      this.$(id)?.addEventListener('click', () => this.selectRegCat(category), { passive: true });
    };

    bind('regCatAnimals', 'تربية الحيوانات');
    bind('regCatProducts', 'منتجات فلاحية');
    bind('regCatServices', 'نقل وخدمات');
  }

  private bindPublishHeaderButton(): void {
    this.$('publishHeaderBtn')?.addEventListener('click', () => this.goPublish(), { passive: true });
  }

  private bindAppShellControls(): void {
    this.$('searchInput')?.addEventListener('keydown', event => {
      if ((event as KeyboardEvent).key === 'Enter') this.applyFilter();
    });
    this.$('searchBtn')?.addEventListener('click', () => this.applyFilter(), { passive: true });
    this.$('btnLoginHeader')?.addEventListener('click', () => this.openAuthModal('login'), { passive: true });
    this.$('userAction')?.addEventListener('click', event => this.toggleDropdown(event));
    this.$('logoutBtn')?.addEventListener('click', () => this.doLogout(), { passive: true });
    this.$('mobProfile')?.addEventListener('click', event => {
      if (!this.user) this.openAuthModal('login');
      else this.toggleDropdown(event);
    });
    this.$('closeAuthBtn')?.addEventListener('click', () => this.closeModal('authOverlay'), { passive: true });
    this.$('tabLogin')?.addEventListener('click', () => this.switchAuthTab('login'), { passive: true });
    this.$('tabRegister')?.addEventListener('click', () => this.switchAuthTab('register'), { passive: true });
    this.$('forgotLink')?.addEventListener('click', () => this.switchAuthTab('forgot'), { passive: true });
    this.$('loginBtn')?.addEventListener('click', () => void this.doLogin(), { passive: true });
    this.$('regNextStep1Btn')?.addEventListener('click', () => this.goRegStep(2), { passive: true });
    this.$('regBackStep2Btn')?.addEventListener('click', () => this.goRegStep(1), { passive: true });
    this.$('regNextStep2Btn')?.addEventListener('click', () => this.goRegStep(3), { passive: true });
    this.$('regBackStep3Btn')?.addEventListener('click', () => this.goRegStep(2), { passive: true });
    this.$('registerSubmitBtn')?.addEventListener('click', () => void this.doRegister(), { passive: true });
    this.$('successCloseBtn')?.addEventListener('click', () => this.closeModal('authOverlay'), { passive: true });
    this.$('forgotSubmitBtn')?.addEventListener('click', () => this.doForgot(), { passive: true });
    this.$('forgotBackLoginLink')?.addEventListener('click', () => this.switchAuthTab('login'), { passive: true });
    this.$('regPassword')?.addEventListener('input', event => this.checkPwStrengthInput(event));
    document.querySelectorAll<HTMLElement>('.social-coming').forEach(button => {
      button.addEventListener('click', () => this.showComingSoon(button.dataset['social'] || 'Social'), { passive: true });
    });
  }

  private setHidden(id: string, hidden: boolean): void {
    const el = this.$(id);
    if (el) el.hidden = hidden;
  }

  toast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const wrap = this.toastWrapRef?.nativeElement;
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' error' : type === 'info' ? ' info' : ''}`;
    el.setAttribute('role', 'status');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('fadeout');
      setTimeout(() => el.remove(), 260);
    }, 2400);
  }

  openAuthModal(tab = 'login'): void {
    this.$('authOverlay')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.switchAuthTab(tab);
  }

  closeModal(id: string): void {
    this.$(id)?.classList.remove('show');
    document.body.style.overflow = '';
  }

  switchAuthTab(tab: string): void {
    const id = 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1);
    ['panelLogin', 'panelRegister', 'panelSuccess', 'panelForgot'].forEach(p => this.$(p)?.classList.remove('active'));
    ['tabLogin', 'tabRegister'].forEach(t => {
      this.$(t)?.classList.remove('active');
      this.$(t)?.setAttribute('aria-selected', 'false');
    });
    this.$(id)?.classList.add('active');
    if (tab === 'login') {
      this.$('tabLogin')?.classList.add('active');
      this.$('tabLogin')?.setAttribute('aria-selected', 'true');
    }
    if (tab === 'register') {
      this.$('tabRegister')?.classList.add('active');
      this.$('tabRegister')?.setAttribute('aria-selected', 'true');
    }
    this.currentAuthTab = tab;
  }

  clearErrors(): void {
    document.querySelectorAll('.input-err').forEach(e => e.classList.remove('input-err'));
    document.querySelectorAll('.err-msg.show').forEach(e => e.classList.remove('show'));
  }

  showErr(inputId: string, errId: string): void {
    this.$(inputId)?.classList.add('input-err');
    this.$(errId)?.classList.add('show');
  }

  isRateLimited(): boolean {
    return Date.now() < this.loginAttempts.blockedUntil;
  }

  private registerAttempt(): boolean {
    this.loginAttempts.count++;
    if (this.loginAttempts.count < 5) return false;
    this.loginAttempts.blockedUntil = Date.now() + 60000;
    this.loginAttempts.count = 0;
    return true;
  }

  private normalizeTnMobile(raw: string): string {
    let d = raw.replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    while (d.startsWith('0')) d = d.slice(1);
    return d.startsWith('216') ? d : `216${d}`;
  }

  async doLogin(): Promise<void> {
    if (this.isRateLimited()) {
      this.$('loginRateNotice')?.classList.add('show');
      const remain = Math.ceil((this.loginAttempts.blockedUntil - Date.now()) / 1000);
      this.toast(`انتظر ${remain} ثانية قبل المحاولة من جديد`, 'error');
      return;
    }

    this.$('loginRateNotice')?.classList.remove('show');
    this.clearErrors();
    const emailVal = this.sv('loginEmail');
    const pwVal = this.sv('loginPassword');
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    const isPhone = emailVal.replace(/\D/g, '').length >= 8;
    let ok = true;

    if (!isEmail && !isPhone) {
      this.showErr('loginEmail', 'loginEmailErr');
      ok = false;
    }
    if (pwVal.length < 3) {
      this.showErr('loginPassword', 'loginPasswordErr');
      ok = false;
    }
    if (!ok) return;

    const btn = this.$('loginBtn') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جاري التحقق...';
    }

    try {
      const loginIdentifier = isEmail ? emailVal.trim() : this.normalizeTnMobile(emailVal);
      const res = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginIdentifier, password: pwVal }),
      });
      const data = await this.safeJson(res);

      if (res.ok && typeof data['token'] === 'string') {
        this.state.setToken(data['token']);
        this.finalizeLogin({
          fullName: (data['fullName'] as string) || (data['email'] as string),
          email: data['email'] as string,
          avatar: '🌿',
          role: (data['role'] as string) || 'CLIENT',
        }, false, !!(document.getElementById('rememberMe') as HTMLInputElement | null)?.checked);
        return;
      }

      if (this.registerAttempt()) this.$('loginRateNotice')?.classList.add('show');
      this.toast(typeof data['error'] === 'string' ? data['error'] : 'فشل تسجيل الدخول', 'error');
    } catch {
      this.toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'تسجيل الدخول';
      }
    }
  }

  async loginWithGoogle(): Promise<void> {
    const clientId = (environment as any).googleClientId || '';
    if (!clientId) {
      return;
    }

    try {
      await this.loadGoogleIdentityScript();
      if (!this.googleInitialized) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            void this.finishSocialLogin('google', response?.credential || '');
          },
        });
        this.googleInitialized = true;
      }
      google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          this.toast('Google لم يفتح نافذة الدخول. تأكد من إعدادات Client ID', 'info');
        }
      });
    } catch {
      this.toast('تعذر تحميل Google Sign-In', 'error');
    }
  }

  async loginWithFacebook(): Promise<void> {
    const appId = (environment as any).facebookAppId || '';
    if (!appId) {
      return;
    }

    try {
      await this.loadFacebookSdk(appId);
      FB.login((response: any) => {
        const token = response?.authResponse?.accessToken || '';
        if (!token) {
          this.toast('لم يتم تسجيل الدخول عبر Facebook', 'info');
          return;
        }
        void this.finishSocialLogin('facebook', token);
      }, { scope: 'email,public_profile' });
    } catch {
      this.toast('تعذر تحميل Facebook Login', 'error');
    }
  }

  private async finishSocialLogin(provider: 'google' | 'facebook', token: string): Promise<void> {
    if (!token) {
      this.toast('Token غير صالح', 'error');
      return;
    }

    try {
      const res = await fetch(`${this.API_BASE}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token }),
      });
      const data = await this.safeJson(res);

      if (res.ok && typeof data['token'] === 'string') {
        this.state.setToken(data['token']);
        this.finalizeLogin({
          fullName: (data['fullName'] as string) || (data['email'] as string),
          email: data['email'] as string,
          avatar: (data['avatar'] as string) || (data['profilePhoto'] as string) || (provider === 'google' ? 'G' : 'f'),
          role: (data['role'] as string) || 'CLIENT',
        }, false, true);
        return;
      }

      this.toast(typeof data['error'] === 'string' ? data['error'] : 'فشل تسجيل الدخول الاجتماعي', 'error');
    } catch {
      this.toast('تعذر الاتصال بالخادم', 'error');
    }
  }

  private loadGoogleIdentityScript(): Promise<void> {
    if (typeof google !== 'undefined' && google?.accounts?.id) return Promise.resolve();
    if (this.googleScriptPromise) return this.googleScriptPromise;

    this.googleScriptPromise = this.loadScript('https://accounts.google.com/gsi/client', 'google-identity-script');
    return this.googleScriptPromise;
  }

  private loadFacebookSdk(appId: string): Promise<void> {
    if (typeof FB !== 'undefined' && this.facebookInitialized) return Promise.resolve();
    if (!this.facebookScriptPromise) {
      this.facebookScriptPromise = this.loadScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk');
    }

    return this.facebookScriptPromise.then(() => {
      if (!this.facebookInitialized) {
        FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version: 'v19.0',
        });
        this.facebookInitialized = true;
      }
    });
  }

  private loadScript(src: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        if ((existing as any).dataset['loaded'] === 'true') resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  finalizeLogin(u: UserInfo, isNew: boolean, remember: boolean): void {
    this.state.setUser(u, remember);
    this.applyAuthState();
    this.setText('successTitle', isNew ? `أهلاً وسهلاً، ${this.esc(u.fullName || u.email)}` : `مرحباً من جديد، ${this.esc(u.fullName || u.email)}!`);
    this.setText('successSub', isNew ? 'تم إنشاء حسابك بنجاح.' : 'تم تسجيل دخولك بنجاح.');
    this.switchAuthTab('success');
    this.toast(isNew ? 'تم إنشاء الحساب بنجاح' : 'أهلاً بك من جديد');

    const pendingAction = sessionStorage.getItem('amanafarm-pending-action') || '';
    if (pendingAction) this.closeModal('authOverlay');
    window.dispatchEvent(new CustomEvent('amanafarm-authenticated', { detail: { action: pendingAction } }));
    this.refreshIcons();
  }

  doLogout(): void {
    this.state.logout();
    this.applyAuthState();
    this.closeDropdown();
    this.toast('تم تسجيل الخروج بنجاح');
    this.refreshIcons();
  }

  toggleDropdown(event: Event): void {
    if (!this.user) {
      this.openAuthModal('login');
      return;
    }
    event.stopPropagation();
    this.dropOpen = !this.dropOpen;
    this.userDropdownRef?.nativeElement.classList.toggle('show', this.dropOpen);
    this.$('userAction')?.setAttribute('aria-expanded', String(this.dropOpen));
  }

  closeDropdown(): void {
    this.dropOpen = false;
    this.userDropdownRef?.nativeElement.classList.remove('show');
    this.$('userAction')?.setAttribute('aria-expanded', 'false');
  }

  goRegStep(n: number): void {
    if (n > this.currentRegStep && !this.validateRegStep(this.currentRegStep)) return;
    this.currentRegStep = n;
    document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
    this.$(`regStep${n}`)?.classList.add('active');

    for (let i = 1; i <= 3; i++) {
      const si = this.$(`si${i}`);
      if (!si) continue;
      si.classList.remove('active', 'done');
      if (i < n) si.classList.add('done');
      if (i === n) si.classList.add('active');
    }
  }

  validateRegStep(step: number): boolean {
    this.clearErrors();
    let ok = true;
    if (step === 1) {
      if (this.sv('regFirst').length < 2) { this.showErr('regFirst', 'regFirstErr'); ok = false; }
      if (this.sv('regLast').length < 2) { this.showErr('regLast', 'regLastErr'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.sv('regEmail'))) { this.showErr('regEmail', 'regEmailErr'); ok = false; }
      if (this.sv('regPhone').replace(/\D/g, '').length < 8) { this.showErr('regPhone', 'regPhoneErr'); ok = false; }
    }
    if (step === 2) {
      if (this.sv('regPassword').length < 8) { this.showErr('regPassword', 'regPasswordErr'); ok = false; }
      if (this.sv('regPassword') !== this.sv('regConfirm')) { this.showErr('regConfirm', 'regConfirmErr'); ok = false; }
    }
    return ok;
  }

  selectRegCat(category: string): void {
    document.querySelectorAll('.reg-cat').forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-checked', 'false');
    });
    const selected = Array.from(document.querySelectorAll<HTMLElement>('.reg-cat'))
      .find(el => el.dataset['cat'] === category);
    selected?.classList.add('selected');
    selected?.setAttribute('aria-checked', 'true');
    this.regCategory = category || 'تربية الحيوانات';
  }

  checkPwStrengthInput(event: Event): void {
    this.checkPwStrength((event.target as HTMLInputElement | null)?.value || '');
  }

  checkPwStrength(pw: string): void {
    const bar = this.$('pwBar');
    const label = this.$('pwLabel');
    if (!bar) return;

    bar.className = 'pw-strength-bar';
    if (!pw.length) {
      bar.style.width = '0';
      if (label) label.textContent = '';
      return;
    }

    const score = [
      pw.length >= 8,
      /[A-Za-z]/.test(pw),
      /[0-9]/.test(pw),
      /[^A-Za-z0-9]/.test(pw),
    ].filter(Boolean).length;

    bar.classList.add(score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong');
    if (label) {
      label.textContent = score <= 1 ? 'ضعيفة' : score <= 2 ? 'متوسطة' : 'قوية';
      label.style.color = score <= 1 ? '#e74c3c' : score <= 2 ? 'var(--gold)' : 'var(--green)';
    }
  }

  async doRegister(): Promise<void> {
    if (!this.validateRegStep(1) || !this.validateRegStep(2) || this.registerSubmitting) return;
    this.registerSubmitting = true;

    const btn = document.querySelector<HTMLButtonElement>('#regStep3 .submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جاري إنشاء الحساب...';
    }

    const payload = {
      firstName: this.sv('regFirst').substring(0, 50),
      lastName: this.sv('regLast').substring(0, 50),
      email: this.sv('regEmail').substring(0, 100),
      phone: this.normalizeTnMobile(this.sv('regPhone')),
      fullName: `${this.sv('regFirst')} ${this.sv('regLast')}`.trim(),
    };

    try {
      const res = await fetch(`${this.API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, password: this.sv('regPassword') }),
      });
      const data = await this.safeJson(res);

      if (res.ok && typeof data['token'] === 'string') {
        this.state.setToken(data['token']);
        this.finalizeLogin({
          fullName: (data['fullName'] as string) || payload.fullName,
          email: payload.email,
          avatar: '🌿',
          role: (data['role'] as string) || 'CLIENT',
        }, true, false);
      } else {
        const err = typeof data['error'] === 'string' ? data['error'] : '';
        let msg = err || 'فشل إنشاء الحساب';
        if (err.includes('Email')) msg = 'البريد الإلكتروني مستخدم مسبقاً';
        else if (err.includes('Telephone')) msg = 'رقم الهاتف مستخدم مسبقاً';
        this.toast(msg, 'error');
      }
    } catch {
      this.toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      this.registerSubmitting = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'إنشاء الحساب';
      }
    }
  }

  doForgot(): void {
    if (!this.sv('forgotInput')) {
      this.toast('يرجى إدخال البريد أو الهاتف', 'error');
      return;
    }
    this.toast('تم إرسال رابط الاستعادة على بريدك');
    setTimeout(() => this.switchAuthTab('login'), 2000);
  }

  showComingSoon(feature: string): void {
    this.toast(`${feature} قريباً في AMANAFARM`, 'info');
  }

  formatStat(value: number): string {
    const n = Number(value || 0);
    if (n >= 1000000) return `+${(n / 1000000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1000) return `+${(n / 1000).toFixed(1).replace('.0', '')}K`;
    return String(n);
  }

  private async loadSiteStats(): Promise<void> {
    try {
      const res = await fetch(`${this.API_BASE}/api/stats/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorKey: this.getVisitorKey() }),
      });
      const data = await this.safeJson(res);
      if (res.ok) {
        this.applySiteStats(data);
        return;
      }
    } catch {
      this.applyLocalStatsFallback();
    }
  }

  private applySiteStats(data: Record<string, unknown>): void {
    this.siteStats = {
      publishedAds: this.toStatNumber(data['publishedAds']),
      siteVisits: this.toStatNumber(data['siteVisits']),
      registeredUsers: this.toStatNumber(data['registeredUsers']),
    };
    this.renderAuthBrandStats();
  }

  private applyLocalStatsFallback(): void {
    const localVisits = Number(localStorage.getItem('amanafarm-local-visits') || '0') + 1;
    localStorage.setItem('amanafarm-local-visits', String(localVisits));
    this.siteStats = {
      publishedAds: this.siteStats.publishedAds,
      siteVisits: localVisits,
      registeredUsers: this.user ? 1 : 0,
    };
    this.renderAuthBrandStats();
  }

  private getVisitorKey(): string {
    const storageKey = 'amanafarm-visitor-key';
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;

    const generated = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(storageKey, generated);
    return generated;
  }

  private toStatNumber(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private async safeJson(res: Response): Promise<Record<string, unknown>> {
    try {
      return await res.json() as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
