import React, {createContext, useContext} from 'react';
import {random, useCurrentFrame} from 'remotion';

export const PENCIL = '#3A2A20';
export const HATCH = '#8A5A24';
export const PAPER = '#F6EEDC';

/** Frames per "line boil" step. 0 disables the boil (perfectly still lines). */
export const BoilContext = createContext(4);

const useBoil = (seed: string) => {
  const step = useContext(BoilContext);
  const frame = useCurrentFrame();
  if (step <= 0) return {dx: 0, dy: 0};
  const k = Math.floor(frame / step);
  return {
    dx: (random(`${seed}-x-${k}`) - 0.5) * 1.4,
    dy: (random(`${seed}-y-${k}`) - 0.5) * 1.4,
  };
};

type SketchProps = {
  /** Outline path. Also used as the fill shape unless `fillD` is given. */
  d: string;
  fill?: string;
  /** Shape to fill when the outline is an open path. */
  fillD?: string;
  /** Extra stroke-only detail drawn with the doubled pencil line (fur tufts, toes). */
  detail?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  /** Offset of the loose fill relative to the line. */
  fillOffset?: [number, number];
  seed?: string;
  stroke?: string;
};

/**
 * The house pencil style from luca-sketch.svg: a fill slightly offset from the
 * line, a main pencil stroke, and a faint second stroke a couple of pixels off.
 */
export const Sketch: React.FC<SketchProps> = ({
  d,
  fill,
  fillD,
  detail,
  strokeWidth = 2.6,
  fillOpacity = 0.92,
  fillOffset = [4, 3],
  seed,
  stroke = PENCIL,
}) => {
  const boil = useBoil(seed ?? d.slice(0, 24));
  const lines = detail ? `${d} ${detail}` : d;
  return (
    <g>
      {fill ? (
        <path
          d={fillD ?? d}
          fill={fill}
          opacity={fillOpacity}
          transform={`translate(${fillOffset[0]} ${fillOffset[1]})`}
        />
      ) : null}
      <path
        d={lines}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={lines}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.38}
        opacity={0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${2 + boil.dx} ${-1.5 + boil.dy})`}
      />
    </g>
  );
};

/** Light brown pencil hatching. */
export const Hatch: React.FC<{d: string; opacity?: number; color?: string; width?: number}> = ({
  d,
  opacity = 0.65,
  color = HATCH,
  width = 1.2,
}) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={width}
    opacity={opacity}
    strokeLinecap="round"
  />
);

/** A hand-drawn straight line: a single quadratic with a tiny sideways wobble. */
export const wobbleLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: string,
  amount = 3,
): string => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const off = (random(seed) - 0.5) * 2 * amount;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${(mx + nx * off).toFixed(1)} ${(my + ny * off).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

/** A closed hand-drawn rectangle. */
export const wobbleRect = (x: number, y: number, w: number, h: number, seed: string, amount = 3) => {
  const pts: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  let d = `M${x} ${y}`;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 4];
    const seg = wobbleLine(ax, ay, bx, by, `${seed}-${i}`, amount);
    d += seg.slice(seg.indexOf('Q'));
  }
  return `${d}Z`;
};
