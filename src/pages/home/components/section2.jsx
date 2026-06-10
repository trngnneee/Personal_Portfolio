import { Element } from "react-scroll"
import { ProjectItem } from "./project-item"
import { GrayButton } from "../../../components/gray-button"
import { useNavigate } from "react-router-dom"
import { Title } from "../../../components/title"

export const Section2 = () => {
  const data = [
    {
      projectName: "Task Management System with AWS Serverless Architecture",
      desc: "A scalable serverless task management platform built using AWS Lambda, API Gateway, DynamoDB, S3, and CloudFront. Implemented IAM roles, VPC configurations, secured API architecture, and configured CloudWatch monitoring and AWS Budgets for cost control.",
      githubLink: "https://github.com/trngnneee",
      demoLink: "",
      image: "/serverless_task_dashboard.png",
      role: "Cloud DevOps Engineer",
      techStack: [
        "AWS Lambda", "API Gateway", "DynamoDB", "S3", "CloudFront", "IAM", "VPC", "CloudWatch"
      ]
    },
    {
      projectName: "Retail Analytics & Demand Forecasting Platform — DataStorm 2025 (Encouragement Prize)",
      desc: "A full-stack analytics platform for FMCG demand forecasting. Built RESTful APIs with FastAPI and PostgreSQL, optimized API performance using Redis caching, integrated LLM-powered recommendations using Google Gemini, and deployed services on AWS EC2, Render, and Vercel.",
      githubLink: "https://github.com/trngnneee/Datastorm",
      demoLink: "https://datastorm-frontend.vercel.app/",
      image: "https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743522/Screenshot_2026-01-18_203707_xvt4jm.png",
      role: "Full-Stack Developer",
      techStack: [
        "Next.js", "Tailwind CSS", "shadcn/ui", "FastAPI", "PostgreSQL", "Redis", "Google Gemini", "AWS EC2", "Render", "Vercel"
      ]
    },
    {
      projectName: "AQI Forecasting Platform — NASA Space Apps Challenge 2025 (Top 11 HCMC)",
      desc: "An air quality monitoring and forecasting platform. Integrated satellite and environmental datasets, built geospatial visualization UI and forecasting pipelines, and applied LSTM models for AQI prediction.",
      githubLink: "https://github.com/DanielNguyen-05/AirForce",
      demoLink: "https://airforceclient.vercel.app",
      image: "airforce.png",
      role: "Frontend Developer",
      techStack: [
        "React", "Tailwind CSS", "Node.js", "Express.js", "Flask", "LSTM", "Geospatial UI"
      ]
    },
    {
      projectName: "5Pets",
      desc: "An ultimate platform for pet lovers to connect, share, and find their perfect furry companions.",
      githubLink: "https://github.com/trngnneee/5Pets",
      demoLink: "",
      image: "https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743874/Screenshot_2025-12-29_105140_e8iybr.png",
      role: "End-to-end Developer",
      techStack: [
        "NextJs", "TailwindCSS", "shadcn ui", "FlaskAPI", "MongoDB", "Cloudinary", "RAG", "Gemini AI", "Momo", "ZaloPay"
      ]
    },
    {
      projectName: "MusicApp",
      desc: "The ultimate platform to discover, stream, and personalize your music effortlessly.",
      githubLink: "https://github.com/trngnneee/MusicApp",
      demoLink: "https://musicapp.io.vn",
      image: "https://res.cloudinary.com/dnqinxiwo/image/upload/v1759441969/songs/1759441967325-49359A08-7639-434B-8F29-1EA4E4DE1065.jpeg.jpg",
      role: "End-to-end Developer",
      techStack: [
        "NextJs", "TailwindCSS", "NodeJs", "ExpressJs", "MongoDB", "Cloudinary"
      ]
    },
    {
      projectName: "Clone of Super Mario Bros",
      desc: "A modern remake of Super Mario Bros, blending nostalgia with cutting-edge technology.",
      githubLink: "https://github.com/trngnneee/MarioGame",
      image: "/mario.jpg",
      role: "End-to-end Developer",
      techStack: [
        "C++", "SFML", "OOP"
      ]
    },
  ];

  const navigate = useNavigate();

  return (
    <Element id="project" className="container mx-auto px-5 md:px-[95px] mb-[30px] sm:mb-[100px]">
      <div className="flex flex-col items-center pt-[50px]">
        <Title
          title={"My Project 🚀"}
          subTitle={"From concept to launch — here’s how I solve real problems through design, code, and creativity."}
        />

        <div className="flex flex-col gap-[70px]">
          {data.map((item, index) => (
            <ProjectItem
              key={index}
              item={item}
              order={index}
            />
          ))}
        </div>
      </div>
    </Element>
  )
}