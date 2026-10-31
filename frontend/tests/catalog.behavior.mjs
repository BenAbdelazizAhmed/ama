import assert from "node:assert/strict";
import { test } from "node:test";
import { of } from "rxjs";
import { loadSource } from "./load-source.mjs";
const { filterListings, emptyFilters } = await loadSource(
  "../src/app/features/marketplace/market.models.ts",
);
const { ListingFormComponent } = await loadSource(
  "../src/app/features/marketplace/listing-form.component.ts",
);
const { MarketApi } = await loadSource(
  "../src/app/features/marketplace/market-api.service.ts",
);
const { HomeComponent } = await loadSource(
  "../src/app/components/home/home.component.ts",
);
const item = (id, extra = {}) => ({
  id,
  kind: "animals",
  title: "خروف للتربية",
  category: "أغنام",
  place: "تونس",
  price: 100,
  unit: "",
  description: "إعلان حقيقي",
  phone: "22123456",
  images: [],
  ownerId: 7,
  ownerName: "Ahmed",
  available: true,
  createdAt: "2030-01-01T10:00:00",
  raw: {},
  ...extra,
});
const rows = [
  item(1),
  item(2, { price: 300, place: "نابل", createdAt: "2030-02-01T10:00:00" }),
  item(3, { price: 70, category: "أبقار", available: false }),
  item(4, { kind: "products", title: "علف طبيعي", category: "علف", price: 40 }),
];
test("combined search, location, category and price filters return only matching records", () => {
  assert.deepEqual(
    filterListings(rows, {
      ...emptyFilters(),
      q: " خروف ",
      region: "نابل",
      category: "أغنام",
      min: "200",
      max: "350",
    }).map((r) => r.id),
    [2],
  );
  assert.equal(
    filterListings(rows, { ...emptyFilters(), q: "شيء غير موجود" }).length,
    0,
  );
});
test("sorting uses actual prices and dates without mutating source records", () => {
  assert.deepEqual(
    filterListings(rows, { ...emptyFilters(), sort: "cheap" }).map((r) => r.id),
    [4, 3, 1, 2],
  );
  assert.equal(filterListings(rows, emptyFilters())[0].id, 2);
  assert.deepEqual(
    rows.map((r) => r.id),
    [1, 2, 3, 4],
  );
});
test("available-only filtering and price bounds exclude unsuitable offers", () => {
  assert.deepEqual(
    filterListings(rows, { ...emptyFilters(), available: true, max: "100" })
      .map((r) => r.id)
      .sort(),
    [1, 4],
  );
  assert.equal(
    filterListings(rows, { ...emptyFilters(), min: "500", max: "100" }).length,
    0,
  );
});
function form(api) {
  const f = new ListingFormComponent(api);
  f.kind = "animals";
  f.draft = {
    ...f.draft,
    title: "خروف للتربية",
    category: "أغنام",
    place: "تونس",
    description: "وصف واضح وحقيقي",
    price: 100,
    phone: "22123456",
  };
  return f;
}
test("invalid publication never uploads images or submits a listing", async () => {
  let calls = 0;
  const f = form({
    upload: async () => {
      calls++;
    },
    save: async () => {
      calls++;
    },
  });
  let touched = false;
  await f.submit({
    invalid: true,
    control: {
      markAllAsTouched() {
        touched = true;
      },
    },
  });
  assert.equal(calls, 0);
  assert.equal(touched, true);
  assert.ok(f.error);
});
test("a failed listing save retains uploaded photos and retry does not upload twice", async () => {
  let uploads = 0,
    saves = 0,
    saved;
  const f = form({
    upload: async () => {
      uploads++;
      return ["/uploads/photo.png"];
    },
    save: async (kind, draft) => {
      saves++;
      if (saves === 1) throw new Error("offline");
      return item(90, { images: [...draft.images] });
    },
  });
  f.files = [new File(["image"], "photo.png", { type: "image/png" })];
  f.saved.subscribe((result) => (saved = result));
  await f.submit({ invalid: false });
  assert.equal(f.saving, false);
  assert.ok(f.error);
  assert.deepEqual(f.draft.images, ["/uploads/photo.png"]);
  assert.equal(f.files.length, 0);
  await f.submit({ invalid: false });
  assert.equal(uploads, 1);
  assert.equal(saved.id, 90);
});
test("unsupported and oversized photo selections are rejected before upload", () => {
  const f = form({});
  for (const file of [
    new File(["x"], "bad.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    }),
  ]) {
    f.choose({ target: { files: [file], value: "" } });
    assert.ok(f.error);
    assert.equal(f.files.length, 0);
  }
});
test("market API sends the form to the correct endpoint and uses the server-created id", async () => {
  let request;
  const api = new MarketApi(
    {
      request: (method, url, options) => {
        request = { method, url, body: options.body };
        return of({
          ...options.body,
          id: 32,
          userId: 7,
          createdAt: "2030-01-01T10:00:00",
        });
      },
    },
    { user: () => ({ fullName: "Ahmed" }), retryMarketplace: async () => {} },
  );
  const f = form({});
  const result = await api.save("animals", f.draft);
  assert.equal(request.method, "POST");
  assert.ok(request.url.endsWith("/api/animals"));
  assert.equal("userId" in request.body, false);
  assert.equal("trustedSeller" in request.body, false);
  assert.equal(result.id, 32);
});
test("homepage shows real successful results and reports a partial connection failure", async () => {
  const home = new HomeComponent(
    {
      list: async (kind) => {
        if (kind === "animals") throw new Error("offline");
        return [item(8, { kind: "products" })];
      },
    },
    {},
  );
  await home.load();
  assert.equal(home.loading, false);
  assert.equal(home.items.length, 1);
  assert.equal(home.items[0].id, 8);
  assert.ok(home.error);
});
test("homepage empty response stays empty rather than creating demo offers", async () => {
  const home = new HomeComponent({ list: async () => [] }, {});
  await home.load();
  assert.equal(home.items.length, 0);
  assert.equal(home.error, "");
  assert.equal(home.loading, false);
});
test("home search routes to the chosen market with shareable search and region parameters", () => {
  let route;
  const home = new HomeComponent(
    {},
    {
      navigate: (path, options) => {
        route = { path, options };
      },
    },
  );
  home.category = "products";
  home.query = " علف ";
  home.region = "نابل";
  home.search();
  assert.deepEqual(route.path, ["/products"]);
  assert.equal(route.options.queryParams.q, "علف");
  assert.equal(route.options.queryParams.region, "نابل");
});
const { MarketComponent } = await loadSource(
  "../src/app/features/marketplace/market.component.ts",
);
test("zero maximum price survives URL serialization and selects only free or negotiable listings", () => {
  let navigated;
  const page = new MarketComponent(
    {},
    {
      navigate: (route, options) => {
        navigated = options;
      },
    },
    {},
    {},
    {},
  );
  page.showFilters = true;
  page.draftFilters = { ...emptyFilters(), max: 0 };
  page.saveFilters();
  assert.equal(page.showFilters, false);
  assert.equal(navigated.queryParams.max, "0");
  assert.equal(page.filters.max, "0");
  assert.equal(page.filterCount, 1);
});
test("invalid price intervals keep the filter dialog open with an actionable error", () => {
  let calls = 0;
  const page = new MarketComponent({}, { navigate: () => calls++ }, {}, {}, {});
  page.showFilters = true;
  page.draftFilters = { ...emptyFilters(), min: "200", max: "100" };
  page.saveFilters();
  assert.equal(calls, 0);
  assert.equal(page.showFilters, true);
  assert.ok(page.filterError);
});
test("editing a listing preserves metadata not exposed by the publishing form", async () => {
  let body;
  const api = new MarketApi(
    {
      request: (method, url, options) => {
        body = options.body;
        return of({ ...body, id: 32, userId: 7 });
      },
    },
    { user: () => ({ fullName: "Ahmed" }), retryMarketplace: async () => {} },
  );
  const f = form({});
  await api.save("products", f.draft, 32, {
    origin: "تونس",
    quantity: "50 كيس",
    companyName: "مورد سابق",
    sellerType: "company",
    priceType: "PER_KG",
  });
  assert.equal(body.origin, "تونس");
  assert.equal(body.quantity, "50 كيس");
  assert.equal(body.companyName, "مورد سابق");
  assert.equal(body.sellerType, "company");
  assert.equal(body.priceType, "PER_KG");
});
