// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { waitFor } from "../../src/injected/robot";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("waitFor", () => {
  it("resolves at once when the element is already there", async () => {
    document.body.innerHTML = '<div id="target"></div>';

    await expect(waitFor(() => document.getElementById("target"), "the target")).resolves.toBeTruthy();
  });

  it("resolves when the element shows up later", async () => {
    const found = waitFor(() => document.getElementById("target"), "the target");

    setTimeout(() => document.body.insertAdjacentHTML("beforeend", '<div id="target"></div>'), 20);

    await expect(found).resolves.toHaveProperty("id", "target");
  });

  it("rejects with a description when the element never shows up", async () => {
    await expect(waitFor(() => document.getElementById("target"), "the target", 30)).rejects.toThrow(
      "Timeout waiting for the target",
    );
  });
});
