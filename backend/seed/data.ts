/**
 * Seed content recovered from the old site (git HEAD before the rebuild, PROMPT.md Appendix A).
 * Media are referenced by `key`; seed.ts resolves keys to media ids.
 */
import type {
  AchievementInput,
  ActivityInput,
  ExperienceInput,
  ProfileInput,
  ProjectInput,
  SkillInput,
  SocialLinkInput,
} from "@portfolio/shared";

export interface SeedMedia {
  key: string;
  /** File in seed/assets/ … */
  file?: string;
  /** … or a remote URL (old Cloudinary assets). */
  remoteUrl?: string;
  alt: string;
  folder: string;
}

export type SeedProject = Omit<ProjectInput, "coverMediaId"> & { coverKey?: string };
export type SeedAchievement = Omit<AchievementInput, "mediaId"> & { mediaKey?: string };
export type SeedActivity = ActivityInput & { imageKeys: string[] };
export type SeedProfile = Omit<ProfileInput, "avatarMediaId" | "cvMediaId"> & {
  avatarKey: string;
  cvKey: string;
};

export const media: SeedMedia[] = [
  { key: "tn", file: "tn.jpg", alt: "Portrait of Dang Truong Nguyen", folder: "profile" },
  { key: "cv", file: "cv.pdf", alt: "Curriculum vitae — Dang Truong Nguyen", folder: "profile" },
  {
    key: "aws_serverless",
    file: "aws_serverless.png",
    alt: "AWS serverless task management architecture",
    folder: "projects",
  },
  {
    key: "datastorm_cover",
    remoteUrl:
      "https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743522/Screenshot_2026-01-18_203707_xvt4jm.png",
    alt: "Retail analytics dashboard screenshot",
    folder: "projects",
  },
  {
    key: "airforce",
    file: "airforce.png",
    alt: "AirForce AQI forecasting map interface",
    folder: "projects",
  },
  {
    key: "5pets_cover",
    remoteUrl:
      "https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743874/Screenshot_2025-12-29_105140_e8iybr.png",
    alt: "5Pets home page screenshot",
    folder: "projects",
  },
  {
    key: "musicapp_cover",
    remoteUrl:
      "https://res.cloudinary.com/dnqinxiwo/image/upload/v1759441969/songs/1759441967325-49359A08-7639-434B-8F29-1EA4E4DE1065.jpeg.jpg",
    alt: "MusicApp player screenshot",
    folder: "projects",
  },
  { key: "mario", file: "mario.jpg", alt: "Super Mario Bros clone gameplay", folder: "projects" },
  {
    key: "aws",
    file: "aws.png",
    alt: "AWS Certified Solutions Architect – Associate badge",
    folder: "achievements",
  },
  {
    key: "datastorm",
    file: "datastorm.JPG",
    alt: "DataStorm 2025 award ceremony",
    folder: "achievements",
  },
  {
    key: "vng",
    file: "vng.jpg",
    alt: "NASA Space Apps Challenge 2025 Ho Chi Minh City finalists",
    folder: "achievements",
  },
  {
    key: "hbkk",
    file: "hbkk.png",
    alt: "HCMUS study encouragement scholarship certificate",
    folder: "achievements",
  },
  { key: "degree", file: "degree.JPG", alt: "High school graduation", folder: "achievements" },
  { key: "ielts", file: "ielts.jpg", alt: "IELTS test report form", folder: "achievements" },
  {
    key: "bcyt_1",
    file: "BCYT.JPG",
    alt: "Buoc Chan Yeu Thuong 2026 volunteers with students",
    folder: "activities",
  },
  {
    key: "bcyt_2",
    file: "BCYT2026-1037.JPG",
    alt: "Buoc Chan Yeu Thuong 2026 group photo",
    folder: "activities",
  },
  {
    key: "bentre_1",
    file: "BenTre.jpg",
    alt: "Buoc Chan Yeu Thuong 2025 in Ben Tre",
    folder: "activities",
  },
  {
    key: "bentre_2",
    file: "BenTre2.jpg",
    alt: "Buoc Chan Yeu Thuong 2025 activities with students",
    folder: "activities",
  },
  // Not referenced yet — uploaded to the library for later use.
  {
    key: "serverless_task_dashboard",
    file: "serverless_task_dashboard.png",
    alt: "Serverless task dashboard",
    folder: "library",
  },
  {
    key: "touristbooking",
    file: "touristbooking.png",
    alt: "Tourist booking app screenshot",
    folder: "library",
  },
];

