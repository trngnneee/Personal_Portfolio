import { Element } from "react-scroll";
import { FaGraduationCap } from "react-icons/fa";
import { BsBriefcaseFill } from "react-icons/bs";
import { LuCalendar } from "react-icons/lu";
import { FaMedal } from "react-icons/fa6";
import { HiUserGroup } from "react-icons/hi2";
import { Title } from "../../../components/title";

export const Section3 = () => {
  const educationData = [
    {
      year: "2022-2023",
      title: "IELTS 6.5",
      school: "IDP IELTS Viet Nam",
      icon: <FaGraduationCap className="text-[22px]" />,
      color: "#3F8E00"
    },
    {
      year: "2023-2024",
      title: "Higher Secondary School Graduation - GPA 9.23/10.0",
      school: "Da Lat High School for the Gifted",
      icon: <FaGraduationCap className="text-[22px]" />,
      color: "#3F8E00"
    },
    {
      year: "2023–2027",
      title: "Bachelor of Information Technology - Software Engineering",
      school: "University of Science - Viet Nam National University (HCMUS)",
      icon: <BsBriefcaseFill className="text-[22px]" />,
      color: "#E11D48"
    },
    {
      year: "2023",
      title: "University's Study Encouragement Scholarship – Semester 2",
      school: "University of Science - Viet Nam National University (HCMUS)",
      icon: <FaMedal className="text-[22px]" />,
      color: "#FFD700"
    },
    {
      year: "2025",
      title: "Top 10 Hackathon - NASA International Space App Challenge",
      school: "NASA Space App Challenge",
      icon: <HiUserGroup className="text-[22px]" />,
      color: "#E11D48"
    },
  ];

  return (
    <>
      <Element id="education" className="container mx-auto px-[95px] mb-[100px]">
        <div className="flex flex-col items-center pt-[50px]">
          <Title
            title={"Education & Learning Journey 🎓"}
            subTitle={"Every experience, from academic study to hands-on projects, has helped me develop not just technical skills but also the mindset of continuous improvement."}
          />

          <div className="relative w-full">
            <div className="absolute left-[50px] top-0 bottom-0 w-[3px] bg-[#CECECE]"></div>

            <div className="flex flex-col gap-10">
              {educationData.map((edu, index) => (
                <div key={index} className="relative flex items-start gap-6 hover:scale-[1.02]">
                  <div className="flex-1 flex items-center gap-[20px] bg-[#ffffff10]/80 backdrop-blur-sm p-6 rounded-2xl border border-[#2A2A2A] shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                    <div
                      className={`w-[50px] h-[50px] flex items-center justify-center rounded-full text-white z-10`}
                      style={{ backgroundColor: edu.color }}
                    >
                      {edu.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[#9AA0A6] text-sm mb-2">
                        <LuCalendar className="text-[16px]" />
                        <span>{edu.year}</span>
                      </div>
                      <div className="text-white text-[18px] font-semibold mb-1">
                        {edu.title}
                      </div>
                      <div className="text-[#CECECE] text-sm flex items-center gap-2">
                        🎓 {edu.school}
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