"use client";

import { useEffect, useRef } from "react";

import { type ConnectionStats, subscribeToConnectionStats, subscribeToGaze } from "@/lib/gaze-socket";
import { cn } from "@/lib/utils";
import {
  calculateGazePoint,
  formatGazeTime,
  normalizeGazePoint,
  type GazePoint,
} from "@/modules/pages/gaze/lib/gaze-helpers";

type StatusVariant = "none" | "compact" | "panel";

type LiveGazeOverlayProps = {
  statusVariant?: StatusVariant;
  hideMarkerWhenNoPoint?: boolean;
  markerClassName?: string;
};

export function LiveGazeOverlay({
  statusVariant = "none",
  hideMarkerWhenNoPoint = false,
  markerClassName,
}: LiveGazeOverlayProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const rateRef = useRef<HTMLSpanElement>(null);
  const rttRef = useRef<HTMLSpanElement>(null);
  const serverTimeRef = useRef<HTMLSpanElement>(null);
  const lastPongRef = useRef<HTMLSpanElement>(null);

  const latestPointRef = useRef<GazePoint | null>(null);
  const normalizedPointRef = useRef<GazePoint | null>(null);
  const latestStatsRef = useRef<ConnectionStats | null>(null);
  const sampleCounterRef = useRef(0);
  const lastRateFrameAtRef = useRef(0);
  const lastValidPointAtRef = useRef(0);

  useEffect(() => {
    const unsubscribeGaze = subscribeToGaze((sample) => {
      const nextPoint = calculateGazePoint(sample);
      if (!nextPoint) {
        return;
      }

      latestPointRef.current = nextPoint;
      lastValidPointAtRef.current = performance.now();
      sampleCounterRef.current += 1;
    });

    const unsubscribeStats =
      statusVariant === "none"
        ? null
        : subscribeToConnectionStats((stats) => {
            latestStatsRef.current = stats;
          });

    let frameId = 0;

    const render = (now: number) => {
      const marker = markerRef.current;
      const latestPoint = latestPointRef.current;
      if (marker) {
        if (latestPoint && now - lastValidPointAtRef.current <= 650) {
          const normalizedPoint = normalizeGazePoint(
            normalizedPointRef.current,
            latestPoint
          );
          normalizedPointRef.current = normalizedPoint;
          marker.style.opacity = "1";
          marker.style.transform = `translate(-50%, -50%) translate(${normalizedPoint.x * 100}vw, ${normalizedPoint.y * 100}vh)`;
        } else {
          normalizedPointRef.current = null;
          marker.style.opacity = hideMarkerWhenNoPoint ? "0" : "0.2";
        }
      }

      if (statusVariant !== "none") {
        const stats = latestStatsRef.current;
        if (statusRef.current && stats) {
          statusRef.current.textContent = stats.status;
        }
        if (rttRef.current && stats) {
          rttRef.current.textContent = stats.lastRttMs === null ? "-" : `${stats.lastRttMs} ms`;
        }
        if (serverTimeRef.current && stats) {
          serverTimeRef.current.textContent = formatGazeTime(stats.lastServerTimeUnixMs);
        }
        if (lastPongRef.current && stats) {
          lastPongRef.current.textContent = formatGazeTime(stats.lastPongAtUnixMs);
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
      }

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribeGaze();
      unsubscribeStats?.();
    };
  }, [hideMarkerWhenNoPoint, statusVariant]);

  return (
    <>
      <div
        ref={markerRef}
        className={cn(
          "pointer-events-none fixed top-0 left-0 z-40 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-cyan-500/55 shadow-[0_0_32px_rgba(0,220,255,0.95)] transition-opacity",
          markerClassName
        )}
        aria-hidden="true"
      />

      {statusVariant === "compact" ? (
        <div className="pointer-events-none fixed top-4 right-4 z-30 rounded-full border border-cyan-400/30 bg-background/85 px-4 py-2 text-xs shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <p>
              eye <span ref={statusRef}>connecting</span>
            </p>
            <p>
              stream <span ref={rateRef}>0 Hz</span>
            </p>
            <p>
              RTT <span ref={rttRef}>-</span>
            </p>
          </div>
        </div>
      ) : null}

      {statusVariant === "panel" ? (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 border-t border-white/15 bg-black/70 px-4 py-3 font-mono text-xs text-white backdrop-blur">
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
      ) : null}
    </>
  );
}
