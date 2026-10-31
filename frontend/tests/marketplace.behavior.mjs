import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSource } from "./load-source.mjs";
const { StateService } = await loadSource(
  "../src/app/services/state.service.ts",
);
const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) || null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
};
globalThis.window = { requestIdleCallback: () => 0 };
const initialFetch = globalThis.fetch;
async function withFetch(fetcher, run) {
  globalThis.fetch = fetcher;
  try {
    await run();
  } finally {
    globalThis.fetch = initialFetch;
    stored.clear();
  }
}

test("shows loading until marketplace requests settle, then displays real data", async () => {
  let resolveAnimals;
  await withFetch(
    (url) =>
      url.endsWith("/animals")
        ? new Promise((resolve) => {
            resolveAnimals = resolve;
          })
        : Promise.resolve({ ok: true, json: async () => [] }),
    async () => {
      const state = new StateService();
      const pending = state.retryMarketplace();
      assert.equal(state.marketLoading(), true);
      resolveAnimals({
        ok: true,
        json: async () => [{ id: 1, title: "غنم", price: 500, wilaya: "تونس" }],
      });
      await pending;
      assert.equal(state.marketLoading(), false);
      assert.equal(state.marketLoadError(), false);
      assert.equal(state.animals()[0].name, "غنم");
    },
  );
});
test("distinguishes an empty marketplace from a connection failure", async () => {
  await withFetch(
    async () => ({ ok: true, json: async () => [] }),
    async () => {
      const state = new StateService();
      await state.retryMarketplace();
      assert.equal(state.marketLoadError(), false);
      assert.equal(state.animals().length, 0);
    },
  );
  await withFetch(
    async () => {
      throw new Error("offline");
    },
    async () => {
      const state = new StateService();
      await state.retryMarketplace();
      assert.equal(state.marketLoading(), false);
      assert.equal(state.marketLoadError(), true);
    },
  );
});
test("retains cached offers and reports a partial data failure", async () => {
  stored.set(
    "af_animals_cache",
    JSON.stringify([{ id: 3, name: "إعلان محفوظ", price: 100 }]),
  );
  await withFetch(
    async (url) =>
      url.endsWith("/animals")
        ? { ok: false }
        : { ok: true, json: async () => [] },
    async () => {
      const state = new StateService();
      await state.retryMarketplace();
      assert.equal(state.marketLoadError(), true);
      assert.equal(state.animals()[0].name, "إعلان محفوظ");
    },
  );
});
test("a successful retry clears the failure and replaces product results", async () => {
  await withFetch(
    async () => ({ ok: false }),
    async () => {
      const state = new StateService();
      await state.retryMarketplace();
      assert.equal(state.marketLoadError(), true);
      globalThis.fetch = async (url) => ({
        ok: true,
        json: async () =>
          url.endsWith("/products")
            ? [{ id: 2, title: "علف", price: 30, imageUrl: "assets/feed.jpg" }]
            : [],
      });
      await state.retryMarketplace();
      assert.equal(state.marketLoadError(), false);
      assert.equal(state.marketLoading(), false);
      assert.equal(state.products()[0].title, "علف");
    },
  );
});
