import { IconComponent } from '../../shared/icon/icon.component';
import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { timeout } from "rxjs";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { StateService } from "../../services/state.service";
import { environment } from "../../../environments/environment";

export interface Trip {
  id: number;
  origin: string;
  destination: string;
  departure: string;
  animalType: string;
  capacity: number;
  price: number;
  vehicle: string;
  notes: string;
  contactPhone: string;
  driverName: string;
  ownerId: number;
  accompanied: boolean;
}
export const GOVERNORATES = [
  "تونس",
  "أريانة",
  "بن عروس",
  "منوبة",
  "بنزرت",
  "نابل",
  "زغوان",
  "باجة",
  "جندوبة",
  "الكاف",
  "سليانة",
  "سوسة",
  "المنستير",
  "المهدية",
  "صفاقس",
  "القيروان",
  "القصرين",
  "سيدي بوزيد",
  "قابس",
  "مدنين",
  "تطاوين",
  "قفصة",
  "توزر",
  "قبلي",
];
@Component({
  selector: "app-carpool",
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterLink],
  templateUrl: "./carpool.component.html",
  styleUrls: ["./carpool.component.scss"],
})
export class CarpoolComponent implements OnInit {
  readonly regions = GOVERNORATES;
  readonly animals = ["أغنام", "أبقار", "ماعز", "دواجن", "حيوانات أليفة"];
  readonly api = environment.apiBaseUrl + "/api/trips";
  trips: Trip[] = [];
  loading = false;
  saving = false;
  error = "";
  formError = "";
  notice = "";
  query = "";
  origin = "";
  destination = "";
  date = "";
  animal = "";
  accompanied = false;
  sort = "soonest";
  private pendingPublish=false;
  showForm = false;
  selected: Trip | null = null;
  draft = this.emptyDraft();
  @ViewChild("tripDialog") tripDialog?: ElementRef<HTMLElement>;
  private returnFocus?: HTMLElement;
  private readonly dateFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  get today() {
    return this.dateFormatter.format(new Date());
  }
  get minimumDeparture() {
    return this.today + "T00:00";
  }
  get results() {
    const now = Date.now();
    return this.trips
      .filter(
        (t) =>
          new Date(t.departure + "+01:00").getTime() > now &&
          (!this.query || [t.origin,t.destination,t.animalType,t.driverName,t.vehicle].join(' ').includes(this.query.trim())) &&
      (!this.origin || t.origin === this.origin) &&
          (!this.destination || t.destination === this.destination) &&
          (!this.date || t.departure.startsWith(this.date)) &&
          (!this.animal || t.animalType === this.animal) &&
          (!this.accompanied || t.accompanied),
      )
      .sort((a, b) =>
        this.sort === "price"
          ? a.price - b.price
          : a.departure.localeCompare(b.departure),
      );
  }
  constructor(
    private http: HttpClient,
    public state: StateService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get("q");
    this.query=q&&!this.regions.includes(q)?q:'';
    this.origin=this.route.snapshot.queryParamMap.get("from")||'';
    if (q && this.regions.includes(q)) this.origin = q;
    this.load();
    if(this.route.snapshot.queryParamMap.get("publish"))this.openForm();
  }
  load() {
    this.loading = true;
    this.error = "";
    this.http
      .get<Trip[]>(this.api)
      .pipe(timeout(15000))
      .subscribe({
        next: (data) => {
          this.trips = data;
          const selectedId=Number(this.route.snapshot.queryParamMap.get("trip"));
          if(selectedId){const trip=data.find(t=>t.id===selectedId);if(trip)this.showDetails(trip);else this.notice="الرحلة هاذي ما عادش متاحة.";}
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = "تعذّر تحميل الرحلات. تثبّت من الاتصال وعاود جرّب.";
        },
      });
  }
  reset() {
    this.query = "";
    this.origin = "";
    this.destination = "";
    this.date = "";
    this.animal = "";
    this.accompanied = false;
  }
  swap() {
    [this.origin, this.destination] = [this.destination, this.origin];
  }
  openForm() {
    if (!this.state.isLoggedIn()) {
      this.pendingPublish=true;
      window.dispatchEvent(new CustomEvent("amanafarm-login-required"));
      return;
    }
    this.formError = "";
    this.notice = "";
    this.draft = this.emptyDraft();
    this.showForm = true;
    this.focusDialog();
  }
  @HostListener('window:amanafarm-authenticated')
  resumePublish(){if(this.pendingPublish){this.pendingPublish=false;this.openForm();}}
  showDetails(trip: Trip) {
    this.formError = "";
    this.selected = trip;
    this.focusDialog();
  }
  close() {
    if (this.saving) return;
    this.showForm = false;
    this.selected = null;
    this.returnFocus?.focus();
  }
  private focusDialog() {
    this.returnFocus = document.activeElement as HTMLElement;
    setTimeout(() => this.tripDialog?.nativeElement.focus());
  }
  @HostListener("document:keydown", ["$event"]) onKey(event: KeyboardEvent) {
    if (!this.showForm && !this.selected) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
    }
    if (event.key === "Tab") {
      const dialog = this.tripDialog?.nativeElement;
      const items = dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              "button:not([disabled]), input, select, textarea, a[href]",
            ),
          )
        : [];
      const first = items[0];
      const last = items[items.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  publish(form: NgForm) {
    if (this.saving) return;
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.formError = "كمّل المعلومات المطلوبة وتثبّت من رقم الهاتف والسعر.";
      return;
    }
    if (this.draft.origin === this.draft.destination) {
      this.formError = "ولاية الانطلاق والوصول لازم يكونوا مختلفين.";
      return;
    }
    if (new Date(this.draft.departure + "+01:00").getTime() <= Date.now()) {
      this.formError = "اختار وقت انطلاق في المستقبل.";
      return;
    }
    this.saving = true;
    this.formError = "";
    this.http.post<Trip>(this.api, this.draft).subscribe({
      next: (trip) => {
        this.trips = [trip, ...this.trips];
        this.saving = false;
        this.reset();
        this.close();
        this.notice = "تنشرت رحلتك بنجاح. ينجموا الناس يتصلوا بيك مباشرة.";
      },
      error: (e: HttpErrorResponse) => {
        this.saving = false;
        this.formError =
          e.status === 401 || e.status === 403
            ? "يلزم تسجيل الدخول باش تنشر رحلة."
            : "ما تنشرتش الرحلة. تثبّت من المعلومات وعاود جرّب.";
      },
    });
  }
  deleteTrip(trip: Trip) {
    if (!confirm("متأكد تحب تفسخ الرحلة؟")) return;
    this.saving = true;
    this.formError = "";
    this.http.delete(this.api + "/" + trip.id).subscribe({
      next: () => {
        this.trips = this.trips.filter((t) => t.id !== trip.id);
        this.saving = false;
        this.close();
        this.notice = "تفسخت الرحلة.";
      },
      error: () => {
        this.saving = false;
        this.formError = "تعذّر فسخ الرحلة. عاود جرّب.";
      },
    });
  }
  phone(trip: Trip) {
    return trip.contactPhone.replace(/\D/g, "");
  }
  whatsapp(trip: Trip) {
    return (
      "https://wa.me/216" +
      this.phone(trip) +
      "?text=" +
      encodeURIComponent(
        "سلام، نحب نستفسر على رحلة نقل الحيوانات من " +
          trip.origin +
          " إلى " +
          trip.destination,
      )
    );
  }
  private emptyDraft() {
    return {
      origin: "",
      destination: "",
      departure: "",
      animalType: "أغنام",
      capacity: 1,
      price: 0,
      vehicle: "شاحنة مهيّأة",
      notes: "",
      contactPhone: "",
      accompanied: false,
    };
  }
}
