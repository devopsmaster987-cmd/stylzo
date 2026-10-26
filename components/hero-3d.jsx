'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Hero3DScene = dynamic(() => import('./hero3d.jsx'), { ssr: false, loading: () => null });

/**
 * Should the 3D hero run at all?
 *
 * The scene is decorative and aria-hidden, but it costs ~895 KB of three.js and
 * a permanent 60fps render loop. On a phone or a metered connection that is a
 * real Core Web Vitals cost for something nobody reads, so it only loads when
 * the device can afford it:
 *
 *   - WebGL present: otherwise the skeleton below would never be replaced,
 *     because onCreated only fires once the canvas exists;
 *   - no Data Saver and not a slow connection;
 *   - a viewport big enough that the detail is visible at all.
 *
 * Everything here is a progressive enhancement. The page is complete and
 * identical without it.
 */
function canAfford3d() {
  if (typeof window === 'undefined') return false;

  // WebGL capability. The scene is never loaded otherwise, so a device without
  // it does not pay for three.js at all.
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    // Phones report a WebGL context but render a software rasteriser, which
    // turns the scene into the slowest thing on the page.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return false;
  } catch {
    return false;
  }

  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /^(slow-2g|2g)$/.test(conn.effectiveType)) return false;

  // The scene is decoration beside the h1 and only has a column of its own
  // from 861px up. Below that it would be a tall empty box above the text, so
  // it is hidden in CSS and never loaded.
  if (window.matchMedia('(max-width: 860px)').matches) return false;

  return true;
}

export function Hero3D() {
  const [allowed, setAllowed] = useState(false);
  const [painted, setPainted] = useState(false);

  useEffect(() => { setAllowed(canAfford3d()); }, []);

  // Nothing to wait for: with the scene declined the skeleton must not linger.
  const showSkeleton = allowed && !painted;

  return (
    <div className="hero-3d" aria-hidden="true" data-ready={painted ? 'true' : 'false'}>
      {allowed ? (
        <div id="hero-3d-root">
          <Hero3DScene onReady={() => setPainted(true)} />
        </div>
      ) : null}
      {showSkeleton ? <div className="hero-3d-skeleton" /> : null}
    </div>
  );
}