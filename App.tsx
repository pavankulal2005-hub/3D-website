import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import Navigation from '@/components/Navigation';
import HeroSection from '@/sections/HeroSection';
import SkillsSection from '@/sections/SkillsSection';
import OceanSection from '@/sections/OceanSection';
import ExperienceSection from '@/sections/ExperienceSection';
import Footer from '@/sections/Footer';

function App() {
  useSmoothScroll();

  return (
    <div className="relative min-h-screen bg-[#050810]">
      <Navigation />
      <main>
        <HeroSection />
        <SkillsSection />
        <OceanSection />
        <ExperienceSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
