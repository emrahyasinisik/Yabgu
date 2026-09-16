import { describe, expect, it } from "vitest";
import { Button } from "../src/components/Button.js";

describe("Button", () => {
  it("renders primary class", () => {
    expect(Button({ children: "Save" })).toContain("btn-primary");
  });
});
