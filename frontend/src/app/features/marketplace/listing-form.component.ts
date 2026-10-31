import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { IconComponent } from "../../shared/icon/icon.component";
import { DialogDirective } from "./dialog.directive";
import { MarketApi } from "./market-api.service";
import {
  MarketKind,
  MarketListing,
  ListingDraft,
  MARKETS,
  REGIONS,
} from "./market.models";
@Component({
  selector: "app-listing-form",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DialogDirective],
  templateUrl: "./listing-form.component.html",
  styles: [":host{display:block}"],
})
export class ListingFormComponent implements OnInit, OnDestroy {
  @Input({ required: true }) kind!: MarketKind;
  @Input() listing: MarketListing | null = null;
  @Output() saved = new EventEmitter<MarketListing>();
  @Output() dismissed = new EventEmitter<void>();
  readonly markets = MARKETS;
  readonly regions = REGIONS;
  saving = false;
  error = "";
  files: File[] = [];
  previews: string[] = [];
  draft: ListingDraft = {
    title: "",
    category: "",
    place: "",
    price: null,
    description: "",
    phone: "",
    unit: "",
    quantity: 1,
    age: "",
    gender: "",
    available: true,
    images: [],
    deadline: "",
  };
  constructor(public api: MarketApi) {}
  get categories() {
    return Array.from(
      new Set([
        ...MARKETS[this.kind].categories,
        ...(this.listing?.category ? [this.listing.category] : []),
      ]),
    );
  }
  ngOnInit() {
    if (this.listing) {
      const l = this.listing;
      this.draft = {
        title: l.title,
        category: l.category,
        place: l.place,
        price: l.price,
        description: l.description,
        phone: l.phone,
        unit: l.unit,
        quantity: Number(l.raw["minQuantity"] || 1),
        age: String(l.raw["age"] || l.raw["experience"] || ""),
        gender: String(l.raw["gender"] || ""),
        available: l.available,
        images: [...l.images],
        deadline: String(l.raw["deadline"] || ""),
      };
    }
  }
  choose(event: Event) {
    this.error = "";
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (!selected.length) return;
    const limit = this.kind === "animals" ? 6 : 1;
    if (
      selected.length + this.files.length + this.draft.images.length >
      limit
    ) {
      this.error =
        "الحد الأقصى " + limit + " صور. انحّي صورة قبل ما تزيد أخرى.";
      input.value = "";
      return;
    }
    if (
      selected.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024,
      )
    ) {
      this.error = "اختار صور JPEG، PNG أو WebP، أقل من 5MB للصورة.";
      input.value = "";
      return;
    }
    this.files = [...this.files, ...selected];
    this.previews = [
      ...this.previews,
      ...selected.map((f) => URL.createObjectURL(f)),
    ];
    input.value = "";
  }
  removePhoto(index: number) {
    this.draft.images.splice(index, 1);
  }
  clearSelection() {
    this.release();
    this.files = [];
    this.previews = [];
  }
  close() {
    if (!this.saving) this.dismissed.emit();
  }
  async submit(form: NgForm) {
    if (this.saving) return;
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.error = "تثبّت من المعلومات المطلوبة ورقم الهاتف.";
      return;
    }
    this.saving = true;
    this.error = "";
    try {
      if (this.files.length) {
        const urls = await this.api.upload(this.files);
        this.draft.images.push(...urls);
        this.clearSelection();
      }
      const result = await this.api.save(
        this.kind,
        this.draft,
        this.listing?.id,
        this.listing?.raw,
      );
      this.saved.emit(result);
    } catch (e: any) {
      this.error =
        e?.status === 401
          ? "انتهت الجلسة. سجّل الدخول وعاود جرّب."
          : e?.status === 403
            ? "ما عندكش صلاحية تعديل الإعلان هذا."
            : "ما تسجّلش الإعلان. تثبّت من المعلومات والاتصال وعاود جرّب.";
    } finally {
      this.saving = false;
    }
  }
  private release() {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
  }
  ngOnDestroy() {
    this.release();
  }
}
