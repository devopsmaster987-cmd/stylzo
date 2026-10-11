'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

/**
 * Stop rendering when the hero is scrolled out of view or the tab is hidden.
 *
 * useFrame runs on every animation frame for the life of the page. On a long
 * page the hero is above the fold for a few seconds and then invisible for the
 * rest of the visit, so continuing to burn a GPU for it costs battery and holds
 * the main thread busy for the text the visitor actually came to read.
 */
function useInView(ref) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== 'function') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

function Scene({ reduced, active }) {
  const count = useMemo(() => 460, []);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 3.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(phi) * 0.5;
    }
    return arr;
  }, [count]);

  const particleRef = useRef();
  const knotRef = useRef();
  const elapsed = useRef(0);

  // Every increment is scaled by delta so the motion runs at the same speed on a
  // 60Hz laptop and a 144Hz monitor, and is clamped so returning to a backgrounded
  // tab never jumps the scene forward by a whole second.
  useFrame((_, delta) => {
    if (!active || document.hidden || reduced) return;
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;

    if (particleRef.current) {
      particleRef.current.rotation.y += dt * 0.12;
      particleRef.current.rotation.x = Math.sin(elapsed.current * 0.15) * 0.06;
    }

    if (knotRef.current) {
      knotRef.current.rotation.y += dt * 0.32;
      knotRef.current.rotation.x += dt * 0.2;
      knotRef.current.position.y = 0.35 + Math.sin(elapsed.current * 0.9) * 0.07;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} />
      <pointLight position={[-5, 1, 3]} intensity={38} color="#8f7bff" />

      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#8f7bff"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <mesh ref={knotRef} position={[1.9, 0.35, 0]} scale={1.05}>
        <torusKnotGeometry args={[1, 0.26, 150, 24]} />
        <meshStandardMaterial color="#e02fa0" roughness={0.3} metalness={0.35} />
      </mesh>
    </>
  );
}

export default function Hero3DScene({ onReady }) {
  const reduced = useReducedMotion();
  const host = useRef(null);
  const inView = useInView(host);

  return (
    // `frameloop="never"` while off-screen stops three.js scheduling frames
    // entirely, rather than running useFrame and returning early every frame.
    // Tab visibility is handled inside useFrame instead of here, because it is
    // not React state and reading document.hidden during render is not safe.
    <div ref={host} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [1, 0.5, 6.5], fov: 55 }}
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={onReady}
      >
        <Scene reduced={reduced} active={inView} />
      </Canvas>
    </div>
  );
}