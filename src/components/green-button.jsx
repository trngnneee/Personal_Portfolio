import { useState } from "react";
import { FaAngleRight } from "react-icons/fa6";
import { Link } from "react-scroll";

export const GreenButton = ({ title, scrollTo }) => {
  const [hover, setHover] = useState(false);
 
  return (
    <>
      <Link
        to={scrollTo}
        smooth={true}
        duration={500}
        className="group relative flex items-center justify-center gap-2 w-[200px] py-3 rounded-md border border-[#62BA1B]
              bg-[#3F8E00] text-white font-semibold text-[16px] cursor-pointer
              hover:bg-[#469a01] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-300 shadow-md hover:scale-[1.02]"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span className="transition-all duration-300">{title}</span>
        <FaAngleRight
          className={`transition-all duration-300 transform ${hover ? "translate-x-1 opacity-100" : "translate-x-0 opacity-0"
            }`}
        />
      </Link>
    </>
  );
}