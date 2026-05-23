import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Github, Linkedin, Twitter, Dribbble } from 'lucide-react';
import { getLenis } from '@/hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

/* ─── Aurora Canvas Effect ─── */
function useAuroraCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const animRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.45;
    };
    resize();
    window.addEventListener('resize', resize);

    // IntersectionObserver to pause when not visible
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const AURORA_SPEED = 0.008;
    const WAVE_AMPLITUDE = 80;

    function drawAuroraBand(yOffset: number, color: string, _opacity: number, thickness: number, time: number) {
      if (!ctx || !canvas) return;
      ctx.lineWidth = thickness;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const width = canvas.width;
      ctx.moveTo(0, yOffset);
      const wave1 = Math.sin(time * AURORA_SPEED + yOffset) * WAVE_AMPLITUDE;
      const wave2 = Math.cos(time * AURORA_SPEED * 0.7 + yOffset * 0.5) * (WAVE_AMPLITUDE * 0.5);
      const cpX1 = width * 0.3 + wave1;
      const cpY1 = yOffset - 50 + wave2;
      const cpX2 = width * 0.7 + wave2;
      const cpY2 = yOffset + 50 + wave1;
      ctx.quadraticCurveTo(cpX1, cpY1, width / 2, yOffset + Math.sin(time * 0.01) * 20);
      ctx.quadraticCurveTo(cpX2, cpY2, width, yOffset + Math.cos(time * 0.009) * 15);
      ctx.stroke();
      ctx.shadowBlur = 30;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawAurora(time: number) {
      if (!ctx || !canvas) return;
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'screen';

      const bandCount = window.innerWidth < 768 ? 3 : 6;
      for (let i = 0; i < bandCount; i++) {
        const yOffset = (ch * 0.3) + (i * 20) + Math.sin(time * 0.005 + i) * 30;
        const alpha = 0.05 + (Math.sin(time * 0.01 + i) * 0.03);
        const isCyan = i % 2 === 0;
        const color = isCyan
          ? `rgba(0, 212, 255, ${alpha})`
          : `rgba(255, 215, 0, ${alpha * 0.5})`;
        const thickness = 20 + (i * 5);
        drawAuroraBand(yOffset, color, alpha, thickness, time);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    let time = 0;
    const animate = () => {
      if (isVisibleRef.current && !prefersReducedMotion) {
        time += 16;
        drawAurora(time);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);
}

/* ─── Social Icons Component ─── */
function SocialIcons({ delay = 0 }: { delay?: number }) {
  const icons = [
    { Icon: Github, label: 'GitHub', href: '#' },
    { Icon: Linkedin, label: 'LinkedIn', href: '#' },
    { Icon: Twitter, label: 'Twitter', href: '#' },
    { Icon: Dribbble, label: 'Dribbble', href: '#' },
  ];

  return (
    <div className="flex items-center gap-6 md:gap-8">
      {icons.map(({ Icon, label, href }, i) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-social-icon flex items-center justify-center w-10 h-10 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-text-tertiary hover:border-[rgba(0,212,255,0.2)] hover:text-accent-cyan hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-250"
          style={{ opacity: 0 }}
          data-delay={delay + i * 50}
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}

/* ─── Main Hero Section ─── */
export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const auroraCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(true);

  useAuroraCanvas(auroraCanvasRef);

  // Video load handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => setVideoLoaded(true);
    video.addEventListener('loadeddata', onLoaded);
    if (video.readyState >= 2) setVideoLoaded(true);
    return () => video.removeEventListener('loadeddata', onLoaded);
  }, []);

  // Hero entrance animation
  useEffect(() => {
    if (!videoLoaded) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set('.hero-anim', { opacity: 1, y: 0, scale: 1 });
      gsap.set('.hero-social-icon', { opacity: 1, scale: 1 });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 0.5)
      .fromTo('.hero-name', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 0.7)
      .fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 1.1)
      .fromTo('.hero-cta', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.3)
      .fromTo('.hero-social-icon', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.05 }, 1.4);

    return () => { tl.kill(); };
  }, [videoLoaded]);

  // Scroll indicator hide
  useEffect(() => {
    const handleScroll = () => {
      setScrollIndicatorVisible(window.scrollY < window.innerHeight * 0.05);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(id, { offset: -64 });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', background: '#050810' }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          zIndex: 1,
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 2000ms ease',
        }}
      >
        <source src="/hero-sky.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay for bottom blend */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '30vh',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(5, 8, 16, 0.3) 50%, rgba(5, 8, 16, 0.8) 100%)',
          zIndex: 2,
        }}
      />

      {/* Brightness overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center bottom, transparent 30%, rgba(5, 8, 16, 0.85) 100%)',
          zIndex: 2,
        }}
      />

      {/* Aurora Canvas Overlay */}
      <canvas
        ref={auroraCanvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '100%',
          height: '45%',
          zIndex: 3,
          mixBlendMode: 'screen',
          maskImage: 'radial-gradient(ellipse 90% 60% at 50% 30%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 60% at 50% 30%, black 30%, transparent 75%)',
        }}
      />

      {/* Hero Content */}
      <div
        className="relative flex flex-col items-center justify-center text-center h-full"
        style={{ zIndex: 10, padding: '0 20px' }}
      >
        <div className="max-w-[900px] mx-auto flex flex-col items-center gap-8">
          {/* Subtitle */}
          <p className="hero-subtitle hero-anim font-outfit font-medium text-sm md:text-base uppercase tracking-[0.15em] text-text-secondary opacity-0">
            Creative Developer & Designer
          </p>

          {/* Hero Name */}
          <h1 className="hero-name hero-anim font-outfit font-black text-glow-cyan opacity-0 will-change-transform"
            style={{ fontSize: 'clamp(56px, 10vw, 128px)', lineHeight: 0.9, letterSpacing: '-0.04em' }}
          >
            Pavan
          </h1>

          {/* Description */}
          <p className="hero-desc hero-anim max-w-[640px] font-outfit text-base md:text-xl text-text-secondary opacity-0"
            style={{ lineHeight: 1.6 }}
          >
            I craft immersive digital experiences that blend{' '}
            <span className="mono-highlight">creative design</span> with{' '}
            <span className="mono-highlight">cutting-edge technology</span>.
            From interactive web experiences to thoughtful UI systems, I build things that delight.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta hero-anim flex flex-col sm:flex-row items-center gap-5 mt-2 opacity-0">
            <button
              onClick={() => handleScrollTo('#projects')}
              className="group px-9 py-3.5 rounded-full border-2 border-[rgba(0,212,255,0.4)] bg-transparent text-accent-cyan font-outfit font-medium text-[15px] hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.8)] hover:shadow-glow-cyan transition-all duration-300"
            >
              View My Work
            </button>
            <button
              onClick={() => handleScrollTo('#contact')}
              className="px-9 py-3.5 rounded-full border border-[rgba(255,255,255,0.15)] bg-transparent text-text-secondary font-outfit font-medium text-[15px] hover:border-[rgba(255,255,255,0.3)] hover:text-text-primary transition-all duration-300"
            >
              Get in Touch
            </button>
          </div>

          {/* Social Icons */}
          <div className="mt-10">
            <SocialIcons delay={1400} />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-300"
        style={{ zIndex: 10, opacity: scrollIndicatorVisible ? 1 : 0 }}
      >
        <div className="relative w-[1px] h-10 bg-text-tertiary/30">
          <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-text-tertiary animate-scroll-dot" />
        </div>
        <span className="font-outfit text-xs uppercase tracking-[0.1em] text-text-tertiary">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
