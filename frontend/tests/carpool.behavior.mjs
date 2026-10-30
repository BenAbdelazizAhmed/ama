// Exercise transport behavior without a browser or a running backend.
import "@angular/compiler";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { of, throwError } from "rxjs";

const moduleUrl = new URL(
  `.carpool-behavior-${process.pid}.mjs`,
  import.meta.url,
);
const source = readFileSync(
  new URL(
    "../src/app/components/carpool/carpool.component.ts",
    import.meta.url,
  ),
  "utf8",
);
const environment = transpileModule(
  readFileSync(
    new URL("../src/environments/environment.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ModuleKind.ES2022 } },
).outputText;
const portableSource = source.replace(
  /(["'])\.\.\/\.\.\/\.\.\/environments\/environment\1/,
  JSON.stringify("data:text/javascript," + encodeURIComponent(environment)),
);
writeFileSync(
  moduleUrl,
  transpileModule(portableSource, {
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.ES2022,
      experimentalDecorators: true,
    },
  }).outputText,
);
let CarpoolComponent;
try {
  ({ CarpoolComponent } = await import(moduleUrl.href));
} finally {
  unlinkSync(moduleUrl);
}
let dispatched;
globalThis.window = {
  dispatchEvent: (event) => {
    dispatched = event;
  },
};
globalThis.CustomEvent = class {
  constructor(type) {
    this.type = type;
  }
};
globalThis.document = { activeElement: { focus() {} } };
globalThis.confirm = () => true;
function setup() {
  const calls = [];
  const http = {
    get(url) {
      calls.push(["get", url]);
      return of([]);
    },
    post(url, body) {
      calls.push(["post", url, { ...body }]);
      return of({ ...body, id: 9, ownerId: 7, driverName: "Test" });
    },
    delete(url) {
      calls.push(["delete", url]);
      return of(null);
    },
  };
  const state = { isLoggedIn: () => true, user: () => ({ id: 7 }) };
  return {
    page: new CarpoolComponent(http, state, {
      snapshot: { queryParamMap: { get: () => null } },
    }),
    http,
    state,
    calls,
  };
}
const trip = (overrides = {}) => ({
  id: 1,
  origin: "تونس",
  destination: "سوسة",
  departure: "2099-12-01T09:00:00",
  animalType: "أغنام",
  capacity: 3,
  price: 25,
  vehicle: "شاحنة مهيّأة",
  contactPhone: "22123456",
  driverName: "Test",
  ownerId: 7,
  notes: "",
  accompanied: true,
  ...overrides,
});
const validForm = () => ({
  invalid: false,
  control: { markAllAsTouched() {} },
});

test("filters route, date, animal and accompaniment while excluding expired trips", () => {
  const { page } = setup();
  page.trips = [
    trip(),
    trip({ id: 2, origin: "صفاقس", accompanied: false }),
    trip({ id: 3, departure: "2000-01-01T09:00:00" }),
  ];
  assert.equal(page.results.length, 2);
  page.origin = "تونس";
  page.destination = "سوسة";
  page.date = "2099-12-01";
  page.animal = "أغنام";
  page.accompanied = true;
  assert.deepEqual(
    page.results.map((t) => t.id),
    [1],
  );
  page.date = "2099-12-02";
  assert.equal(page.results.length, 0);
  page.reset();
  assert.equal(page.results.length, 2);
});
test("sorts by price and swaps endpoints", () => {
  const { page } = setup();
  page.trips = [trip({ id: 1, price: 40 }), trip({ id: 2, price: 20 })];
  page.sort = "price";
  assert.deepEqual(
    page.results.map((t) => t.id),
    [2, 1],
  );
  page.origin = "تونس";
  page.destination = "سوسة";
  page.swap();
  assert.equal(page.origin, "سوسة");
  assert.equal(page.destination, "تونس");
});
test("anonymous publishing opens sign in without creating a trip", () => {
  const { page, state, calls } = setup();
  state.isLoggedIn = () => false;
  page.openForm();
  assert.equal(dispatched.type, "amanafarm-login-required");
  assert.equal(page.showForm, false);
  assert.equal(calls.length, 0);
});
test("invalid, identical-route and past departures never reach the API", () => {
  const { page, calls } = setup();
  let touched = false;
  page.publish({
    invalid: true,
    control: {
      markAllAsTouched() {
        touched = true;
      },
    },
  });
  assert.ok(touched);
  page.draft = { ...trip(), destination: "تونس" };
  page.publish(validForm());
  page.draft = trip({ departure: "2000-01-01T09:00:00" });
  page.publish(validForm());
  assert.equal(calls.length, 0);
  assert.ok(page.formError);
});
test("publishes once, displays returned trip and clears result filters", () => {
  const { page, calls } = setup();
  page.draft = trip();
  page.showForm = true;
  page.origin = "صفاقس";
  page.publish(validForm());
  assert.equal(calls.filter((c) => c[0] === "post").length, 1);
  assert.equal(page.trips[0].id, 9);
  assert.equal(page.saving, false);
  assert.equal(page.showForm, false);
  assert.equal(page.origin, "");
  assert.ok(page.notice);
});
test("failed save retains input and allows retry without reporting success", () => {
  const { page, http } = setup();
  http.post = () => throwError(() => ({ status: 500 }));
  page.showForm = true;
  page.draft = trip();
  page.publish(validForm());
  assert.equal(page.showForm, true);
  assert.equal(page.draft.origin, "تونس");
  assert.equal(page.saving, false);
  assert.ok(page.formError);
  assert.equal(page.notice, "");
});
test("load failure is recoverable and retry clears the error", () => {
  const { page, http } = setup();
  http.get = () => throwError(() => ({ status: 503 }));
  page.load();
  assert.equal(page.loading, false);
  assert.ok(page.error);
  http.get = () => of([trip()]);
  page.load();
  assert.equal(page.error, "");
  assert.equal(page.trips.length, 1);
});
test("deletion requires confirmation and updates the results after success", () => {
  const { page, calls } = setup();
  page.trips = [trip()];
  globalThis.confirm = () => false;
  page.deleteTrip(page.trips[0]);
  assert.equal(calls.length, 0);
  globalThis.confirm = () => true;
  page.deleteTrip(page.trips[0]);
  assert.equal(page.trips.length, 0);
  assert.ok(calls.some((c) => c[0] === "delete"));
});
test("contact URLs retain the correct Tunisian number and encoded route", () => {
  const { page } = setup();
  assert.equal(page.phone(trip({ contactPhone: "22 123 456" })), "22123456");
  const url = new URL(page.whatsapp(trip()));
  assert.equal(url.pathname, "/21622123456");
  assert.ok(url.searchParams.get("text").includes("تونس"));
});
