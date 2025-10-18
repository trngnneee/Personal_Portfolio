"use client"

import 'aos/dist/aos.css'; 
import { useEffect } from 'react';
import AOS from 'aos';

export const AOSConfig = () => {
    useEffect(() => {
        AOS.init({
            easing: "ease-in-out",
            once: true,
        });
      }, []);
    
    return (
        <></>
    );
}