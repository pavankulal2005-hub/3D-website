export default function Footer() {
  return (
    <footer
      className="relative w-full text-center"
      style={{
        padding: '48px clamp(20px, 5vw, 80px)',
        background: 'transparent',
      }}
    >
      {/* Bottom divider */}
      <div className="divider-gradient mb-8" />

      {/* Logo */}
      <p className="font-outfit font-black text-lg tracking-[0.1em] text-text-primary">
        PAVAN
      </p>

      {/* Tagline */}
      <p className="font-outfit text-xs text-text-tertiary mt-3">
        Crafting digital experiences with passion and precision.
      </p>

      {/* Copyright */}
      <p className="font-outfit text-xs text-text-tertiary mt-6">
        &copy; {new Date().getFullYear()} Pavan. All rights reserved.
      </p>
    </footer>
  );
}
