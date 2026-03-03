"use client";

import { useEffect, useRef } from "react";
import {
  type ConnectionStats,
  type GazeData,
  subscribeToConnectionStats,
  subscribeToGaze,
} from "@/lib/gaze-socket";

interface Point {
  x: number;
  y: number;
}

function isValidEye(value: string) {
  return value.toLowerCase() === "valid";
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function calculatePoint(sample: GazeData): Point | null {
  const leftValid = isValidEye(sample.leftEyeValidity);
  const rightValid = isValidEye(sample.rightEyeValidity);

  if (leftValid && rightValid) {
    return {
      x: clamp01((sample.leftEyeX + sample.rightEyeX) / 2),
      y: clamp01((sample.leftEyeY + sample.rightEyeY) / 2),
    };
  }

  if (leftValid) {
    return { x: clamp01(sample.leftEyeX), y: clamp01(sample.leftEyeY) };
  }

  if (rightValid) {
    return { x: clamp01(sample.rightEyeX), y: clamp01(sample.rightEyeY) };
  }

  return null;
}

function formatTime(unixMs: number | null) {
  if (!unixMs) {
    return "-";
  }

  return new Date(unixMs).toLocaleTimeString();
}

export default function GazePage() {
  const markerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const rateRef = useRef<HTMLSpanElement>(null);
  const rttRef = useRef<HTMLSpanElement>(null);
  const serverTimeRef = useRef<HTMLSpanElement>(null);
  const lastPongRef = useRef<HTMLSpanElement>(null);

  const latestPointRef = useRef<Point | null>(null);
  const latestStatsRef = useRef<ConnectionStats | null>(null);
  const sampleCounterRef = useRef(0);
  const lastRateFrameAtRef = useRef(0);

  useEffect(() => {
    const unsubscribeGaze = subscribeToGaze((sample) => {
      latestPointRef.current = calculatePoint(sample);
      sampleCounterRef.current += 1;
    });

    const unsubscribeStats = subscribeToConnectionStats((stats) => {
      latestStatsRef.current = stats;
    });

    let frameId = 0;

    const render = (now: number) => {
      const marker = markerRef.current;
      const point = latestPointRef.current;
      if (marker) {
        if (point) {
          marker.style.opacity = "1";
          marker.style.transform = `translate(-50%, -50%) translate(${point.x * 100}vw, ${point.y * 100}vh)`;
        } else {
          marker.style.opacity = "0.2";
        }
      }

      const stats = latestStatsRef.current;
      if (statusRef.current && stats) {
        statusRef.current.textContent = stats.status;
      }
      if (rttRef.current && stats) {
        rttRef.current.textContent = stats.lastRttMs === null ? "-" : `${stats.lastRttMs} ms`;
      }
      if (serverTimeRef.current && stats) {
        serverTimeRef.current.textContent = formatTime(stats.lastServerTimeUnixMs);
      }
      if (lastPongRef.current && stats) {
        lastPongRef.current.textContent = formatTime(stats.lastPongAtUnixMs);
      }

      if (rateRef.current) {
        const lastAt = lastRateFrameAtRef.current;
        if (lastAt === 0) {
          lastRateFrameAtRef.current = now;
        } else {
          const delta = now - lastAt;
          if (delta >= 1000) {
            const hz = Math.round((sampleCounterRef.current * 1000) / delta);
            rateRef.current.textContent = `${hz} Hz`;
            sampleCounterRef.current = 0;
            lastRateFrameAtRef.current = now;
          }
        }
      }

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribeGaze();
      unsubscribeStats();
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,120,160,0.16),rgba(0,0,0,0.94)_45%)]" />
      <div
        ref={markerRef}
        className="pointer-events-none fixed top-0 left-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-cyan-500/55 shadow-[0_0_32px_rgba(0,220,255,0.95)] transition-opacity"
        aria-hidden="true"
      />

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/15 bg-black/70 px-4 py-3 font-mono text-xs backdrop-blur">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-5">
          <p>
            status: <span ref={statusRef}>connecting</span>
          </p>
          <p>
            stream: <span ref={rateRef}>0 Hz</span>
          </p>
          <p>
            last RTT: <span ref={rttRef}>-</span>
          </p>
          <p>
            server time: <span ref={serverTimeRef}>-</span>
          </p>
          <p>
            last pong: <span ref={lastPongRef}>-</span>
          </p>
        </div>
      </div>
    </main>
  );
}
