import { FaAngleRight } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { AiOutlineProduct } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useState } from "react"

export const ProjectItem = ({ item, order }) => {
  const [githubHover, setGithubHover] = useState(false);
  const [demoHover, setDemoHover] = useState(false);

  const isReverse = order % 2 === 1;

  const TechItem = ({ title }) => {
    return (
      <div className="bg-[#ffffff10] w-[100px] flex justify-center items-center rounded-full text-[12px] font-bold text-[#CECECE] hover:scale-[1.1] transition-all duration-200 hover:shadow-2xl">{title}</div>
    )
  }

  return (
    <>
      <div data-aos="fade-up" className={`flex gap-[26px] items-center ${isReverse ? "flex-row-reverse" : "flex-row"}`}
      >
        <div className="w-1/2 h-[300px] overflow-hidden rounded-[5px] flex-shrink-0 hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-300">
          <img src={item.image} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="w-[200px] flex justify-center items-center bg-[#ffffff10] text-white px-3 py-[5px] rounded-full text-[14px] font-bold mb-[20px]">{item.role}</div>
          <div className="text-white main-text text-[24px] font-extrabold mb-[10px]">{item.projectName}</div>
          <div className="text-[#CECECE] text-sm mb-[10px]">{item.desc}</div>
          <div className="mb-[40px] flex items-center flex-wrap gap-[5px]">
            {item.techStack.map((tech, index) => (
              <TechItem
                key={index}
                title={tech}
              />
            ))}
          </div>
          <div className="flex items-center gap-[20px]">
            <Link
              to={item.githubLink}
              target="blank"
              className="group relative flex items-center justify-center gap-2 w-[200px] py-3 rounded-md border border-[#62BA1B] bg-[#3F8E00] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] text-white font-semibold text-[16px] cursor-pointer hover:bg-[#469a01] transition-all duration-300 shadow-md hover:scale-[1.02]"
              onMouseEnter={() => setGithubHover(true)}
              onMouseLeave={() => setGithubHover(false)}
            >
              <span><FaGithub /></span>
              <span className="transition-all duration-300">Github</span>
              <FaAngleRight
                className={`transition-all duration-300 transform ${githubHover ? "translate-x-1 opacity-100" : "translate-x-0 opacity-0"
                  }`}
              />
            </Link>
            {item.demoLink && (
              <Link
                to={item.demoLink}
                target="blank"
                className="group relative flex items-center justify-center gap-2 w-[200px] py-3 rounded-md border text-white font-semibold text-[16px] cursor-pointer hover:bg-[#ffffff10] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-300 shadow-md hover:scale-[1.02]"
                onMouseEnter={() => setDemoHover(true)}
                onMouseLeave={() => setDemoHover(false)}
              >
                <span><AiOutlineProduct /></span>
                <span className="transition-all duration-300">Product</span>
                <FaAngleRight
                  className={`transition-all duration-300 transform ${demoHover ? "translate-x-1 opacity-100" : "translate-x-0 opacity-0"
                    }`}
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}