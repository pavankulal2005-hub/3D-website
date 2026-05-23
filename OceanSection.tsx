import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ─── Ocean Shader Code ─── */
const oceanVertexShader = `
varying vec3 vViewPosition;
varying vec3 vNormal;

void main() {
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
  vViewPosition = -modelViewPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
}
`;

const oceanFragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uColorWater;
uniform vec3 uColorSun;
uniform vec3 uColorSky;
uniform vec3 uColorHalo;
uniform float uTiltX;

varying vec3 vViewPosition;
varying vec3 vNormal;

#define PI 3.14159265359
#define WAVE_SPEED 0.8
#define WAVE_FREQUENCY 1.5
#define NORMAL_STRENGTH 0.3

vec2 wave(vec2 position, float time, float freq, float amp, float speed, vec2 dir) {
  position += sin(position.x * freq * dir.x + time * speed) * cos(position.y * freq * dir.y + time * speed) * amp;
  return position;
}

float waveHeight(vec2 position, float time) {
  float height = 0.0;
  float amplitude = 1.0;
  float frequency = WAVE_FREQUENCY;
  for (int i = 0; i < 5; i++) {
    height += sin(position.x * frequency + time * WAVE_SPEED * float(i)) * cos(position.y * frequency + time * 0.5 * WAVE_SPEED * float(i)) * amplitude;
    amplitude *= 0.5;
    frequency *= 1.8;
  }
  return height;
}

vec3 calculateNormal(vec2 position, float time) {
  float eps = 0.1;
  float h = waveHeight(position, time);
  float hL = waveHeight(position - vec2(eps, 0.0), time);
  float hR = waveHeight(position + vec2(eps, 0.0), time);
  float hD = waveHeight(position - vec2(0.0, eps), time);
  float hU = waveHeight(position + vec2(0.0, eps), time);
  return normalize(vec3(hL - hR, eps * 2.0, hD - hU));
}

vec3 phongIllumination(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColor, vec3 ambientColor, float shininess) {
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  return ambientColor + lightColor * (diff * 0.7 + spec * 0.3);
}

vec3 skyColor(vec3 dir) {
  if (dir.y > 0.0) return uColorSky * 0.8;
  return uColorSky * 0.3;
}

void main() {
  float mouseEffect = uMouse.x;
  vec2 position = vViewPosition.xz;
  float time = uTime * WAVE_SPEED;
  float tiltFactor = uTiltX;

  vec2 wavePos = vec2(position.x, position.y + time);
  vec2 wavePosition = wave(wavePos, time, 0.05, 3.0, 0.5, vec2(1.0, 0.5));
  wavePosition = wave(wavePosition, time, 0.1, 2.0, 0.3, vec2(0.5, 1.0));
  wavePosition = wave(wavePosition, time, 0.08, 2.5, 0.4, vec2(1.0, 1.0));
  wavePosition = wave(wavePosition, time, 0.15, 1.5, 0.6, vec2(0.3, 0.7));
  wavePosition = wave(wavePosition, time, 0.2, 1.0, 0.7, vec2(0.8, 0.2));

  float height = waveHeight(wavePosition, time);
  vec3 normal = calculateNormal(wavePosition, time);
  normal += vec3(sin(position.x * 0.1 + mouseEffect * PI) * 0.01, 0.0, cos(position.y * 0.1 + mouseEffect * PI) * 0.01);
  normal = normalize(normal);

  vec3 viewDir = normalize(vViewPosition);
  vec3 lightPos = vec3(100.0 + tiltFactor * 200.0, 200.0, -200.0);
  vec3 lightDir = normalize(lightPos - vViewPosition);
  vec3 waterColor = mix(uColorWater, uColorWater * 0.8, clamp(waveHeight(wavePosition, time) * 0.1, 0.0, 1.0));

  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
  vec3 reflDir = reflect(-viewDir, normal);
  vec3 reflCol = skyColor(reflDir);
  vec3 refrCol = waterColor * (0.8 + 0.2 * max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0));
  vec3 waterCol = mix(refrCol, reflCol, fresnel);

  vec3 sunDir = normalize(vec3(100.0, 100.0, -500.0));
  vec3 moonDir = normalize(vec3(0.0, 200.0, -500.0));
  float moonGlow = exp(-pow(length(cross(moonDir, normalize(vViewPosition - vec3(0.0, 100.0, -500.0)))), 2.0) * 5.0);

  vec3 sunSpec = phongIllumination(normal, viewDir, sunDir, uColorSun * 0.8, vec3(0.0), 100.0);
  vec3 moonSpec = phongIllumination(normal, viewDir, moonDir, uColorHalo, vec3(0.0), 50.0);
  vec3 specular = sunSpec * 0.5 + moonSpec * 0.3;

  float lightIntensity = 0.6 + 0.4 * max(dot(normal, sunDir), 0.0);
  float hazeDistance = length(vViewPosition);
  float haze = exp(-hazeDistance * 0.001);
  vec3 waterColLit = waterCol * lightIntensity + specular;
  vec3 waterColFinal = mix(uColorSky * 0.5, waterColLit, haze);

  float distanceFromCenter = length(position);
  float sunsetIntensity = exp(-pow(distanceFromCenter * 0.01, 2.0));
  vec3 sunsetColor = uColorSun * sunsetIntensity;
  float cityGlow = exp(-pow(distanceFromCenter * 0.02, 2.0)) * 0.1;
  vec3 cityColor = uColorHalo * cityGlow * 0.5;

  vec3 finalColor = waterColFinal + sunsetColor * 0.1 + cityColor;
  float halo = exp(-pow(length(cross(sunDir, normalize(vViewPosition - vec3(100.0, 100.0, -500.0)))), 2.0) * 2.0);
  finalColor += uColorHalo * halo * 0.5;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

