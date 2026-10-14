import type { PublicProfile, PublicSkill } from "@portfolio/shared";

export interface TerminalLine {
  id: number;
  kind: "input" | "output" | "error";
  text: string;
}

const pad = (s: string, n: number) => s + " ".repeat(Math.max(1, n - s.length));

/** Pure command interpreter for the skills terminal. Returns lines to print, or "clear". */
export function runCommand(
  raw: string,
  skills: PublicSkill[],
  profile: PublicProfile | null,
): string[] | "clear" {
  const [cmd = "", ...args] = raw.trim().split(/\s+/);
  const byCategory = new Map<string, PublicSkill[]>();
  for (const s of skills) byCategory.set(s.category, [...(byCategory.get(s.category) ?? []), s]);
  const categories = [...byCategory.keys()];

  switch (cmd.toLowerCase()) {
    case "":
      return [];
    case "help":
      return [
        "Available commands:",
        `  ${pad("help", 18)}show this help`,
        `  ${pad("ls", 18)}list skill categories`,
        `  ${pad("cat <category>", 18)}list skills in a category`,
        `  ${pad("whoami", 18)}about me`,
        `  ${pad("clear", 18)}clear the screen`,
      ];
    case "ls":
      return categories.map((c) => `${pad(`${c}/`, 18)}${byCategory.get(c)!.length} items`);
    case "cat": {
      const target = (args[0] ?? "").replace(/\/$/, "").toLowerCase();
      if (!target) return ["cat: missing operand — try: cat " + (categories[0] ?? "<category>")];
      const list = byCategory.get(target);
      if (!list) return [`cat: ${target}: No such file or directory`];
      return list.map((s) =>
        s.level == null
          ? `• ${s.name}`
          : `• ${pad(s.name, 22)}${"█".repeat(Math.round(s.level / 10))} ${s.level}%`,
      );
    }
    case "whoami":
      return profile ? [profile.fullName, profile.headline] : ["guest"];
    case "clear":
      return "clear";
    default:
      return [`${cmd}: command not found — type 'help'`];
  }
}
