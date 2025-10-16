import { NeatGradient } from "@firecms/neat";
import { config } from "../config/neat.config";
import { useEffect, useRef } from "react";
import { Header } from "./home/components/header";

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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full" />

      <div className="relative z-10">
        <Header />
        {children}
      </div>
    </div>
  );
}
