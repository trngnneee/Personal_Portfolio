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

  return (
    <>
      <Element id="home" className="container mx-auto mt-[150px] h-dvh px-[50px]">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="relative order-0 lg:order-1">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-400 via-blue-500 to-purple-500 blur-2xl opacity-30 animate-pulse"></div>
            <Atropos
              className="my-atropos w-[250px] lg:w-[350px] h-[250px] lg:h-[350px] overflow-hidden rounded-full border-[3px] border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-700"
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
          <div className="w-[800px]">
            <div className="relative min-h-[60px] mb-[5px] lg:mb-[30px]" data-aos="fade-up" data-aos-delay="300">
              <span className="invisible absolute font-extrabold text-[70px]">
                I'm Dang Truong Nguyen 💻
              </span>
              <span ref={el} className="font-extrabold text-white text-[30px] lg:text-[50px]"></span>
            </div>
            <div className="text-[#CECECE] mb-[50px] text-[20px] lg:text-[30px] font-semibold" data-aos="fade-up" data-aos-delay="500">Frontend Developer | Backend Developer</div>
            <div className="text-[#CECECE] mb-[10px] text-sm" data-aos="fade-up" data-aos-delay="800">I’m interested in building a web application as a way to deepen my understanding of both front-end and back-end development, improve my problem-solving skills, and gain practical experience with real-world web technologies.</div>
            <div className="text-[#CECECE] mb-[100px] text-sm" data-aos="fade-up" data-aos-delay="800">Aside from coding, I enjoy playing football and badminton, and sometimes I unwind with video games. I’m also a coffee enthusiast ☕ — nothing fuels my creativity quite like a good cup of coffee. As I continue to learn and grow, I’m working toward becoming a skilled software engineer.</div>
            <div className="flex items-center gap-[20px] mb-[20px]" data-aos="fade-up" data-aos-delay="800">
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
                <span className="font-semibold tracking-wide">Download My CV</span>
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