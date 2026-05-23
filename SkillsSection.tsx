import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Code2, Server, Palette, Box, Cloud, Wrench,
} from 'lucide-react';

interface SkillCategory {
  icon: React.ElementType;
  label: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    icon: Code2,
    label: 'Frontend',
    skills: ['React', 'TypeScript', 'Next.js', 'Vue', 'Tailwind CSS', 'GSAP'],
  },
  {
    icon: Server,
    label: 'Backend',
    skills: ['Node.js', 'Python', 'PostgreSQL', 'GraphQL', 'REST APIs'],
  },
  {
    icon: Palette,
    label: 'Design',
    skills: ['Figma', 'Adobe Creative Suite', 'UI/UX Design', 'Design Systems'],
  },
  {
    icon: Box,
    label: '3D & Motion',
    skills: ['Three.js', 'WebGL', 'Shader Programming', 'Framer Motion'],
  },
  {
    icon: Cloud,
    label: 'DevOps',
    skills: ['Docker', 'AWS', 'CI/CD', 'Vercel', 'Linux'],
  },
  {
    icon: Wrench,
    label: 'Tools',
    skills: ['Git', 'VS Code', 'Neovim', 'Postman', 'Figma'],
  },
];

export default function SkillsSection() {
  const headingRef = useScrollReveal<HTMLDivElement>({ y: 60, duration: 1.2 });
  const gridRef = useScrollReveal<HTMLDivElement>({ y: 80, duration: 1, stagger: 0.1, children: true });

  return (
    <section
      id="skills"
      className="relative w-full"
      style={{
        padding: 'clamp(60px, 10vh, 120px) clamp(20px, 5vw, 80px)',
        background: 'linear-gradient(180deg, #09122C 0%, #031B3D 100%)',
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section Heading */}
        <div ref={headingRef} className="text-center mb-16">
          <h2
            className="font-outfit font-bold text-text-primary"
            style={{ fontSize: 'clamp(36px, 5vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
          >
            Skills & Tools
          </h2>
        </div>

        {/* Skills Grid */}
        <div
          ref={gridRef}
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {skillCategories.map((category) => (
            <div
              key={category.label}
              className="glass-card glass-card-hover p-6 md:p-8 transition-all duration-400"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(139, 92, 246, 0.15))' }}
              >
                <category.icon size={24} className="text-accent-cyan" />
              </div>

              {/* Label */}
              <h3 className="font-outfit font-bold text-xl md:text-2xl text-text-primary mb-4">
                {category.label}
              </h3>

              {/* Skills List */}
              <div className="flex flex-col gap-2.5">
                {category.skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-accent-cyan flex-shrink-0" />
                    <span className="font-outfit text-sm md:text-base text-text-secondary">
                      {skill}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
