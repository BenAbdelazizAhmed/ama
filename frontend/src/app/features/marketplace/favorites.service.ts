import { Injectable, signal, effect } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, timeout } from "rxjs";
import { environment } from "../../../environments/environment";
import { StateService } from "../../services/state.service";
import { MarketKind } from "./market.models";
export interface SavedListing {
  kind: MarketKind;
  listingId: number;
}
@Injectable({ providedIn: "root" })
export class FavoritesService {
  readonly items = signal<SavedListing[]>([]);
  readonly error = signal("");
  readonly pending = signal<string[]>([]);
  readonly loading = signal(false);
  private readonly base = environment.apiBaseUrl + "/api/favorites";
  private generation = 0;
  constructor(
    private http: HttpClient,
    private state: StateService,
  ) {
    effect(
      () => {
        const id = this.state.user()?.id;
        this.generation++;
        if (!id) {
          this.items.set([]);
          this.error.set("");
          return;
        }
        void this.load();
      },
      { allowSignalWrites: true },
    );
  }
  has(kind: MarketKind, id: number) {
    return this.items().some((f) => f.kind === kind && f.listingId === id);
  }
  busy(kind: MarketKind, id: number) {
    return this.pending().includes(kind + ":" + id);
  }
  async load() {
    const version = this.generation;
    this.loading.set(true);
    this.error.set("");
    try {
      const rows = await firstValueFrom(
        this.http.get<SavedListing[]>(this.base).pipe(timeout(15000)),
      );
      if (version === this.generation) {
        this.items.set(rows);
        const stored = sessionStorage.getItem("af_pending_favorite");
        if (stored) {
          try {
            const pending = JSON.parse(stored) as SavedListing;
            if (
              ["animals", "products", "wholesale", "services", "jobs"].includes(
                pending.kind,
              ) &&
              Number.isInteger(pending.listingId) &&
              pending.listingId > 0
            ) {
              sessionStorage.removeItem("af_pending_favorite");
              if (!this.has(pending.kind, pending.listingId))
                await this.toggle(pending.kind, pending.listingId);
            }
          } catch {
            sessionStorage.removeItem("af_pending_favorite");
          }
        }
      }
    } catch {
      if (version === this.generation)
        this.error.set("تعذّر تحميل المفضّلة. عاود جرّب.");
    } finally {
      if (version === this.generation) this.loading.set(false);
    }
  }
  async toggle(kind: MarketKind, id: number) {
    if (!this.state.isLoggedIn()) {
      sessionStorage.setItem(
        "af_pending_favorite",
        JSON.stringify({ kind, listingId: id }),
      );
      window.dispatchEvent(new CustomEvent("amanafarm-login-required"));
      return;
    }
    if (this.busy(kind, id)) return;
    const key = kind + ":" + id;
    const existed = this.has(kind, id);
    const version = this.generation;
    this.pending.update((p) => [...p, key]);
    this.error.set("");
    try {
      if (existed)
        await firstValueFrom(
          this.http
            .delete(this.base + "/" + kind + "/" + id)
            .pipe(timeout(15000)),
        );
      else
        await firstValueFrom(
          this.http
            .post(this.base, { kind, listingId: id })
            .pipe(timeout(15000)),
        );
      if (version === this.generation)
        this.items.update((items) =>
          existed
            ? items.filter((f) => !(f.kind === kind && f.listingId === id))
            : [...items, { kind, listingId: id }],
        );
    } catch {
      if (version === this.generation)
        this.error.set("ما تبدّلتش المفضّلة. تثبّت من الاتصال وعاود جرّب.");
    } finally {
      this.pending.update((p) => p.filter((k) => k !== key));
    }
  }
}
