import { useEffect, useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Github, Linkedin, Twitter, Dribbble, Send } from 'lucide-react';

/* ─── Experience Data ─── */
const experiences = [
  {
    role: 'Senior Frontend Engineer',
    company: 'Lumina Tech',
    date: '2022 – Present',
    description: 'Leading frontend architecture for a SaaS platform serving 50K+ users. Built the design system from scratch and mentored a team of 4 developers.',
    tags: ['React', 'TypeScript', 'GraphQL', 'AWS'],
  },
  {
    role: 'UI/UX Developer',
    company: 'Studio Meridian',
    date: '2020 – 2022',
    description: 'Crafted immersive web experiences for creative agencies and brands. Specialized in WebGL, animation, and interaction design.',
    tags: ['Three.js', 'GSAP', 'Figma', 'Vue'],
  },
  {
    role: 'Frontend Developer',
    company: 'PixelForge',
    date: '2018 – 2020',
    description: 'Developed responsive web applications and e-commerce platforms. Collaborated closely with designers to implement pixel-perfect interfaces.',
    tags: ['React', 'JavaScript', 'SASS', 'WordPress'],
  },
  {
    role: 'B.S. Computer Science',
    company: 'University of Technology',
    date: '2014 – 2018',
    description: 'Graduated with honors. Focused on human-computer interaction, computer graphics, and web technologies.',
    tags: ['HCI', 'Graphics', 'Web Dev'],
  },
];

