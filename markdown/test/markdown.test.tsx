import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { extractToc, Markdown } from "../src";

describe("Markdown", () => {
  it("renders multi-line fenced code as one highlighted block", () => {
    const { container } = render(
      <Markdown>{"```ts\nconst a = 1;\nconst b = 2;\nconst c = 3;\n```"}</Markdown>,
    );
    const pres = container.querySelectorAll("pre");
    expect(pres).toHaveLength(1);
    expect(pres[0]!.textContent).toBe("const a = 1;\nconst b = 2;\nconst c = 3;\n");
    expect(container.querySelector("code.hljs.language-ts")).not.toBeNull();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders GFM tables and heading ids matching the TOC", () => {
    const md = "## Setup & Run\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n## Setup & Run";
    const { container } = render(<Markdown>{md}</Markdown>);
    expect(container.querySelector("table td")?.textContent).toBe("1");
    const ids = [...container.querySelectorAll("h2")].map((h) => h.id);
    expect(ids).toEqual(extractToc(md).map((t) => t.id));
    expect(ids).toEqual(["setup--run", "setup--run-1"]);
  });

  it("strips raw HTML, scripts and javascript: URLs", () => {
    const md = [
      "<script>alert(1)</script>",
      '<img src=x onerror="alert(1)">',
      "[click](javascript:alert(1))",
      "![x](javascript:alert(2))",
      '<a href="https://ok.example" onclick="alert(3)">ok</a>',
    ].join("\n\n");
    const { container } = render(<Markdown>{md}</Markdown>);
    const html = container.innerHTML;
    expect(container.querySelector("script")).toBeNull();
    expect(html).not.toMatch(/onerror|onclick|javascript:/i);
  });

  it("opens external links safely", () => {
    const { container } = render(
      <Markdown>{"[site](https://example.com) [local](/about)"}</Markdown>,
    );
    const [ext, local] = container.querySelectorAll("a");
    expect(ext!.getAttribute("rel")).toBe("noopener noreferrer");
    expect(ext!.getAttribute("target")).toBe("_blank");
    expect(local!.getAttribute("target")).toBeNull();
  });

  it("shows mermaid source until the diagram renders", () => {
    const { container } = render(<Markdown>{"```mermaid\nflowchart LR\n  A --> B\n```"}</Markdown>);
    expect(container.querySelector(".md-mermaid-source")?.textContent).toContain("A --> B");
  });
});

describe("extractToc", () => {
  it("ignores headings inside code fences and strips inline markup", () => {
    const md =
      "# Title\n## `Install` the [CLI](x)\n```sh\n## not a heading\n```\n### Deep\n#### Deeper";
    expect(extractToc(md)).toEqual([
      { depth: 2, text: "Install the CLI", id: "install-the-cli" },
      { depth: 3, text: "Deep", id: "deep" },
    ]);
  });
});