/* ─── Moon Shader ─── */
const moonVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const moonFragmentShader = `
uniform vec3 uMoonColor;
uniform vec3 uGlowColor;
uniform float uGlowStrength;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  float viewDot = 1.0 - max(dot(vNormal, vec3(0,0,1)), 0.0);
  float glow = pow(viewDot, 2.0) * uGlowStrength;
  vec3 color = mix(uMoonColor, uGlowColor, glow);
  float alpha = 0.7 + glow * 0.3;
  gl_FragColor = vec4(color, alpha);
}
`;

/* ─── Project Data ─── */
const projects = [
  {
    number: '01',
    title: 'Nebula Dashboard',
    description: 'A real-time analytics platform with immersive data visualizations built in React and D3.js. Features custom shader-powered charts and a glassmorphic UI system.',
    tags: ['React', 'TypeScript', 'D3.js', 'WebGL'],
    image: '/nebula-dashboard.jpg',
  },
  {
    number: '02',
    title: 'Aura Design System',
    description: 'A comprehensive component library and design token architecture powering 12+ products. Includes theming engine, accessibility-first components, and documentation.',
    tags: ['Design Systems', 'Figma', 'React', 'Storybook'],
    image: '/aura-design-system.jpg',
  },
  {
    number: '03',
    title: 'Stellar Studio',
    description: 'An interactive 3D web-based creative studio for building shader-powered experiences. Node-based editor with real-time preview and one-click deployment.',
    tags: ['Three.js', 'WebGL', 'Node.js', 'Canvas'],
    image: '/stellar-studio.jpg',
  },
];

