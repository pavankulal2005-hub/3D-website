import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  start?: string;
  end?: string;
  children?: boolean;
}

export function useScrollReveal<T extends HTMLElement>(options: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const {
      y = 60,
      x = 0,
      duration = 1,
      stagger = 0,
      delay = 0,
      ease = 'power3.out',
      start = 'top bottom-=10%',
      end = 'bottom top+=25%',
      children = false,
    } = options;

    const targets = children ? el.children : el;

    gsap.set(targets, { opacity: 0, y, x });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      x: 0,
      duration,
      stagger,
      delay,
      ease,
      scrollTrigger: {
        trigger: el,
        start,
        end,
        toggleActions: 'play none none reverse',
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  return ref;
}
