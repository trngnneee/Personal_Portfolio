import { NeatGradient } from "@firecms/neat";
import { config } from "../config/neat.config";
import { useEffect, useRef, useState } from "react";
import { Header } from "./home/components/header";
import { HashLoader } from "react-spinners";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Layout({ children }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const neat = new NeatGradient({
      ref: canvasRef.current,
      ...config,
    });

    neat.speed = 6;

    return () => neat.destroy();
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      AOS.refresh();
    }, 3000);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full" />

      {loading ? (
        <div
          data-aos="zoom-in"
          data-aos-duration="800"
          className="fixed inset-0 flex flex-col justify-center items-center backdrop-blur-md z-50 transition-opacity duration-700"
        >
          <HashLoader color="#CECECE" size={80} />
          <p className="mt-4 text-[#CECECE] font-medium animate-pulse">
            Loading...
          </p>
        </div>
      ) : (
        <>
          <Header />
          <div className="relative z-10" data-aos="fade-in">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