export const profile: SeedProfile = {
  fullName: "Dang Truong Nguyen",
  handle: "trngnneee",
  headline: "Backend · Cloud · DevOps Engineer",
  typewriterLines: ["Hey there! 👋", "I'm Dang Truong Nguyen 💻"],
  bio:
    "Information Technology student majoring in Software Engineering at VNU - University of Science, Ho Chi Minh City. " +
    "AWS Certified Solutions Architect – Associate (SAA-C03) with a GPA of 8.92/10 and IELTS 6.5. " +
    "Interested in Backend Engineering, Cloud Architecture, DevOps, and AI-powered Applications. " +
    "Currently learning advanced System Design, AWS Cloud, and CI/CD.",
  location: "Ho Chi Minh City, Vietnam",
  email: "dtn06052005@gmail.com",
  phone: "0911398029",
  showPhone: true,
  openToWork: false,
  avatarKey: "tn",
  cvKey: "cv",
};

export const socialLinks: SocialLinkInput[] = [
  {
    platform: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/nguy%C3%AAn-tr%C6%B0%E1%BB%9Dng-8a075934b/",
  },
  { platform: "github", label: "GitHub", url: "https://github.com/trngnneee" },
  { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/trngn.neee" },
  { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/trngn.neee/" },
];

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";
export const devicon = (name: string, variant = "original") =>
  `${DEVICON}/${name}/${name}-${variant}.svg`;

export const skills: SkillInput[] = [
  { name: "C++", category: "languages", iconUrl: devicon("cplusplus") },
  { name: "JavaScript", category: "languages", iconUrl: devicon("javascript") },
  { name: "TypeScript", category: "languages", iconUrl: devicon("typescript") },
  { name: "Python", category: "languages", iconUrl: devicon("python") },
  { name: "SQL", category: "languages", iconUrl: devicon("azuresqldatabase") },
  { name: "React", category: "frontend", iconUrl: devicon("react") },
  { name: "Next.js", category: "frontend", iconUrl: devicon("nextjs") },
  { name: "Tailwind CSS", category: "frontend", iconUrl: devicon("tailwindcss") },
  { name: "HTML5", category: "frontend", iconUrl: devicon("html5") },
  { name: "CSS3", category: "frontend", iconUrl: devicon("css3") },
  { name: "Sass", category: "frontend", iconUrl: devicon("sass") },
  { name: "Node.js", category: "backend", iconUrl: devicon("nodejs") },
  { name: "Express.js", category: "backend", iconUrl: devicon("express") },
  { name: "FastAPI", category: "backend", iconUrl: devicon("fastapi") },
  { name: "Flask", category: "backend", iconUrl: devicon("flask") },
  { name: "MongoDB", category: "database", iconUrl: devicon("mongodb") },
  { name: "PostgreSQL", category: "database", iconUrl: devicon("postgresql") },
  { name: "MySQL", category: "database", iconUrl: devicon("mysql") },
  { name: "Redis", category: "database", iconUrl: devicon("redis") },
  {
    name: "AWS (SAA-C03)",
    category: "cloud_devops",
    iconUrl: devicon("amazonwebservices", "original-wordmark"),
  },
  { name: "Docker", category: "cloud_devops", iconUrl: devicon("docker") },
  { name: "Jenkins", category: "cloud_devops", iconUrl: devicon("jenkins") },
  { name: "GitHub Actions", category: "cloud_devops", iconUrl: devicon("githubactions") },
]; // level stays null

export const projects: SeedProject[] = [
  {
    slug: "aws-serverless-task-management",
    title: "Task Management System with AWS Serverless Architecture",
    summary:
      "A scalable serverless task management platform built using AWS Lambda, API Gateway, DynamoDB, S3, and CloudFront. Implemented IAM roles, VPC configurations, secured API architecture, and configured CloudWatch monitoring and AWS Budgets for cost control.",
    category: "cloud",
    role: "Cloud Engineer, Solution Architect",
    techStack: [
      "AWS Lambda",
      "API Gateway",
      "DynamoDB",
      "S3",
      "CloudFront",
      "IAM",
      "VPC",
      "CloudWatch",
    ],
    repoUrl: "https://github.com/trngnneee/AWS_Serverless_Application",
    repoVisibility: "public",
    demoUrl: "https://d14g6okcs1rawz.cloudfront.net/index.html",
    coverKey: "aws_serverless",
    featured: true,
  },
  {
    slug: "datastorm-retail-analytics",
    title: "Retail Analytics & Demand Forecasting Platform",
    subtitle: "DataStorm 2025 — Encouragement Prize",
    summary:
      "A full-stack analytics platform for FMCG demand forecasting. Built RESTful APIs with FastAPI and PostgreSQL, optimized API performance using Redis caching, integrated LLM-powered recommendations using Google Gemini, and deployed services on AWS EC2, Render, and Vercel.",
    category: "fullstack",
    role: "Full-Stack Developer",
    techStack: [
      "Next.js",
      "Tailwind CSS",
      "shadcn/ui",
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "Google Gemini",
      "AWS EC2",
      "Render",
      "Vercel",
    ],
    repoUrl: "https://github.com/trngnneee/Datastorm",
    repoVisibility: "public",
    demoUrl: "https://datastorm-frontend.vercel.app/",
    coverKey: "datastorm_cover",
    featured: true,
  },
  {
    slug: "airforce-aqi-forecasting",
    title: "AQI Forecasting Platform",
    subtitle: "NASA Space Apps Challenge 2025 — Top 11 HCMC",
    summary:
      "An air quality monitoring and forecasting platform. Integrated satellite and environmental datasets, built geospatial visualization UI and forecasting pipelines, and applied LSTM models for AQI prediction.",
    category: "ai",
    role: "Frontend Developer",
    techStack: ["React", "Tailwind CSS", "Node.js", "Express.js", "Flask", "LSTM", "Geospatial UI"],
    repoUrl: "https://github.com/DanielNguyen-05/AirForce",
    repoVisibility: "public",
    demoUrl: "https://airforceclient.vercel.app",
    coverKey: "airforce",
    featured: true,
  },
  {
    slug: "5pets",
    title: "5Pets",
    summary:
      "An ultimate platform for pet lovers to connect, share, and find their perfect furry companions.",
    category: "fullstack",
    role: "End-to-end Developer",
    techStack: [
      "Next.js",
      "Tailwind CSS",
      "shadcn/ui",
      "Flask",
      "MongoDB",
      "Cloudinary",
      "RAG",
      "Gemini AI",
      "MoMo",
      "ZaloPay",
    ],
    repoUrl: "https://github.com/trngnneee/5Pets",
    repoVisibility: "public",
    coverKey: "5pets_cover",
  },
  {
    slug: "musicapp",
    title: "MusicApp",
    summary: "The ultimate platform to discover, stream, and personalize your music effortlessly.",
    category: "fullstack",
    role: "End-to-end Developer",
    techStack: ["Next.js", "Tailwind CSS", "Node.js", "Express.js", "MongoDB", "Cloudinary"],
    repoUrl: "https://github.com/trngnneee/MusicApp",
    repoVisibility: "public",
    demoUrl: "https://musicapp.io.vn",
    coverKey: "musicapp_cover",
  },
  {
    slug: "super-mario-bros-clone",
    title: "Clone of Super Mario Bros",
    summary:
      "A modern remake of Super Mario Bros, blending nostalgia with cutting-edge technology.",
    category: "game",
    role: "End-to-end Developer",
    techStack: ["C++", "SFML", "OOP"],
    repoUrl: "https://github.com/trngnneee/MarioGame",
    repoVisibility: "public",
    coverKey: "mario",
  },
];

export const experiences: ExperienceInput[] = [
  {
    company: "NewEra Inc",
    position: "Fresher DevOps",
    employmentType: "full_time",
    location: null,
    startDate: "2026-07",
    endDate: null,
    description: "",
    highlights: [],
    // From LinkedIn ("+2 skills" not listed there yet).
    techStack: ["Google Cloud Platform (GCP)", "System Deployment"],
  },
];

export const achievements: SeedAchievement[] = [
  {
    type: "certification",
    periodLabel: "2025",
    title: "AWS Certified Solutions Architect – Associate (SAA-C03) — 763/1000",
    issuer: "Amazon Web Services (AWS)",
    accentColor: "#FF9900",
    mediaKey: "aws",
    description:
      "Earned the AWS Certified Solutions Architect – Associate certification, validating expertise in designing distributed systems on AWS.",
  },
  {
    type: "award",
    periodLabel: "2025",
    title: "Encouragement Prize — Vietnam Datathon DataStorm 2025",
    issuer: "DataStorm 2025",
    accentColor: "#E11D48",
    mediaKey: "datastorm",
    description:
      "Developed a full-stack retail analytics and demand forecasting platform, securing the Encouragement Prize overall.",
  },
  {
    type: "award",
    periodLabel: "2025",
    title: "Top 11 — NASA Space Apps Challenge 2025 (Ho Chi Minh City)",
    issuer: "NASA Space Apps Challenge",
    accentColor: "#E11D48",
    mediaKey: "vng",
    description:
      "Collaborated with a team to build an AQI monitoring and forecasting platform using satellite and environmental datasets, reaching the Top 11 finalists in Ho Chi Minh City.",
  },
  {
    type: "award",
    periodLabel: "2023",
    title: "University's Study Encouragement Scholarship – Semester 2",
    issuer: "University of Science, VNU-HCM (HCMUS)",
    accentColor: "#FFD700",
    mediaKey: "hbkk",
    description:
      "Awarded for being among the top students with outstanding academic results in the semester.",
  },
  {
    type: "education",
    periodLabel: "2023-2024",
    title: "Higher Secondary School Graduation — GPA 9.23/10.0",
    issuer: "Da Lat High School for the Gifted",
    accentColor: "#3F8E00",
    mediaKey: "degree",
    description:
      "Graduated with excellent academic performance from a highly competitive high school.",
  },
  {
    type: "certification",
    periodLabel: "2022-2023",
    title: "IELTS 6.5",
    issuer: "IDP IELTS Viet Nam",
    accentColor: "#3F8E00",
    mediaKey: "ielts",
    description:
      "I achieved an overall band score of 6.5, demonstrating a solid command of the English language.",
  },
];

const BCYT_DESCRIPTION =
  "Provide student counseling and support, organize extracurricular activities, and foster a positive school environment.";

export const activities: SeedActivity[] = [
  {
    periodLabel: "2026",
    title: "Buoc Chan Yeu Thuong 2026",
    organization: "Phu Khanh Lower Secondary School",
    location: "Ben Tre Province",
    description: BCYT_DESCRIPTION,
    imageKeys: ["bcyt_1", "bcyt_2"],
  },
  {
    periodLabel: "2025",
    title: "Buoc Chan Yeu Thuong 2025",
    organization: "Phu Khanh Lower Secondary School",
    location: "Ben Tre Province",
    description: BCYT_DESCRIPTION,
    imageKeys: ["bentre_1", "bentre_2"],
  },
];
