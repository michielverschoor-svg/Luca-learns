import React, {useMemo} from 'react';
import {AbsoluteFill, random} from 'remotion';
import {PAPER} from '../character/sketch';

/** Warm paper: flat colour, a soft vignette and fixed pencil-dust speckles. */
export const Paper: React.FC = () => {
  const specks = useMemo(
    () =>
      new Array(260).fill(0).map((_, i) => ({
        x: random(`px${i}`) * 1920,
        y: random(`py${i}`) * 1080,
        len: 2 + random(`pl${i}`) * 7,
        a: random(`pa${i}`) * 180,
        o: 0.05 + random(`po${i}`) * 0.1,
      })),
    [],
  );
  return (
    <AbsoluteFill style={{backgroundColor: PAPER}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="paper-vignette" cx="50%" cy="48%" r="75%">
            <stop offset="60%" stopColor="#E9D7B0" stopOpacity={0} />
            <stop offset="100%" stopColor="#D9C095" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        {specks.map((s, i) => (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={s.x + Math.cos((s.a * Math.PI) / 180) * s.len}
            y2={s.y + Math.sin((s.a * Math.PI) / 180) * s.len}
            stroke="#8A6A44"
            strokeWidth={1}
            opacity={s.o}
            strokeLinecap="round"
          />
        ))}
        <rect x={0} y={0} width={1920} height={1080} fill="url(#paper-vignette)" />
      </svg>
    </AbsoluteFill>
  );
};
