'use client';

import { useEffect, useState, useRef } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export const PerformanceMonitor = ({ enabled = process.env.NODE_ENV === 'development' }: PerformanceMonitorProps) => {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const measurePerformance = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      frameCountRef.current++;

      if (deltaTime >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / deltaTime);
        const currentFrameTime = deltaTime / frameCountRef.current;

        setFps(currentFps);
        setFrameTime(Math.round(currentFrameTime));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const getPerformanceColor = () => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="performance-monitor">
      <div className={`font-mono text-xs ${getPerformanceColor()}`}>FPS: {fps}</div>
      <div className="font-mono text-xs text-gray-300">Frame: {frameTime}ms</div>
    </div>
  );
};
