'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

const Hero3DScene = dynamic(() => import('./hero3d.jsx'), { ssr: false, loading: () => null });

export function Hero3D() {
  const [revealed, setRevealed] = useState(false);
  const [painted, setPainted] = useState(false);

  useEffect(() => { setRevealed(true); }, []);

  const handleCreated = useCallback(() => setPainted(true), []);

  return (
    <div className="hero-3d" aria-hidden="true" data-ready={revealed ? 'true' : 'false'}>
      <div id="hero-3d-root"><Hero3DScene onReady={handleCreated} /></div>
      {!painted && <div className="hero-3d-skeleton" />}
    </div>
  );
}