/* ─── Main Ocean Section ─── */
export default function OceanSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    clock: THREE.Clock;
    material: THREE.ShaderMaterial;
    cityLights: THREE.PointLight[];
    rafId: number;
  } | null>(null);
  const progressRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const tiltRef = useRef({ current: 0, target: 0 });
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 30, 100);

    // Clock
    const clock = new THREE.Clock();

    // Moon
    const moonGeometry = new THREE.SphereGeometry(30, 32, 32);
    const moonMaterial = new THREE.ShaderMaterial({
      vertexShader: moonVertexShader,
      fragmentShader: moonFragmentShader,
      uniforms: {
        uMoonColor: { value: new THREE.Color(0.9, 0.9, 0.95) },
        uGlowColor: { value: new THREE.Color(0.0, 0.3, 0.5) },
        uGlowStrength: { value: 1.5 },
      },
      transparent: true,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(-40, 60, -200);
    scene.add(moon);

    // Ocean geometry
    const oceanGeometry = new THREE.PlaneGeometry(1000, 500, 100, 100);
    oceanGeometry.rotateX(-Math.PI / 2);

    // Ocean material
    const oceanMaterial = new THREE.ShaderMaterial({
      vertexShader: oceanVertexShader,
      fragmentShader: oceanFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColorWater: { value: new THREE.Vector3(0.03, 0.07, 0.15) },
        uColorSun: { value: new THREE.Vector3(1.0, 0.8, 0.6) },
        uColorSky: { value: new THREE.Vector3(0.01, 0.04, 0.08) },
        uColorHalo: { value: new THREE.Vector3(0.0, 0.5, 0.8) },
        uTiltX: { value: 0.0 },
      },
    });

    const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    scene.add(oceanMesh);

    // Second ocean mesh
    const oceanMesh2 = new THREE.Mesh(oceanGeometry.clone(), oceanMaterial.clone());
    oceanMesh2.position.z = -500;
    scene.add(oceanMesh2);

    // City lights
    const cityLights: THREE.PointLight[] = [];
    const lightColors = [0x00D4FF, 0x8B5CF6, 0xE879F9];
    for (let i = 0; i < 40; i++) {
      const color = lightColors[i % 3];
      const light = new THREE.PointLight(color, 0.3 + Math.random() * 0.4, 100);
      light.position.set(-500 + i * 25 + Math.random() * 10, 2 + Math.random() * 3, -230 + Math.random() * 20);
      light.userData = { originalIntensity: light.intensity };
      scene.add(light);
      cityLights.push(light);
    }

    sceneRef.current = { renderer, scene, camera, clock, material: oceanMaterial, cityLights, rafId: 0 };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      const s = sceneRef.current;
      if (!s) return;

      const time = s.clock.getElapsedTime();

      // Update ocean uniforms
      oceanMaterial.uniforms.uTime.value = time;
      oceanMaterial.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);

      // Lerp tilt
      tiltRef.current.current += (tiltRef.current.target - tiltRef.current.current) * 0.1;
      oceanMaterial.uniforms.uTiltX.value = tiltRef.current.current;
      (oceanMesh2.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (oceanMesh2.material as THREE.ShaderMaterial).uniforms.uTiltX.value = tiltRef.current.current;

      // Twinkle city lights
      cityLights.forEach((light, i) => {
        light.intensity = light.userData.originalIntensity + Math.sin(time * 0.8 + i * 0.5) * 0.15;
      });

      renderer.render(s.scene, s.camera);
      s.rafId = requestAnimationFrame(animate);
    };
    sceneRef.current.rafId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(sceneRef.current?.rafId || 0);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      oceanGeometry.dispose();
      oceanMaterial.dispose();
      cityLights.forEach(l => {
        scene.remove(l);
        l.dispose();
      });
    };
  }, []);

  // ScrollTrigger for card animations and tilt
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion ? false : 0.5,
        pin: innerRef.current,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          // Map progress to tilt
          const p = self.progress;
          let tilt = 0;
          if (p < 0.17) tilt = 0.5 + (p / 0.17) * (-0.2 - 0.5);
          else if (p < 0.32) tilt = -0.2 + ((p - 0.17) / 0.15) * (-0.6 + 0.2);
          else if (p < 0.49) tilt = -0.6;
          else if (p < 0.65) tilt = -0.6 + ((p - 0.49) / 0.16) * (-1.0 + 0.6);
          else if (p < 0.82) tilt = -1.0 + ((p - 0.65) / 0.17) * (-0.6 + 1.0);
          else tilt = -0.6 + ((p - 0.82) / 0.18) * 0.6;
          tiltRef.current.target = tilt;
        },
      },
    });

    // Header fade out
    tl.fromTo('.ocean-header', { opacity: 1 }, { opacity: 0, duration: 0.1 }, 0);

    // Card animations - simplified: cards slide in from below and fade
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const start = 0.05 + i * 0.25;
      const mid = start + 0.12;

      tl.fromTo(card,
        { y: '120vh', opacity: 0, scale: 0.9 },
        { y: '0vh', opacity: 1, scale: 1, duration: 0.15, ease: 'power2.out' },
        start
      );
      tl.to(card,
        { y: '-120vh', opacity: 0, scale: 0.9, duration: 0.1, ease: 'power2.in' },
        mid
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={wrapperRef} id="projects" style={{ height: '300vh', position: 'relative' }}>
      <div
        ref={innerRef}
        style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}
      >
        {/* Ocean Canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, zIndex: 0, width: '100%', height: '100%' }}
        />

        {/* Content Layer */}
        <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }}>
          {/* Section Header */}
          <div className="ocean-header absolute top-0 left-0 w-full text-center pt-[8vh]">
            <h2
              className="font-outfit font-bold text-text-primary"
              style={{ fontSize: 'clamp(36px, 5vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
            >
              Selected Work
            </h2>
            <p className="font-outfit text-lg md:text-xl text-text-secondary mt-4">
              Three projects that define my craft
            </p>
          </div>

          {/* Project Cards */}
          {projects.map((project, i) => (
            <div
              key={project.number}
              ref={el => { cardRefs.current[i] = el; }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[520px]"
              style={{ pointerEvents: 'auto', opacity: 0 }}
            >
              <div
                className="rounded-[20px] p-6"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Project Image */}
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full rounded-xl mb-5"
                  style={{
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                />

                {/* Meta */}
                <span className="font-mono text-sm text-accent-cyan">{project.number}</span>

                {/* Title */}
                <h3
                  className="font-outfit font-bold text-text-primary mt-2"
                  style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.1 }}
                >
                  {project.title}
                </h3>

                {/* Description */}
                <p className="font-outfit text-sm md:text-base text-text-secondary mt-3 line-clamp-2">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-outfit text-accent-cyan"
                      style={{
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        background: 'rgba(0, 212, 255, 0.05)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <a
                  href="#"
                  className="inline-flex items-center gap-2 mt-5 font-outfit font-medium text-[15px] text-accent-cyan hover:text-shadow-[0_0_20px_rgba(0,212,255,0.5)] transition-all duration-300"
                >
                  View Project <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}

          {/* Scroll Progress Indicator */}
          <div
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] hidden md:flex flex-col items-center"
            style={{ pointerEvents: 'none' }}
          >
            <div className="relative w-[2px] h-[120px] bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full rounded-full transition-all duration-100"
                style={{
                  height: '33%',
                  background: 'linear-gradient(180deg, #00D4FF, #8B5CF6)',
                  top: '0%',
                }}
              />
            </div>
            <div className="flex flex-col items-center gap-4 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full border border-text-tertiary"
                  style={{
                    background: i === 0 ? '#00D4FF' : 'transparent',
                    boxShadow: i === 0 ? '0 0 6px rgba(0, 212, 255, 0.5)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
