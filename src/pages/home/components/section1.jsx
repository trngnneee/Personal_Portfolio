import { useEffect, useRef, useState } from "react";
import { Element } from "react-scroll";
import Typed from 'typed.js';
import { LuDownload } from "react-icons/lu";
import { GrayButton } from "../../../components/gray-button";
import { GreenButton } from "../../../components/green-button";
import Atropos from 'atropos/react';

export const Section1 = () => {
  const el = useRef(null);

  useEffect(() => {
    if (!el.current) return;

    const typed = new Typed(el.current, {
      strings: [
        "Hey there! 👋",
        "I'm Dang Truong Nguyen 💻"
      ],
      typeSpeed: 50,
      backSpeed: 50,
      loop: true
    });

    return () => {
      typed.destroy();
    };
  }, []);

  const techStacks = {
    "Languages": ["C++", "JavaScript", "TypeScript", "Python", "SQL"],
    "Frontend": ["React", "Next.js", "Tailwind CSS", "HTML5", "CSS3", "Sass"],
    "Backend & APIs": ["Node.js", "Express.js", "FastAPI", "Flask"],
    "Databases": ["MongoDB", "PostgreSQL", "MySQL", "Redis"],
    "Cloud & DevOps": ["AWS (SAA-C03)", "Docker", "Jenkins", "GitHub Actions"]
  }

  return (
    <>
      <Element id="home" className="container mx-auto mt-[90px] md:mt-[150px] min-h-dvh px-5 md:px-[50px]">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-0">
          <div className="relative order-1 lg:order-2">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-400 via-blue-500 to-purple-500 blur-2xl opacity-30 animate-pulse"></div>
            <Atropos
              className="my-atropos w-[220px] sm:w-[260px] lg:w-[350px] h-[220px] sm:h-[260px] lg:h-[350px] overflow-hidden rounded-full border-[3px] border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-700"
              data-aos="zoom-in-up"
              data-aos-delay="200"
              activeOffset={40}
              shadow={true}
              highlight={true}
              rotateXMax={20}
              rotateYMax={20}
              duration={300}
            >
              <img
                src="/tn.jpg"
                alt="Dang Truong Nguyen"
                className="w-full h-full object-cover aspect-square transition-transform duration-500"
                data-atropos-offset="-5"
              />
            </Atropos>
          </div>
          <div className="order-2 lg:order-1 w-full lg:max-w-[800px]">
            <div className="relative min-h-[60px] mb-[5px] lg:mb-[30px]" data-aos="fade-up" data-aos-delay="300">
              <span className="invisible absolute font-extrabold text-[70px]">
                I'm Dang Truong Nguyen 💻
              </span>
              <span ref={el} className="font-extrabold text-white text-[20px] sm:text-[28px] sm:text-[34px] lg:text-[50px]"></span>
            </div>
            <div className="text-[#CECECE] mb-[20px] text-[14px] sm:text-[22px] lg:text-[30px] font-semibold" data-aos="fade-up" data-aos-delay="500">Software Engineering Student | Backend & Cloud DevOps</div>
            <div className="text-[#CECECE] mb-[30px] lg:mb-[50px] text-[10px] sm:text-sm" data-aos="fade-up" data-aos-delay="800">
              Information Technology student majoring in Software Engineering at VNU - University of Science, Ho Chi Minh City. AWS Certified Solutions Architect – Associate (SAA-C03) with a GPA of 8.92/10 and IELTS 6.5. Interested in Backend Engineering, Cloud Architecture, DevOps, and AI-powered Applications. Currently learning advanced System Design, AWS Cloud, and CI/CD.
            </div>
            {/* <div className="text-[#CECECE] mb-[20px] text-sm" data-aos="fade-up" data-aos-delay="800">Aside from coding, I enjoy playing football and badminton, and sometimes I unwind with video games. I’m also a coffee enthusiast ☕ — nothing fuels my creativity quite like a good cup of coffee. As I continue to learn and grow, I’m working toward becoming a skilled software engineer.</div> */}
            <div className="mb-[20px]" data-aos="fade-up" data-aos-delay="1000">
              <h3 className="text-white text-[16px] sm:text-[24px] lg:text-[30px] font-semibold mb-3">Technologies I work with:</h3>
              <div className="space-y-2">
                {Object.entries(techStacks).map(([category, stacks]) => (
                  <div key={category} className="flex flex-wrap gap-1">
                    <div className="text-white text-[10px] sm:text-sm font-light">{category}:</div>
                    {stacks.map((stack, index) => (
                      <>
                        <span
                          key={`${index}`}
                          className={`bg-[#ffffff10]/80 cursor-pointer text-white px-2 sm:px-4 py-1 rounded-xl text-[7px] sm:text-[10px] font-medium transition-all duration-300 shadow-md hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:scale-105`}
                        >{stack}</span>
                      </>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-[12px] md:gap-[20px] mb-[20px]" data-aos="fade-up" data-aos-delay="800">
              <GreenButton
                title={"View Project"}
                scrollTo={"project"}
              />
              <GrayButton
                title={"Contact me"}
                scrollTo={"contact"}
              />
              <a
                className="flex items-center gap-2 text-white bg-[#3F3F3F]/80 hover:bg-[#3F3F3F] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                href="/cv.pdf"
                download
              >
                <LuDownload className="text-[18px]" />
                <span className="font-semibold tracking-wide text-sm sm:text-[16px]">Download My CV</span>
              </a>
            </div>

            <div>

            </div>
          </div>
        </div>
      </Element>
    </>
  );
}