import React from 'react';
import { FaGithub, FaFacebook, FaEnvelope, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-scroll';

export const Footer = () => {
  return (
    <footer className="w-full bg-white/5 backdrop-blur-md border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl font-bold text-[#CECECE] tracking-wider mb-2 hover:text-white transition-colors cursor-pointer">
            TRNGNNEEE
          </h2>
          <p className="text-[#CECECE]/60 text-sm text-center md:text-left">
            Frontend/Backend Developer
          </p>
        </div>

        <div className="flex space-x-6 text-[#CECECE]/80 font-medium text-sm">
          <Link to="home" smooth={true} duration={500} className="hover:text-white cursor-pointer transition-colors relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="about" smooth={true} duration={500} className="hover:text-white cursor-pointer transition-colors relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="projects" smooth={true} duration={500} className="hover:text-white cursor-pointer transition-colors relative group">
            Projects
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="contact" smooth={true} duration={500} className="hover:text-white cursor-pointer transition-colors relative group">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>

        <div className="flex space-x-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/20 text-[#CECECE] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-white/20">
            <FaGithub size={18} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/20 text-[#CECECE] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-white/20">
            <FaLinkedin size={18} />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/20 text-[#CECECE] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-white/20">
            <FaFacebook size={18} />
          </a>
          <a href="mailto:contact@example.com" className="p-2.5 rounded-full bg-white/5 hover:bg-white/20 text-[#CECECE] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-white/20">
            <FaEnvelope size={18} />
          </a>
        </div>
      </div>

      <div className="w-full border-t border-white/10 py-6 flex justify-center items-center backdrop-blur-sm">
        <p className="text-[#CECECE]/50 text-sm text-center">
          &copy; {new Date().getFullYear()} trngnneee. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
