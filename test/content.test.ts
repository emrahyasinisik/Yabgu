import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  HOST_IDS,
  TEMPLATE_IDS,
  getStartedContent,
  getStartedSection,
  hostRelPath,
  listHosts,
  listTemplates,
  readHostGuide,
  readTemplate,
  templateRelPath,
} from "../src/content.js";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("catalog integrity", () => {
  it("every template file exists on disk", () => {
    for (const id of TEMPLATE_IDS) {
      const abs = join(PKG_ROOT, templateRelPath(id));
      assert.equal(existsSync(abs), true, `missing template: ${id} → ${abs}`);
    }
  });

  it("every host guide file exists on disk", () => {
    for (const host of HOST_IDS) {
      const abs = join(PKG_ROOT, hostRelPath(host));
      assert.equal(existsSync(abs), true, `missing host guide: ${host} → ${abs}`);
    }
  });

  it("get-started source docs exist", () => {
    for (const rel of [
      "docs/how-to-write.md",
      "docs/matrix.md",
      "docs/shared-source-of-truth.md",
    ]) {
      assert.equal(existsSync(join(PKG_ROOT, rel)), true, `missing ${rel}`);
    }
  });

  it("listTemplates covers every TemplateId exactly once", () => {
    const listed = listTemplates().map((t) => t.id);
    assert.deepEqual([...listed].sort(), [...TEMPLATE_IDS].sort());
  });

  it("listHosts matches HOST_IDS", () => {
    assert.deepEqual(listHosts(), [...HOST_IDS]);
  });
});

describe("content readers", () => {
  it("readTemplate returns non-empty markdown for each id", () => {
    for (const id of TEMPLATE_IDS) {
      const text = readTemplate(id);
      assert.ok(text.trim().length > 0, `empty template: ${id}`);
    }
  });

  it("readHostGuide returns non-empty markdown for each host", () => {
    for (const host of HOST_IDS) {
      const text = readHostGuide(host);
      assert.ok(text.trim().length > 0, `empty host guide: ${host}`);
    }
  });

  it("getStartedSection index lists templates; all is larger", () => {
    const index = getStartedSection("index");
    const all = getStartedContent();
    assert.match(index, /Yabgu — Get Started/);
    assert.match(index, /`agents`/);
    assert.match(index, /`cursor`/);
    assert.ok(all.length > index.length);
  });
});
