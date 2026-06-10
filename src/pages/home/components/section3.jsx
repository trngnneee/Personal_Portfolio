import { Element } from "react-scroll";
import { FaGraduationCap } from "react-icons/fa";
import { BsBriefcaseFill } from "react-icons/bs";
import { LuCalendar } from "react-icons/lu";
import { FaMedal } from "react-icons/fa6";
import { HiUserGroup } from "react-icons/hi2";
import { Title } from "../../../components/title";

import { useState } from "react";

export const Section3 = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const educationData = [
    {
      year: "2022",
      title: "2nd Prize — Lam Dong Provincial Excellent Student Competition (Physics)",
      school: "Lam Dong Department of Education and Training",
      icon: <FaMedal className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#C0C0C0",
      desc: "Won the second prize in the Provincial Excellent Student Competition in Physics during high school."
    },
    {
      year: "2022-2023",
      title: "IELTS 6.5",
      school: "IDP IELTS Viet Nam",
      icon: <FaGraduationCap className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#3F8E00",
      image: "/ielts.jpg",
      desc: "I achieved an overall band score of 6.5, demonstrating a solid command of the English language."
    },
    {
      year: "2023",
      title: "1st Prize — Lam Dong Provincial Excellent Student Competition (Physics)",
      school: "Lam Dong Department of Education and Training",
      icon: <FaMedal className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#FFD700",
      desc: "Won the first prize in the Provincial Excellent Student Competition in Physics, representing Da Lat High School for the Gifted."
    },
    {
      year: "2023-2024",
      title: "Higher Secondary School Graduation - GPA 9.23/10.0",
      school: "Da Lat High School for the Gifted",
      icon: <FaGraduationCap className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#3F8E00",
      image: "/degree.JPG",
      desc: "Graduated with excellent academic performance from a highly competitive high school."
    },
    {
      year: "2023",
      title: "University's Study Encouragement Scholarship – Semester 2",
      school: "University of Science - Viet Nam National University (HCMUS)",
      icon: <FaMedal className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#FFD700",
      image: "hbkk.png",
      desc: "Awarded for being among the top students with outstanding academic results in the semester."
    },
    {
      year: "2025",
      title: "Top 11 — NASA Space Apps Challenge 2025 (Ho Chi Minh City)",
      school: "NASA Space Apps Challenge",
      icon: <HiUserGroup className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#E11D48",
      image: "/vng.jpg",
      desc: "Collaborated with a team to build an AQI monitoring and forecasting platform using satellite and environmental datasets, reaching the Top 11 finalists in Ho Chi Minh City."
    },
    {
      year: "2025",
      title: "Encouragement Prize — Vietnam Datathon DataStorm 2025",
      school: "DataStorm 2025",
      icon: <HiUserGroup className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#E11D48",
      image: "/datastorm.JPG",
      desc: "Developed a full-stack retail analytics and demand forecasting platform, securing the Encouragement Prize overall."
    },
    {
      year: "2025",
      title: "AWS Certified Solutions Architect – Associate (SAA-C03) with a score of 763/1000",
      school: "Amazon Web Services (AWS)",
      icon: <FaMedal className="text-[14px] sm:text-[18px] md:text-[22px]" />,
      color: "#FF9900",
      desc: "Earned the AWS Certified Solutions Architect – Associate certification, validating expertise in designing distributed systems on AWS.",
      image: "/aws.png"
    },
  ];

  return (
    <>
      <Element id="education" className="container mx-auto px-5 md:px-[95px] mb-[30px] sm:mb-[100px] cursor-pointer">
        <div className="flex flex-col items-center pt-[50px]">
          <Title
            title={"Education & Learning Journey 🎓"}
            subTitle={"Every experience, from academic study to hands-on projects, has helped me develop not just technical skills but also the mindset of continuous improvement."}
          />

          <div className="relative w-full max-w-[900px]">
            <div className="absolute left-[24px] md:left-[50px] top-0 bottom-0 w-[3px] bg-[#CECECE]"></div>

            <div className="flex flex-col gap-10">
              {educationData.reverse().map((edu, index) => (
                <div key={index} className="relative flex items-start gap-4 md:gap-6 group" onClick={() => setActiveIndex(activeIndex === index ? null : index)}>
                  <div className="flex-1 flex flex-col bg-[#ffffff10]/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-[#2A2A2A] shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                    <div className="flex items-center gap-[14px] md:gap-[20px]">
                      <div
                        className={`min-w-[30px] h-[30px] sm:min-w-[42px] sm:h-[42px] md:min-w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-white z-10 flex-shrink-0`}
                        style={{ backgroundColor: edu.color }}
                      >
                        {edu.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[#9AA0A6] text-[12px] md:text-sm mb-2">
                          <LuCalendar className="text-[10px] sm:text-[13px] md:text-[16px]" />
                          <span>{edu.year}</span>
                        </div>
                        <div className="text-white text-[10px] sm:text-[15px] md:text-[18px] font-semibold mb-1">
                          {edu.title}
                        </div>
                        <div className="text-[#CECECE] text-[8px] sm:text-[12px] md:text-sm flex items-center gap-2">
                          🎓 {edu.school}
                        </div>
                      </div>
                    </div>

                    <div className={`grid overflow-hidden transition-all duration-700 ease-in-out delay-300 md:delay-500 ${
                      activeIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    } group-hover:grid-rows-[1fr] group-hover:opacity-100`}>
                      <div className="min-h-0">
                        <div className="mt-4 pt-4 border-t border-[#ffffff20]">
                          {edu.image && (
                            <img src={edu.image} alt={edu.title} className="w-full h-full object-cover rounded-xl mb-3 shadow-md" />
                          )}
                          {edu.desc && (
                            <p className="text-[#CECECE]/80 text-[10px] sm:text-[12px] md:text-sm leading-relaxed">
                              {edu.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Element>
    </>
  );
}