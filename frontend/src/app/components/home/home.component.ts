import { Component, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { StateService } from "../../services/state.service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent {
  query = "";
  category = "animals";
  filter = "all";
  readonly categories = [
    {
      icon: "🐑",
      title: "حيوانات",
      sub: "أغنام، أبقار، دواجن",
      route: "/animals",
      color: "sand",
    },
    {
      icon: "🌾",
      title: "منتجات فلاحية",
      sub: "أعلاف، بذور، معدات",
      route: "/products",
      color: "sage",
    },
    {
      icon: "🧑‍🌾",
      title: "مهن وخدمات",
      sub: "خبرة تعاونك في خدمتك",
      route: "/services",
      color: "peach",
    },
    {
      icon: "🚚",
      title: "نقل الحيوانات",
      sub: "رحلة مشتركة، مصاريف أقل",
      route: "/carpool",
      color: "blue",
    },
  ];
  readonly listings = computed(() =>
    [
      ...this.state
        .animals()
        .map((a) => ({
          id: a.id,
          title: a.name,
          price: a.price,
          place: a.location,
          image: a.imageUrl,
          type: "animals",
        })),
      ...this.state
        .products()
        .map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          place: p.wilaya || p.location,
          image: p.imageUrl,
          type: "products",
        })),
    ].sort((a, b) => Number(b.id) - Number(a.id)),
  );
  get visibleListings() {
    return this.listings()
      .filter((a) => this.filter === "all" || a.type === this.filter)
      .slice(0, 8);
  }
  constructor(
    public state: StateService,
    private router: Router,
  ) {}
  search() {
    void this.router.navigate(["/" + this.category], {
      queryParams: this.query.trim() ? { q: this.query.trim() } : {},
    });
  }
  publish() {
    window.dispatchEvent(new CustomEvent("amanafarm-publish-request"));
  }
  onImageError(event: Event) {
    (event.target as HTMLImageElement).style.display = "none";
  }
  image(url?: string) {
    return url?.startsWith("uploads/")
      ? environment.apiBaseUrl + "/" + url
      : url || "";
  }
}
