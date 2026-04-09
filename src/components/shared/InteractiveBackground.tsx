import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const InteractiveBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        // Only track mouse casually, not every frame for performance
        requestAnimationFrame(() => {
          setMousePosition({
            x: e.clientX,
            y: e.clientY,
          });
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isMobile]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
      {/* Base gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Grid pattern layer */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, #8882 1px, transparent 1px), linear-gradient(to bottom, #8882 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Interactive Blob (hidden on mobile for performance) */}
      {!isMobile && (
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--neon-cyan)) 0%, rgba(0,0,0,0) 70%)",
          }}
          animate={{
            x: mousePosition.x - 300,
            y: mousePosition.y - 300,
          }}
          transition={{
            type: "tween",
            ease: "circOut",
            duration: 2,
          }}
        />
      )}

      {/* Another static animated blob */}
      <div 
        className="absolute top-1/4 -right-32 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse" 
        style={{ animationDuration: '8s' }}
      />
      <div 
        className="absolute bottom-1/4 -left-32 w-80 h-80 bg-neon-violet/10 rounded-full blur-[120px] animate-pulse" 
        style={{ animationDuration: '6s', animationDelay: '2s' }}
      />
    </div>
  );
};

export default InteractiveBackground;
