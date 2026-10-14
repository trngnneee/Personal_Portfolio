/**
 * Skills verified in the ../ workspace scan (see REVIEW.md). Names that clash with
 * existing seed skills are dropped by seed.ts. Unpublished until the owner approves.
 */
import type { SkillInput } from "@portfolio/shared";
import { devicon } from "../data.js";

const s = (name: string, category: SkillInput["category"], icon?: string): SkillInput => ({
  name,
  category,
  iconUrl: icon ?? null,
  published: false,
});

export const scannedSkills: SkillInput[] = [
  s("Go", "languages", devicon("go")),
  s("Model Context Protocol (MCP)", "backend"),
  s("LLM tool calling", "backend"),
  s("Kubernetes", "cloud_devops", devicon("kubernetes")),
  s("Argo CD", "cloud_devops", devicon("argocd")),
  s("Helm", "cloud_devops", devicon("helm")),
  s("Kustomize", "cloud_devops"),
  s("GitLab CI", "cloud_devops", devicon("gitlab")),
  s("Buildah", "cloud_devops"),
  s("Prometheus", "cloud_devops", devicon("prometheus")),
  s("Grafana", "cloud_devops", devicon("grafana")),
  s("Google Cloud Platform", "cloud_devops", devicon("googlecloud")),
  s("Terraform", "infrastructure", devicon("terraform")),
  s("Ansible", "infrastructure", devicon("ansible")),
  s("KVM / libvirt", "infrastructure"),
  s("Linux & systemd", "infrastructure", devicon("linux")),
  s("Calico", "infrastructure"),
  s("NetBird / WireGuard", "infrastructure"),
  s("Apache APISIX (Gateway API)", "infrastructure"),
  s("cert-manager", "infrastructure"),
  s("OpenBao", "infrastructure", devicon("vault")),
  s("External Secrets Operator", "infrastructure"),
  s("Cloudflare", "infrastructure", devicon("cloudflare")),
  s("nginx", "infrastructure", devicon("nginx")),
  s("ESP32 / PlatformIO", "other", devicon("arduino")),
  s("ffmpeg", "other"),
];
