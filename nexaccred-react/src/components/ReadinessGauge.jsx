import React, { useEffect, useState } from 'react';
import { BAND_LABEL, DEFAULT_THRESHOLDS } from '../lib/readiness';

/**
 * The readiness gauge.
 *
 * A calibrated arc instrument rather than a donut or a bare percentage — the product's
 * whole premise is "are we calibrated to pass inspection", so the dial makes that
 * metaphor literal instead of decorative. This is the one deliberate signature element;
 * everything else in the UI stays quiet.
 *
 * Zone boundaries follow the configured thresholds, so editing them in the Methodology
 * screen visibly re-bands the dial.
 */

const BAND_INK = {
  green: '#059669',
  yellow: '#B45309',
  orange: '#C2410C',
  red: '#DC2626',
};

const ZONE_FILL = { red: '#FECACA', orange: '#FED7AA', yellow: '#FDE68A', green: '#A7F3D0' };

const CX = 110;
const CY = 112;
const R = 92;

const polar = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx, cy, r, startAngle, endAngle) => {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

const angleFor = (v) => -90 + (v / 100) * 180;

export default function ReadinessGauge({ score, band, thresholds = DEFAULT_THRESHOLDS }) {
  const [needleAngle, setNeedleAngle] = useState(-90);

  // Sweep the needle in from zero on mount / score change.
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setNeedleAngle(angleFor(score)))
    );
    return () => cancelAnimationFrame(id);
  }, [score]);

  const ink = BAND_INK[band] || BAND_INK.red;

  const zones = [
    { v0: 0, v1: thresholds.notYetReady, color: ZONE_FILL.red },
    { v0: thresholds.notYetReady, v1: thresholds.risks, color: ZONE_FILL.orange },
    { v0: thresholds.risks, v1: thresholds.ready, color: ZONE_FILL.yellow },
    { v0: thresholds.ready, v1: 100, color: ZONE_FILL.green },
  ];

  const ticks = [0, thresholds.notYetReady, thresholds.risks, thresholds.ready, 100];

  return (
    <div className="relative h-[132px] w-[220px]">
      <svg viewBox="0 0 220 132" width="220" height="132">
        {zones.map((z, i) => (
          <path
            key={i}
            d={arcPath(CX, CY, R, angleFor(z.v0), angleFor(z.v1))}
            fill="none"
            stroke={z.color}
            strokeWidth="14"
          />
        ))}
        {ticks.map((v, i) => {
          const p1 = polar(CX, CY, R - 9, angleFor(v));
          const p2 = polar(CX, CY, R + 9, angleFor(v));
          return (
            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fff" strokeWidth="2" />
          );
        })}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${needleAngle}deg)`,
            transition: 'transform 1.1s cubic-bezier(.22,1.4,.36,1)',
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - (R - 4)}
            stroke={ink}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <circle cx={CX} cy={CY} r="5.5" fill={ink} />
      </svg>
      <div className="absolute inset-x-0 bottom-1.5 text-center">
        <div className="text-[34px] font-extrabold leading-none tracking-tight" style={{ color: ink }}>
          {score}%
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase" style={{ color: ink }}>
          {BAND_LABEL[band]}
        </div>
      </div>
    </div>
  );
}
