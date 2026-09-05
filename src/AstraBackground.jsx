import { useEffect, useRef, useState } from 'react';
import { createAstraScene } from './astra/index.js';
import './astra-background.css';

/** A React lifetime around the source Astra renderer. All motion lives in astra/. */
export default function AstraBackground() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let scene;
    let disposed = false;
    const canvas = canvasRef.current;
    const initialize = async () => {
      try {
        scene = createAstraScene(canvas, {
          heroElement: document.querySelector('[data-astra-hero]'),
          contentElement: document.querySelector('[data-astra-content]'),
          cues: [...document.querySelectorAll('[data-astra-scroll-cue]')],
          onError: (error) => {
            if (!disposed) {
              console.error('Astra rendering stopped:', error);
              setStatus('fallback');
            }
          },
        });
        await scene.ready;
        if (!disposed) setStatus('ready');
      } catch (error) {
        if (!disposed) {
          console.error('Astra renderer could not start:', error);
          setStatus('fallback');
        }
      }
    };
    initialize();
    return () => {
      disposed = true;
      scene?.dispose?.();
    };
  }, []);

  return (
    <div className="astra-background" data-astra-backdrop="true" aria-hidden="true">
      <div className="astra-scene" data-astra-scene={status}>
        <canvas ref={canvasRef} data-astra-canvas="true" />
      </div>
      {status !== 'ready' && <img className="astra-poster" src="/assets/astra-poster.webp" alt="" />}
      <div className="astra-ambient" data-astra-ambient="true" />
      <div className="astra-vignette" />
    </div>
  );
}
