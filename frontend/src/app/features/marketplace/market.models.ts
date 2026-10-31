export type MarketKind =
  "animals" | "products" | "wholesale" | "services" | "jobs";
export interface MarketConfig {
  title: string;
  label: string;
  subtitle: string;
  icon: string;
  endpoint: string;
  categories: string[];
}
export const MARKETS: Record<MarketKind, MarketConfig> = {
  animals: {
    title: "لقّى الحيوان المناسب ليك.",
    label: "الحيوانات",
    subtitle: "إعلانات من المربّي مباشرة، بصور وأسعار واضحة.",
    icon: "animal",
    endpoint: "animals",
    categories: [
      "أغنام",
      "أبقار",
      "ماعز",
      "دواجن",
      "خيول",
      "جمال",
      "أرانب",
      "حيوانات أليفة",
    ],
  },
  products: {
    title: "كل ما يلزم المزرعة.",
    label: "المنتجات",
    subtitle: "أعلاف، بذور ومعدات. تفقّد وقارن واتّفق مع صاحب الإعلان.",
    icon: "grain",
    endpoint: "products",
    categories: [
      "علف",
      "بذور",
      "معدات",
      "لوازم",
      "سماد",
      "برودويات طبيعية",
      "خضر",
    ],
  },
  wholesale: {
    title: "كميات أكبر. فرص أكثر.",
    label: "سوق الجملة",
    subtitle: "اعرف الكمية الدنيا والسعر قبل ما تتواصل مع المورد.",
    icon: "package",
    endpoint: "wholesale",
    categories: ["أغنام", "أبقار", "دواجن", "أعلاف", "منتجات فلاحية", "معدات"],
  },
  services: {
    title: "الخبرة اللي تعاون خدمتك.",
    label: "الخدمات والمهن",
    subtitle: "لقّى عامل، مختص ولا مقدم خدمة قريب ليك.",
    icon: "users",
    endpoint: "workers",
    categories: [
      "عامل فلاحي",
      "رعي وتربية",
      "بيطري",
      "نقل",
      "حراثة",
      "حصاد",
      "صيانة",
    ],
  },
  jobs: {
    title: "فرص خدمة في الفلاحة.",
    label: "فرص العمل",
    subtitle: "تفقّد عروض الشغل وتواصل مباشرة مع صاحب العرض.",
    icon: "users",
    endpoint: "jobs",
    categories: ["دوام كامل", "دوام جزئي", "موسمي", "عمل يومي"],
  },
};
export const REGIONS = [
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
export interface MarketListing {
  id: number;
  kind: MarketKind;
  title: string;
  category: string;
  place: string;
  price: number;
  unit: string;
  description: string;
  phone: string;
  images: string[];
  ownerId: number | null;
  ownerName: string;
  createdAt: string;
  available: boolean;
  raw: Record<string, any>;
}
export interface ListingDraft {
  title: string;
  category: string;
  place: string;
  price: number | null;
  description: string;
  phone: string;
  unit: string;
  quantity: number;
  age: string;
  gender: string;
  available: boolean;
  images: string[];
  deadline: string;
}
export interface MarketFilters {
  q: string;
  category: string;
  region: string;
  min: string;
  max: string;
  sort: string;
  available: boolean;
}
export const emptyFilters = (): MarketFilters => ({
  q: "",
  category: "",
  region: "",
  min: "",
  max: "",
  sort: "newest",
  available: false,
});
export function filterListings(
  items: MarketListing[],
  filter: MarketFilters,
): MarketListing[] {
  const q = filter.q.trim().toLocaleLowerCase();
  const min = filter.min === "" ? 0 : Number(filter.min);
  const max = filter.max === "" ? Infinity : Number(filter.max);
  return items
    .filter(
      (a) =>
        (!q ||
          [a.title, a.category, a.place, a.description, a.ownerName]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)) &&
        (!filter.category || a.category === filter.category) &&
        (!filter.region || a.place === filter.region) &&
        a.price >= (Number.isFinite(min) ? min : 0) &&
        a.price <= (Number.isFinite(max) ? max : Infinity) &&
        (!filter.available || a.available),
    )
    .sort((a, b) =>
      filter.sort === "cheap"
        ? a.price - b.price
        : filter.sort === "expensive"
          ? b.price - a.price
          : (Date.parse(b.createdAt) || b.id) -
            (Date.parse(a.createdAt) || a.id),
    );
}
