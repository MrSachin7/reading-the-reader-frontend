import type { CalibrationPointPayload } from "@/redux"

export function CalibrationPlot({ points }: { points: CalibrationPointPayload[] }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full rounded-lg border bg-slate-950/90">
      <defs>
        <radialGradient id="plotGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.32)" />
          <stop offset="100%" stopColor="rgba(2,6,23,0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#plotGlow)" />

      {points.map((point) => {
        const centroidX = point.centroidX === null ? null : point.centroidX * 100
        const centroidY = point.centroidY === null ? null : point.centroidY * 100
        const targetX = point.targetX * 100
        const targetY = point.targetY * 100

        return (
          <g key={point.pointId}>
            <circle
              cx={targetX}
              cy={targetY}
              r="3.5"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="0.8"
            />
            {centroidX !== null && centroidY !== null ? (
              <>
                <line
                  x1={targetX}
                  y1={targetY}
                  x2={centroidX}
                  y2={centroidY}
                  stroke="rgba(34,211,238,0.8)"
                  strokeWidth="0.9"
                />
                <circle cx={centroidX} cy={centroidY} r="2.4" fill="rgba(34,211,238,1)" />
              </>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
