import { Element } from "react-scroll";
import { HiUserGroup } from "react-icons/hi2";
import { Title } from "../../../components/title";
import { useState } from "react";
import { LuCalendar } from "react-icons/lu";

export const Section5 = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const experiencesData = [
    {
      name: "Buoc Chan Yeu Thuong - 2026, Phu Khanh Lower Secondary School, Ben Tre Province",
      image: [
        "/BCYT.JPG",
        "/BCYT2.JPG"
      ],
      title: "Provide student counseling and support, organize extracurricular activities, and foster a positive school environment.",
      year: "2026"
    },
    {
      name: "Buoc Chan Yeu Thuong - 2025, Phu Khanh Lower Secondary School, Ben Tre Province",
      image: [
        "/BenTre.jpg",
        "/BenTre2.jpg"
      ],
      title: "Provide student counseling and support, organize extracurricular activities, and foster a positive school environment.",
      year: "2025"
    },
  ]

  return (
    <>
      <Element id="experience" className="container mx-auto px-5 md:px-[95px] mb-[30px] sm:mb-[100px] cursor-pointer">
        <div className="flex flex-col items-center pt-[50px]">
          <Title
            title={"Extracurricular Activities & Achievements"}
            subTitle={"A glimpse into my journey beyond academics, showcasing my dedication to personal growth and community involvement."}
          />

          <div className="relative w-full max-w-[900px]">
            <div className="absolute left-[24px] md:left-[50px] top-0 bottom-0 w-[3px] bg-[#CECECE]"></div>

            <div className="flex flex-col gap-10">
              {experiencesData.map((exp, index) => (
                <div key={index} className="relative flex items-start gap-4 md:gap-6 group" onClick={() => setActiveIndex(activeIndex === index ? null : index)}>
                  <div className="flex-1 flex flex-col bg-[#ffffff10]/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-[#2A2A2A] shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                    <div className="flex items-center gap-[14px] md:gap-[20px]">
                      <div className="min-w-[30px] h-[30px] sm:min-w-[42px] sm:h-[42px] md:min-w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-white z-10 flex-shrink-0 bg-[#E11D48]">
                        <HiUserGroup className="text-[14px] sm:text-[18px] md:text-[22px]" />
                      </div>
                      <div>
                        <div className="text-white text-[10px] sm:text-[15px] md:text-[18px] font-semibold mb-1">
                          {exp.name}
                        </div>
                        <div className="flex items-center gap-2 text-[#9AA0A6] text-[12px] md:text-sm mb-2">
                          <LuCalendar className="text-[10px] sm:text-[13px] md:text-[16px]" />
                          <span>{exp.year}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`grid overflow-hidden transition-all duration-700 ease-in-out delay-300 md:delay-500 ${activeIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      } group-hover:grid-rows-[1fr] group-hover:opacity-100`}>
                      <div className="min-h-0">
                        <div className="mt-4 pt-4 border-t border-[#ffffff20]">
                          {exp.image && exp.image.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              {exp.image.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`${exp.name} ${i + 1}`}
                                  className="w-full sm:w-1/2 h-auto object-cover rounded-xl shadow-md"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-[#CECECE]/80 text-[10px] sm:text-[12px] md:text-sm leading-relaxed mt-5">{exp.title}</div>
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
  )
}
