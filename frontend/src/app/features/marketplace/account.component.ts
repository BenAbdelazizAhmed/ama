import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, timeout, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { StateService } from "../../services/state.service";
import { IconComponent } from "../../shared/icon/icon.component";
import { MarketApi } from "./market-api.service";
import { FavoritesService } from "./favorites.service";
import { MARKETS, MarketKind, MarketListing } from "./market.models";
import { MarketCardComponent } from "./listing-card.component";
@Component({
  selector: "app-account",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    MarketCardComponent,
  ],
  templateUrl: "./account.component.html",
  styles: [":host{display:block}"],
})
export class AccountComponent implements OnInit, OnDestroy {
  tab = "listings";
  loading = true;
  error = "";
  notice = "";
  saving = false;
  changing = false;
  records: MarketListing[] = [];
  trips: any[] = [];
  firstName = "";
  lastName = "";
  phone = "";
  currentPassword = "";
  newPassword = "";
  confirmPassword = "";
  readonly markets = MARKETS;
  private sub?: Subscription;
  private alive = true;
  constructor(
    public state: StateService,
    public api: MarketApi,
    public favorites: FavoritesService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  get showEmail() {
    return !(this.state.user()?.email || "").endsWith("@phone.amanafarm.tn");
  }
  get mine() {
    return this.records.filter((l) => l.ownerId === this.state.user()?.id);
  }
  get saved() {
    return this.records.filter((l) => this.favorites.has(l.kind, l.id));
  }
  get myTrips() {
    return this.trips.filter((t) => t.ownerId === this.state.user()?.id);
  }
  ngOnInit() {
    this.sub = this.route.queryParamMap.subscribe((p) => {
      const tab = p.get("tab");
      this.tab = ["listings", "saved", "settings"].includes(tab || "")
        ? tab!
        : "listings";
    });
    void this.load();
  }
  select(tab: string) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      replaceUrl: true,
    });
  }
  async load() {
    this.loading = true;
    this.error = "";
    const kinds = Object.keys(MARKETS) as MarketKind[];
    try {
      const profile = await firstValueFrom(
        this.http
          .get<any>(environment.apiBaseUrl + "/api/users/me")
          .pipe(timeout(15000)),
      );
      if (!this.alive) return;
      this.firstName = profile.firstName || "";
      this.lastName = profile.lastName || "";
      this.phone = String(profile.phone || "").replace(/^216(?=\d{8}$)/, "");
      this.state.setUser({ ...this.state.user()!, ...profile });
      const results = await Promise.allSettled(
        kinds.map((k) => this.api.list(k)),
      );
      if (!this.alive) return;
      this.records = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value : [],
      );
      if (results.some((r) => r.status === "rejected"))
        this.error = "بعض الإعلانات ما تحملوش. عاود جرّب باش تشوف الكل.";
      try {
        this.trips = await firstValueFrom(
          this.http
            .get<any[]>(environment.apiBaseUrl + "/api/trips")
            .pipe(timeout(15000)),
        );
      } catch {
        this.error = "تعذّر تحميل الرحلات. تنجم تعاود المحاولة.";
      }
    } catch {
      if (this.alive)
        this.error = "تعذّر تحميل الحساب. تثبّت من الاتصال والجلسة.";
    } finally {
      if (this.alive) this.loading = false;
    }
  }
  async update(form: NgForm) {
    if (form.invalid || this.saving) {
      form.control.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.notice = "";
    try {
      const p = await firstValueFrom(
        this.http
          .put<any>(environment.apiBaseUrl + "/api/users/me", {
            firstName: this.firstName,
            lastName: this.lastName,
            phone: this.phone,
          })
          .pipe(timeout(15000)),
      );
      this.state.setUser({ ...this.state.user()!, ...p });
      this.notice = "تسجّلت معلوماتك بنجاح.";
    } catch (e: any) {
      this.notice =
        e?.status === 409
          ? "رقم الهاتف مستخدم في حساب آخر."
          : "ما تبدّلتش المعلومات. عاود جرّب.";
    } finally {
      this.saving = false;
    }
  }
  async password(form: NgForm) {
    if (form.invalid || this.changing) return;
    if (this.newPassword !== this.confirmPassword) {
      this.notice = "كلمتا المرور الجدد موش متطابقين.";
      return;
    }
    this.changing = true;
    this.notice = "";
    try {
      await firstValueFrom(
        this.http
          .put(environment.apiBaseUrl + "/api/users/me/password", {
            currentPassword: this.currentPassword,
            newPassword: this.newPassword,
          })
          .pipe(timeout(15000)),
      );
      this.currentPassword = "";
      this.newPassword = "";
      this.confirmPassword = "";
      form.resetForm();
      this.notice = "تبدّلت كلمة المرور بنجاح.";
    } catch (e: any) {
      this.notice =
        e?.status === 400
          ? "تثبّت من كلمة المرور الحالية."
          : "ما تبدّلتش كلمة المرور. عاود جرّب.";
    } finally {
      this.changing = false;
    }
  }
  publish() {
    window.dispatchEvent(new CustomEvent("amanafarm-publish-request"));
  }
  logout() {
    this.state.logout();
    void this.router.navigate(["/"]);
  }
  ngOnDestroy() {
    this.alive = false;
    this.sub?.unsubscribe();
  }
}
