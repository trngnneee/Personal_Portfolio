import { describe, expect, it } from "vitest";
import { buildNav, isActive } from "@/components/layout/nav";
import { runCommand } from "@/features/skills/terminal";
import { cld, cldSrcSet } from "@/lib/cloudinary";
import { site } from "./fixtures";

describe("cld", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/v1/portfolio/seed/tn.jpg";

  it("inserts f_auto,q_auto and size after /upload/", () => {
    expect(cld(url, { w: 640 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640,c_limit/v1/portfolio/seed/tn.jpg",
    );
    expect(cld(url, { w: 400, h: 400 })).toContain("w_400,h_400,c_fill");
  });

  it("leaves non-Cloudinary URLs untouched and gives no srcset", () => {
    const local = "http://localhost:4000/seed-assets/tn.jpg";
    expect(cld(local, { w: 640 })).toBe(local);
    expect(cldSrcSet(local, [320, 640])).toBeUndefined();
  });

  it("builds a width-descriptor srcset", () => {
    expect(cldSrcSet(url, [320, 640])).toMatch(/w_320[^ ]* 320w, .*w_640[^ ]* 640w$/);
  });
});

describe("nav", () => {
  it("is built from enabled sections, one entry per route", () => {
    const nav = buildNav(site(["blog", "activities"]).sections);
    expect(nav.map((n) => n.to)).toEqual(["/", "/about", "/skills", "/projects", "/contact"]);
  });

  it("falls back to the next /about section label when about is off", () => {
    const nav = buildNav(site(["about"]).sections);
    expect(nav.find((n) => n.to === "/about")?.label).toBe("Experience");
  });

  it("matches prefixes on a / boundary only", () => {
    expect(isActive("/blog/hello", "/blog")).toBe(true);
    expect(isActive("/blogroll", "/blog")).toBe(false);
    expect(isActive("/about", "/")).toBe(false);
  });
});

describe("skills terminal", () => {
  const { skills, profile } = site();

  it("lists categories and their skills", () => {
    expect(runCommand("ls", skills, profile)).toEqual([
      "languages/        1 items",
      "cloud_devops/     1 items",
    ]);
    expect(runCommand("cat cloud_devops/", skills, profile)).toEqual([
      "• Kubernetes            ████████ 80%",
    ]);
  });

  it("handles unknown input", () => {
    expect(runCommand("rm -rf /", skills, profile)).toEqual([
      "rm: command not found — type 'help'",
    ]);
    expect(runCommand("cat nope", skills, profile)).toEqual([
      "cat: nope: No such file or directory",
    ]);
    expect(runCommand("clear", skills, profile)).toBe("clear");
    expect(runCommand("whoami", skills, profile)).toEqual([
      "Dang Truong Nguyen",
      "Backend · Cloud · DevOps Engineer",
    ]);
  });
});
