import { useEffect, useState } from "react";
import { FaLinkedinIn, FaGithub, FaFacebook, FaInstagram } from "react-icons/fa6";
import { HiBars3, HiXMark } from "react-icons/hi2";
import { Link } from 'react-scroll';

export const Header = () => {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [idleTimer, setIdleTimer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { label: "Home", to: "home" },
    { label: "Project", to: "project" },
    { label: "Education", to: "education" },
    { label: "Contact me", to: "contact" },
  ];

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

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <>
      <div
        className={`container mx-auto rounded-b-[10px] fixed top-0 left-0 right-0 z-50 bg-[#00000036] backdrop-blur-md text-[#CECECE] hidden md:flex justify-between items-center py-[20px] px-[95px] text-sm transition-transform duration-500 ${showHeader ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            className="hover:bg-[#ffffff10] px-[20px] py-[5px] rounded-[8px] hover:scale-[1.15] transition-all duration-200 cursor-pointer"
            to={item.to}
            smooth={true}
            duration={500}
          >
            {item.label}
          </Link>
        ))}
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

      <button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className="md:hidden fixed top-4 left-4 z-[60] bg-[#0000007d] text-white p-2 rounded-lg backdrop-blur-md border border-[#ffffff20]"
        aria-label="Open menu"
      >
        {isSidebarOpen ? <HiXMark size={24} /> : <HiBars3 size={24} />}
      </button>

      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />

      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-[280px] max-w-[82vw] z-[56] bg-[#0f0f10]/95 backdrop-blur-xl border-r border-[#ffffff1a] p-6 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="mt-16 flex flex-col gap-3">
          {navItems.map((item) => (
            <Link
              key={`mobile-${item.to}`}
              className="text-[#CECECE] hover:bg-[#ffffff10] px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer"
              to={item.to}
              smooth={true}
              duration={500}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-8 text-[#CECECE]">
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
      </aside>
    </>
  );
}