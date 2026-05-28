import { Element } from "react-scroll"
import { ProjectItem } from "./project-item"
import { GrayButton } from "../../../components/gray-button"
import { useNavigate } from "react-router-dom"
import { Title } from "../../../components/title"

export const Section2 = () => {
  const data = [
    {
      projectName: "Sale Demand Forecasting - Dom Team - Vietnam Datathon, Data Storm 2025 (Fourth Prize)",
      desc: "A dashboard for predicting sales demand using advanced forecasting techniques.",
      githubLink: "https://github.com/trngnneee/Datastorm",
      demoLink: "https://datastorm-frontend.vercel.app/",
      image: "https://res.cloudinary.com/dnqinxiwo/image/upload/v1768743522/Screenshot_2026-01-18_203707_xvt4jm.png",
      role: "Frontend Developer - Backend Developer",
      techStack: [
        "NextJs", "TailwindCSS", "shadcn ui", "FastAPI", "PostgreSQL", "Redis", "AWS", "XGBoost"
      ]
    },
    {
      projectName: "AirForce - NASA International Space Apps Challenge (Top 10 Hackathon)",
      desc: "A web platform from the NASA International Space Apps Challenge for monitoring and forecasting air quality using real-time environmental data and predictive models.",
      githubLink: "https://github.com/DanielNguyen-05/AirForce",
      demoLink: "https://airforceclient.vercel.app",
      image: "airforce.png",
      role: "Frontend Developer",
      techStack: [
        "ReactJs", "TailwindCSS", "NodeJs", "ExpressJs", "FlaskAPI", "LSTM-Model", "TCN-Model"
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
  ]

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