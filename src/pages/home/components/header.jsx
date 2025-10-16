import { useEffect, useState } from "react";
import { FaLinkedinIn, FaGithub, FaFacebook, FaInstagram } from "react-icons/fa6";
import { Link } from 'react-scroll';

export const Header = () => {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [idleTimer, setIdleTimer] = useState(null);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < lastScrollY) {
      setShowHeader(true);
    } else if (currentScrollY > 100) {
      setShowHeader(false);
    }

    setLastScrollY(currentScrollY);

    if (idleTimer) clearTimeout(idleTimer);
    const timer = setTimeout(() => setShowHeader(false), 5000);
    setIdleTimer(timer);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [lastScrollY]);

  return (
    <>
      <div
        className={`container mx-auto rounded-b-[10px] fixed top-0 left-0 right-0 z-50 bg-[#00000036] backdrop-blur-md text-[#CECECE] flex justify-between items-center py-[20px] px-[95px] text-sm transition-transform duration-500 ${showHeader ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <Link
          className="hover:bg-[#ffffff10] px-[20px] py-[5px] rounded-[8px] hover:scale-[1.15] transition-all duration-200 cursor-pointer"
          to="home"
          smooth={true}
          duration={500}
        >
          Home
        </Link>
        <Link
          className="hover:bg-[#ffffff10] px-[20px] py-[5px] rounded-[8px] hover:scale-[1.15] transition-all duration-200 cursor-pointer"
          to="project"
          smooth={true}
          duration={500}
        >
          Project
        </Link>
        <Link
          className="hover:bg-[#ffffff10] px-[20px] py-[5px] rounded-[8px] hover:scale-[1.15] transition-all duration-200 cursor-pointer"
          to="education"
          smooth={true}
          duration={500}
        >
          Education
        </Link>
        <Link
          className="hover:bg-[#ffffff10] px-[20px] py-[5px] rounded-[8px] hover:scale-[1.15] transition-all duration-200 cursor-pointer"
          to="contact"
          smooth={true}
          duration={500}
        >
          Contact me
        </Link>
        <div className="flex items-center gap-[20px]">
          <a href="https://www.linkedin.com/in/nguy%C3%AAn-tr%C6%B0%E1%BB%9Dng-8a075934b/" target="blank" className="hover:bg-[#ffffff10] hover:scale-[1.15] transition-all duration-200 cursor-pointer p-2 rounded-[10px]">
            <FaLinkedinIn size={20} />
          </a>
          <a href="https://github.com/trngnneee" target="blank" className="hover:bg-[#ffffff10] hover:scale-[1.15] transition-all duration-200 cursor-pointer p-2 rounded-[10px]">
            <FaGithub size={20} />
          </a>
          <a href="https://www.facebook.com/trngn.neee" target="blank" className="hover:bg-[#ffffff10] hover:scale-[1.15] transition-all duration-200 cursor-pointer p-2 rounded-[10px]">
            <FaFacebook size={20} />
          </a>
          <a href="https://www.instagram.com/trngn.neee/" target="blank" className="hover:bg-[#ffffff10] hover:scale-[1.15] transition-all duration-200 cursor-pointer p-2 rounded-[10px]">
            <FaInstagram size={20} />
          </a>
        </div>
      </div>
    </>
  );
}