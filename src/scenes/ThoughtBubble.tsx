import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {PENCIL} from '../character/sketch';
import {FONTS} from '../fonts';

/** Strong colours so bold white text stands out. */
export const BUBBLE_COLORS = ['#FF7A59', '#2FA3E6', '#F2549B', '#22B573', '#8B6CE6', '#FF9A1F'];

const FONT_SIZE = 46;
const LINE_H = 58;
const MAX_TEXT_W = 560;
const CHAR_W = 25;

/** Rough text box size for the hand-lettered font. */
const measure = (text: string) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length * CHAR_W > MAX_TEXT_W && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  const longest = Math.max(...lines.map((l) => l.length));
  return {w: Math.min(MAX_TEXT_W, longest * CHAR_W) + 110, h: lines.length * LINE_H + 90};
};

type Props = {
  text: string;
  /** Luca's head on screen (canvas coordinates) and its radius on screen. */
  head: {x: number; y: number; r: number};
  color: string;
  /** Canvas size; defaults to 1920x1080 (landscape episodes). */
  canvas?: {w: number; h: number};
  /** Extra shift of the cloud (e.g. to keep it off something important). */
  offset?: {x: number; y: number};
  /** Force the cloud to one side of his head. */
  side?: 'left' | 'right';
  /** A point on screen the cloud should not cover (the treat in the hand). */
  avoid?: {x: number; y: number} | null;
  /** Frames (relative to the current sequence) the bubble is shown. */
  from: number;
  to: number;
};

/**
 * Luca's inner monologue as a scalloped thought cloud beside his head, with
 * three little bubbles trailing back to him.
 */
export const ThoughtBubble: React.FC<Props> = ({text, head, color, from, to, avoid, canvas = {w: 1920, h: 1080}, side, offset = {x: 0, y: 0}}) => {
  const W = canvas.w;
  const H = canvas.h;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < from || frame > to) return null;
  const local = frame - from;
  const pop = spring({frame: local, fps, config: {damping: 10, stiffness: 150}});
  const out = interpolate(frame, [to - 6, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bob = 6 * Math.sin((frame / fps) * 2.2);

  const {w, h} = measure(text);
  // Put the cloud on the roomier side of his head, a little above it.
  const place = (right: boolean) => ({
    cx: Math.min(W - 20 - w / 2, Math.max(20 + w / 2, head.x + (right ? 1 : -1) * (head.r + w / 2 + 30) + offset.x)),
    cy: Math.min(H - 20 - h / 2, Math.max(20 + h / 2, head.y - head.r * 0.9 - h * 0.25 + offset.y)),
  });
  const covers = (p: {cx: number; cy: number}) =>
    !!avoid && Math.abs(avoid.x - p.cx) < w / 2 + 70 && Math.abs(avoid.y - p.cy) < h / 2 + 90;
  let spot = place(side ? side === 'right' : head.x < W / 2);
  if (covers(spot)) {
    const other = place(!(side ? side === 'right' : head.x < W / 2));
    if (!covers(other)) spot = other;
  }
  const cx = spot.cx;
  const cy = spot.cy + bob;

  // Scalloped edge: circles around an ellipse.
  const rx = w / 2;
  const ry = h / 2;
  const n = Math.max(10, Math.round((Math.PI * (rx + ry)) / 62));
  const bumps = new Array(n).fill(0).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {x: Math.cos(a) * (rx - 18), y: Math.sin(a) * (ry - 18), r: 32 + (i % 2) * 6};
  });

  // Trail from the cloud's edge toward his head.
  const dist = Math.hypot(head.x - cx, head.y - cy) || 1;
  const ux = (head.x - cx) / dist;
  const uy = (head.y - cy) / dist;
  // Start just outside the cloud, stop just outside his head.
  const edge = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry)) + 24;
  const ex = cx + ux * edge;
  const ey = cy + uy * edge;
  const hx = head.x - ux * head.r * 1.05;
  const hy = head.y - uy * head.r * 1.05;
  const trail = [0.15, 0.5, 0.85].map((t, i) => ({
    x: ex + (hx - ex) * t,
    y: ey + (hy - ey) * t,
    r: [20, 13, 8][i],
  }));

  const origin = `${head.x} ${head.y}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{position: 'absolute', inset: 0, overflow: 'visible'}}
    >
      <g opacity={out} transform={`translate(${origin}) scale(${pop}) translate(${-head.x} ${-head.y})`}>
        {trail.map((b, i) => (
          <g key={i} opacity={interpolate(local, [i * 2, i * 2 + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <circle cx={b.x} cy={b.y} r={b.r + 4} fill={PENCIL} />
            <circle cx={b.x} cy={b.y} r={b.r} fill={color} />
          </g>
        ))}
        <g transform={`translate(${cx} ${cy})`}>
          {/* hard shadow */}
          <g transform="translate(9 9)" opacity={0.22}>
            <ellipse rx={rx} ry={ry} fill={PENCIL} />
            {bumps.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={PENCIL} />
            ))}
          </g>
          {/* outline pass, then fill pass, so the scallops merge into one cloud */}
          <ellipse rx={rx + 5} ry={ry + 5} fill={PENCIL} />
          {bumps.map((b, i) => (
            <circle key={`o${i}`} cx={b.x} cy={b.y} r={b.r + 5} fill={PENCIL} />
          ))}
          <ellipse rx={rx} ry={ry} fill={color} />
          {bumps.map((b, i) => (
            <circle key={`f${i}`} cx={b.x} cy={b.y} r={b.r} fill={color} />
          ))}
          {/* little shine */}
          <path d={`M${-rx * 0.62} ${-ry * 0.35}q${rx * 0.12} ${-ry * 0.32} ${rx * 0.34} ${-ry * 0.36}`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.7} />
          <foreignObject x={-rx + 40} y={-ry + 30} width={w - 80} height={h - 60}>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: FONTS.clean,
                fontWeight: 800,
                fontSize: FONT_SIZE,
                lineHeight: `${LINE_H}px`,
                color: '#FFFFFF',
                WebkitTextStroke: `7px ${PENCIL}`,
                paintOrder: 'stroke fill',
              }}
            >
              {text}
            </div>
          </foreignObject>
        </g>
      </g>
    </svg>
  );
};
