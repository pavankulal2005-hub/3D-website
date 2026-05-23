import { useEffect, useState, useRef } from 'react';
import { getLenis } from '@/hooks/useSmoothScroll';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(id, { offset: -64 });
    }
  };

  const navLinks = [
    { label: 'WORK', target: '#projects' },
    { label: 'ABOUT', target: '#skills' },
    { label: 'CONTACT', target: '#contact' },
  ];

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 w-full z-[1000] transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(5, 8, 16, 0.5)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-between h-16" style={{ padding: '0 clamp(20px, 5vw, 80px)' }}>
        <button
          onClick={() => handleNavClick('#hero')}
          className="font-outfit font-black text-xl tracking-[0.1em] text-text-primary hover:text-accent-cyan transition-colors duration-300"
        >
          PAVAN
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.target)}
              className="group relative font-outfit font-medium text-sm tracking-[0.08em] text-text-secondary hover:text-text-primary transition-colors duration-300"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-cyan group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-[2px] bg-text-primary transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
          <span className={`block w-5 h-[2px] bg-text-primary transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-[2px] bg-text-primary transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
        style={{
          background: 'rgba(5, 8, 16, 0.9)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.target)}
              className="font-outfit font-medium text-sm tracking-[0.08em] text-text-secondary hover:text-text-primary transition-colors duration-300"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
