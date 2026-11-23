const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("release information shows only the latest entry and follows the selected language", () => {
  const elements = {};
  const document = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          addEventListener() {},
          replaceChildren(...children) { this.children = children; }
        };
      }
      return elements[id];
    },
    createElement() { return {}; }
  };
  const context = vm.createContext({ window: {}, document });
  for (const file of ["release-history.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  }
  vm.runInContext(`
    releaseHistory.unshift(
      { date: "2026-01-02", changes: { en: ["New change"], zh: ["新改動"] } },
      { date: "2025-12-31", changes: { en: ["Old change"], zh: ["舊改動"] } }
    );
    renderReleaseInfo("en");
  `, context);

  assert.equal(elements.lastUpdated.textContent, "Last updated: 2 January 2026");
  assert.equal(elements.latestChangesTitle.textContent, "Latest changes");
  assert.deepEqual(Array.from(elements.latestChanges.children, item => item.textContent), ["New change"]);

  vm.runInContext('renderReleaseInfo("zh")', context);
  assert.match(elements.lastUpdated.textContent, /^最後更新: .*2026/);
  assert.equal(elements.latestChangesTitle.textContent, "最新改動");
  assert.deepEqual(Array.from(elements.latestChanges.children, item => item.textContent), ["新改動"]);
});
