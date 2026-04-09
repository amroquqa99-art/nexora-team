import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const ParticlesBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return; 
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const orbs = [
    { color: "bg-orange-500/20", size: "w-[400px] md:w-[600px] h-[400px] md:h-[600px]", top: "-10%", left: "-5%", delay: 0 },
    { color: "bg-orange-600/15", size: "w-[500px] md:w-[800px] h-[500px] md:h-[800px]", top: "30%", right: "-10%", delay: 2 },
    { color: "bg-orange-400/10", size: "w-[300px] md:w-[500px] h-[300px] md:h-[500px]", bottom: "10%", left: "10%", delay: 4 },
  ];

  if (isAdminRoute) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030305] pointer-events-none">
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-[0.03]" />

      {/* Deep Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.9)_100%)]" />

      {/* Large Background Glows */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            x: isMobile ? 0 : mousePos.x * (i + 1) * 0.3,
            y: isMobile ? 0 : mousePos.y * (i + 1) * 0.3,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`absolute ${orb.size} ${orb.color} rounded-full blur-[80px] md:blur-[140px] md:animate-morph opacity-40 md:opacity-100`}
          style={{
            top: (orb as any).top,
            left: (orb as any).left,
            right: (orb as any).right,
            bottom: (orb as any).bottom,
            animationDelay: `${orb.delay}s`
          }}
        />
      ))}

      <FloatingOrbs isMobile={isMobile} />
    </div>
  );
};

const FloatingOrbs = ({ isMobile }: { isMobile: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { 
      x: number; 
      y: number; 
      size: number; 
      opacity: number; 
      vx: number; 
      vy: number;
      glowSize: number;
      pulse: number;
      pulseSpeed: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = isMobile ? 35 : 80;

    for (let i = 0; i < count; i++) {
      const size = Math.random() * (isMobile ? 2.5 : 4) + 1.5;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        glowSize: size * (Math.random() * 6 + 4),
        opacity: Math.random() * 0.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        pulse: Math.random() * Math.PI,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const currentOpacity = p.opacity + Math.sin(p.pulse) * 0.2;
        
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -100) p.x = canvas.width + 100;
        if (p.x > canvas.width + 100) p.x = -100;
        if (p.y < -100) p.y = canvas.height + 100;
        if (p.y > canvas.height + 100) p.y = -100;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize);
        gradient.addColorStop(0, `rgba(249, 115, 22, ${currentOpacity})`);
        gradient.addColorStop(0.4, `rgba(249, 115, 22, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 140, 50, ${currentOpacity + 0.3})`;
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [isMobile]);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-70 mix-blend-screen" />;
};

export default ParticlesBackground;
