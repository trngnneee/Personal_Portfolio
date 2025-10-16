import { Element } from "react-scroll"
import { ProjectItem } from "./project-item"
import { GrayButton } from "../../../components/gray-button"
import { useNavigate } from "react-router-dom"
import { Title } from "../../../components/title"

export const Section2 = () => {
  const data = [
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
      projectName: "AirForce",
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
      projectName: "Tourist Booking",
      desc: "The ultimate platform for discovering unique destinations and booking your perfect trip with ease.",
      githubLink: "https://github.com/trngnneee/TouristBooking",
      demoLink: "https://touristbooking.onrender.com/",
      image: "/touristbooking.png",
      role: "End-to-end Developer",
      techStack: [
        "NodeJs", "ExpressJs", "MongoDB", "Cloudinary"
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
    <Element id="project" className="container mx-auto px-[95px] mb-[100px]">
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