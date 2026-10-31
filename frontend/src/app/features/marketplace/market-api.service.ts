import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, timeout } from "rxjs";
import { environment } from "../../../environments/environment";
import { StateService } from "../../services/state.service";
import {
  MARKETS,
  MarketKind,
  MarketListing,
  ListingDraft,
} from "./market.models";
@Injectable({ providedIn: "root" })
export class MarketApi {
  readonly base = environment.apiBaseUrl;
  constructor(
    private http: HttpClient,
    private state: StateService,
  ) {}
  async list(kind: MarketKind): Promise<MarketListing[]> {
    const rows = await firstValueFrom(
      this.http
        .get<Record<string, any>[]>(this.endpoint(kind))
        .pipe(timeout(15000)),
    );
    return rows.map((r) => this.normalize(kind, r));
  }
  async get(kind: MarketKind, id: number): Promise<MarketListing> {
    const row = await firstValueFrom(
      this.http
        .get<Record<string, any>>(this.endpoint(kind) + "/" + id)
        .pipe(timeout(15000)),
    );
    return this.normalize(kind, row);
  }
  async save(
    kind: MarketKind,
    d: ListingDraft,
    id?: number,
    existing: Record<string, any> = {},
  ): Promise<MarketListing> {
    const common = {
      title: d.title.trim(),
      category: d.category,
      description: d.description.trim(),
      price: d.price ?? 0,
      phone: d.phone,
      contactPhone: d.phone,
      location: d.place,
      wilaya: d.place,
    };
    let payload: Record<string, any> = { ...common };
    switch (kind) {
      case "animals":
        payload = {
          ...common,
          priceType: existing["priceType"] || "FIXED",
          images: d.images,
          age: d.age,
          gender: d.gender,
          healthStatus: existing["healthStatus"] || "حسب تصريح البائع",
          contactMethod: existing["contactMethod"] || "PHONE",
          deliveryAvailable: existing["deliveryAvailable"] || false,
          vetCertificate: existing["vetCertificate"] || false,
        };
        break;
      case "products":
        payload = {
          ...common,
          imageUrl: d.images[0] || "",
          priceType: existing["priceType"] || "PER_UNIT",
          unit: d.unit,
          inStock: d.available,
          sellerType: existing["sellerType"] || "individual",
          sellerName: this.state.user()?.fullName || "",
        };
        break;
      case "wholesale":
        payload = {
          ...common,
          imageUrl: d.images[0] || "",
          priceUnit: d.unit,
          minQuantity: d.quantity,
          supplierName:
            existing["supplierName"] || this.state.user()?.fullName || "",
        };
        break;
      case "services":
        payload = {
          ...common,
          price: Math.round(d.price ?? 0),
          name: existing["name"] || this.state.user()?.fullName || "",
          skills: existing["skills"] || d.category,
          experience: d.age,
          priceUnit: d.unit,
          available: d.available,
          avatarUrl: d.images[0] || "",
          category: d.category,
        };
        break;
      case "jobs":
        payload = {
          ...common,
          employer: existing["employer"] || this.state.user()?.fullName || "",
          salary: String(d.price ?? 0),
          jobType: d.category,
          period: d.unit,
          deadline: d.deadline,
          logo: d.images[0] || "",
          tags: existing["tags"] || d.category,
        };
        break;
    }
    payload = { ...existing, ...payload };
    const result = await firstValueFrom(
      this.http
        .request<Record<string, any>>(
          id ? "PUT" : "POST",
          this.endpoint(kind) + (id ? "/" + id : ""),
          { body: payload },
        )
        .pipe(timeout(20000)),
    );
    return this.normalize(kind, result);
  }
  async remove(item: MarketListing) {
    await firstValueFrom(
      this.http
        .delete(this.endpoint(item.kind) + "/" + item.id, {
          responseType: "text",
        })
        .pipe(timeout(15000)),
    );
  }
  async upload(files: File[]): Promise<string[]> {
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    const response = await firstValueFrom(
      this.http
        .post<{ urls: string[] }>(this.base + "/api/media", body)
        .pipe(timeout(60000)),
    );
    return response.urls;
  }
  image(url: string): string {
    if (url.startsWith("/uploads/")) return this.base + url;
    if (url.startsWith("uploads/")) return this.base + "/" + url;
    return url;
  }
  private endpoint(kind: MarketKind) {
    return this.base + "/api/" + MARKETS[kind].endpoint;
  }
  normalize(kind: MarketKind, r: Record<string, any>): MarketListing {
    const rawImages = Array.isArray(r["images"]) ? r["images"] : [];
    const images = rawImages
      .map((i: any) =>
        typeof i === "string" ? i : i?.imageUrl || i?.url || "",
      )
      .filter(Boolean);
    const picture = r["imageUrl"] || r["avatarUrl"] || r["logo"];
    if (!images.length && picture) images.push(picture);
    const amount = Number(kind === "jobs" ? r["salary"] : r["price"]);
    return {
      id: Number(r["id"]),
      kind,
      title: String(r["title"] || ""),
      category: String(
        r["category"] || (kind === "jobs" ? r["jobType"] : "") || "",
      ),
      place: String(r["wilaya"] || r["location"] || ""),
      price: Number.isFinite(amount) ? amount : 0,
      unit: String(r["priceUnit"] || r["unit"] || r["period"] || ""),
      description: String(r["description"] || ""),
      phone: String(r["phone"] || r["contactPhone"] || "")
        .replace(/\D/g, "")
        .replace(/^216(?=\d{8}$)/, ""),
      images,
      ownerId: r["userId"] == null ? null : Number(r["userId"]),
      ownerName: String(
        r["sellerName"] ||
          r["supplierName"] ||
          r["name"] ||
          r["employer"] ||
          "صاحب الإعلان",
      ),
      createdAt: String(r["createdAt"] || ""),
      available:
        r["status"] !== "SOLD" &&
        r["inStock"] !== false &&
        r["available"] !== false,
      raw: r,
    };
  }
}