/* ─── Sunset Canvas Effect ─── */
function useSunsetCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fixed canvas resolution for pixel art look
    canvas.width = 320;
    canvas.height = 180;

    const SEED = { a: 12345, b: 67890, c: 11121, d: 31415 };

    function rand() {
      SEED.a >>>= 0; SEED.b >>>= 0; SEED.c >>>= 0; SEED.d >>>= 0;
      let t = (SEED.a + SEED.b) | 0;
      SEED.a = SEED.b ^ (SEED.b >>> 9);
      SEED.b = (SEED.c + (SEED.c << 3)) | 0;
      SEED.c = (SEED.c << 21) | (SEED.c >>> 11);
      SEED.d = (SEED.d + 1) | 0;
      t = (t + SEED.d) | 0;
      SEED.c = (SEED.c + t) | 0;
      return (t >>> 0) / 4294967296;
    }

    // Generate stars
    interface Star {
      x: number;
      y: number;
      size: number;
      seed: number;
      color: { r: number; g: number; b: number };
    }

    const stars: Star[] = [];
    const CYAN_TINT = { r: 0, g: 212, b: 255 };
    const PURPLE_TINT = { r: 139, g: 92, b: 246 };
    const FUCHSIA_TINT = { r: 232, g: 121, b: 249 };
    const WARM_TINT = { r: 255, g: 220, b: 180 };

    for (let i = 0; i < 200; i++) {
      const x = Math.floor(rand() * 320);
      const y = Math.floor(rand() * 180);
      const size = rand() > 0.95 ? 2 : 1;
      const starSeed = Math.floor(rand() * 1000);

      // Color selection
      const r = rand();
      let color: { r: number; g: number; b: number };
      if (r < 0.6) color = { r: 255, g: 255, b: 255 };
      else if (r < 0.75) color = CYAN_TINT;
      else if (r < 0.85) color = PURPLE_TINT;
      else if (r < 0.95) color = FUCHSIA_TINT;
      else color = WARM_TINT;

      stars.push({ x, y, size, seed: starSeed, color });
    }

    // Mountain colors
    const MOUNTAIN_DARK = '#020810';
    const MOUNTAIN_MID = '#051525';
    const MOUNTAIN_LIGHT = '#0A2035';

    function drawMountains() {
      if (!ctx) return;

      // Farthest range
      ctx.fillStyle = MOUNTAIN_DARK;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      let x = 0;
      let y = 140;
      while (x <= 320) {
        y += Math.floor(rand() * 15) - 7;
        y = Math.max(100, Math.min(150, y));
        ctx.lineTo(x, y);
        x += 5 + Math.floor(rand() * 10);
      }
      ctx.lineTo(320, 180);
      ctx.fill();

      // Middle range
      ctx.fillStyle = MOUNTAIN_MID;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      x = 0;
      y = 150;
      while (x <= 320) {
        y += Math.floor(rand() * 12) - 6;
        y = Math.max(120, Math.min(160, y));
        ctx.lineTo(x, y);
        x += 4 + Math.floor(rand() * 8);
      }
      ctx.lineTo(320, 180);
      ctx.fill();

      // Closest range
      ctx.fillStyle = MOUNTAIN_LIGHT;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      x = 0;
      y = 155;
      while (x <= 320) {
        y += Math.floor(rand() * 10) - 5;
        y = Math.max(135, Math.min(170, y));
        ctx.lineTo(x, y);
        x += 3 + Math.floor(rand() * 6);
      }
      ctx.lineTo(320, 180);
      ctx.fill();
    }

    function drawCityGlow() {
      if (!ctx) return;
      const cityGlow = ctx.createLinearGradient(0, 165, 0, 180);
      cityGlow.addColorStop(0, 'rgba(0, 212, 255, 0)');
      cityGlow.addColorStop(0.5, 'rgba(0, 212, 255, 0.04)');
      cityGlow.addColorStop(0.8, 'rgba(139, 92, 246, 0.06)');
      cityGlow.addColorStop(1, 'rgba(232, 121, 249, 0)');
      ctx.fillStyle = cityGlow;
      ctx.fillRect(0, 165, 320, 15);
    }

    let lastTime = 0;
    const frameInterval = 33; // ~30fps

    function render(timestamp: number) {
      if (!ctx) return;

      if (timestamp - lastTime < frameInterval) {
        animRef.current = requestAnimationFrame(render);
        return;
      }
      lastTime = timestamp;

      // Background gradient (sunset sky)
      const bg = ctx.createLinearGradient(0, 0, 0, 180);
      bg.addColorStop(0, '#031B3D');
      bg.addColorStop(0.3, '#0E2A47');
      bg.addColorStop(0.6, '#1A3A5C');
      bg.addColorStop(1, '#2B5A7A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 320, 180);

      // Stars
      const now = prefersReducedMotion ? 0 : Date.now();
      stars.forEach((star) => {
        const twinkle = Math.abs(Math.sin(now * 0.005 + star.seed));
        const brightness = 0.2 + (twinkle * 0.8);
        ctx.globalAlpha = Math.min(brightness * 0.4, 1); // Cap at 0.4 for sunset
        ctx.fillStyle = `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // City glow
      drawCityGlow();

      // Mountains
      drawMountains();

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);
}

/* ─── TagPill Component ─── */
function TagPill({ tag }: { tag: string }) {
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-outfit text-accent-cyan"
      style={{
        border: '1px solid rgba(0, 212, 255, 0.2)',
        background: 'rgba(0, 212, 255, 0.05)',
      }}
    >
      {tag}
    </span>
  );
}

/* ─── Main Experience Section ─── */
export default function ExperienceSection() {
  const headingRef = useScrollReveal<HTMLDivElement>({ y: 60, duration: 1.2 });
  const timelineRef = useScrollReveal<HTMLDivElement>({ y: 80, duration: 1, stagger: 0.12, children: true });
  const contactHeadingRef = useScrollReveal<HTMLDivElement>({ y: 60, duration: 1.2 });
  const formRef = useScrollReveal<HTMLDivElement>({ y: 60, duration: 1 });
  const sunsetCanvasRef = useRef<HTMLCanvasElement>(null);

  useSunsetCanvas(sunsetCanvasRef);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission placeholder
  };

  return (
    <section
      id="contact"
      className="relative w-full"
      style={{
        background: 'linear-gradient(180deg, #031B3D 0%, #0E2A47 30%, #1A3A5C 60%, #2B5A7A 100%)',
      }}
    >
      {/* ─── Part A: Experience Timeline ─── */}
      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: '1000px',
          padding: 'clamp(60px, 10vh, 120px) clamp(20px, 5vw, 80px)',
        }}
      >
        {/* Section Heading */}
        <div ref={headingRef} className="text-center mb-16">
          <h2
            className="font-outfit font-bold text-text-primary"
            style={{ fontSize: 'clamp(36px, 5vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
          >
            Experience
          </h2>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Center line (desktop) */}
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2"
            style={{ background: 'linear-gradient(180deg, transparent, #00D4FF, #8B5CF6, #E879F9, transparent)' }}
          />

          {/* Left line (mobile) */}
          <div
            className="md:hidden absolute left-4 top-0 bottom-0 w-[1px]"
            style={{ background: 'linear-gradient(180deg, transparent, #00D4FF, #8B5CF6, #E879F9, transparent)' }}
          />

          <div className="flex flex-col gap-12">
            {experiences.map((exp, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={`relative flex ${isLeft ? 'md:justify-start' : 'md:justify-end'} justify-start`}
                >
                  {/* Connector dot */}
                  <div
                    className={`absolute top-6 w-3 h-3 rounded-full z-10 md:left-1/2 md:-translate-x-1/2 left-4 -translate-x-1/2`}
                    style={{
                      background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
                      boxShadow: '0 0 12px rgba(0, 212, 255, 0.5)',
                    }}
                  />

                  {/* Card */}
                  <div
                    className={`glass-card glass-card-hover p-6 md:p-7 w-full md:w-[45%] ml-10 md:ml-0`}
                  >
                    {/* Date badge */}
                    <span
                      className="inline-block font-mono text-xs text-accent-cyan mb-3 px-3 py-1 rounded-md"
                      style={{ background: 'rgba(0, 212, 255, 0.08)' }}
                    >
                      {exp.date}
                    </span>

                    {/* Role */}
                    <h3
                      className="font-outfit font-bold text-text-primary"
                      style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', lineHeight: 1.1 }}
                    >
                      {exp.role}
                    </h3>

                    {/* Company */}
                    <p className="font-outfit font-medium text-sm md:text-base text-text-secondary mt-1">
                      {exp.company}
                    </p>

                    {/* Description */}
                    <p className="font-outfit text-sm md:text-base text-text-secondary mt-3 leading-relaxed">
                      {exp.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {exp.tags.map((tag) => (
                        <TagPill key={tag} tag={tag} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Part B: Contact ─── */}
      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: '800px',
          padding: 'clamp(40px, 8vh, 80px) clamp(20px, 5vw, 80px)',
        }}
      >
        {/* Divider */}
        <div className="divider-gradient mb-16" />

        {/* Contact Heading */}
        <div ref={contactHeadingRef} className="text-center mb-12">
          <h2
            className="font-outfit font-bold text-text-primary"
            style={{ fontSize: 'clamp(32px, 4.5vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
          >
            Let&apos;s Create Something
          </h2>
          <p className="font-outfit text-lg md:text-xl text-text-secondary mt-4">
            Have a project in mind? I&apos;d love to hear about it.
          </p>
        </div>

        {/* Contact Form */}
        <div ref={formRef}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-5 py-4 rounded-xl font-outfit text-base text-text-primary placeholder-text-tertiary outline-none transition-all duration-200 focus:border-accent-cyan"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00D4FF';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-5 py-4 rounded-xl font-outfit text-base text-text-primary placeholder-text-tertiary outline-none transition-all duration-200 focus:border-accent-cyan"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00D4FF';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <textarea
              placeholder="Tell me about your project..."
              rows={5}
              className="w-full px-5 py-4 rounded-xl font-outfit text-base text-text-primary placeholder-text-tertiary outline-none transition-all duration-200 resize-vertical min-h-[160px] focus:border-accent-cyan"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00D4FF';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              className="w-full py-4.5 px-5 rounded-xl font-outfit font-bold text-base text-white flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #E879F9 100%)',
                padding: '18px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 212, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Send size={18} /> Send Message
            </button>
          </form>

          {/* Alternative Contact */}
          <div className="text-center mt-10">
            <p className="font-outfit text-xs text-text-tertiary uppercase tracking-wider mb-2">Or reach out directly</p>
            <a
              href="mailto:hello@pavan.dev"
              className="font-outfit font-medium text-base text-accent-cyan hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] transition-all duration-300"
            >
              hello@pavan.dev
            </a>
          </div>
        </div>

        {/* Social Links */}
        <div className="text-center mt-20">
          <p className="font-outfit text-xs text-text-tertiary uppercase tracking-wider mb-4">Follow my journey</p>
          <div className="flex items-center justify-center gap-8 md:gap-10">
            {[
              { Icon: Github, label: 'GitHub' },
              { Icon: Linkedin, label: 'LinkedIn' },
              { Icon: Twitter, label: 'Twitter' },
              { Icon: Dribbble, label: 'Dribbble' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-text-tertiary hover:border-[rgba(0,212,255,0.2)] hover:text-accent-cyan hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-250"
              >
                <Icon size={22} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sunset Canvas ─── */}
      <div className="relative w-full" style={{ height: '60vh' }}>
        <canvas
          ref={sunsetCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </section>
  );
}
