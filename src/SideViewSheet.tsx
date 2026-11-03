import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {LucaSide} from './character/LucaSide';
import {restPose} from './character/pose';
import {Sketch} from './character/sketch';
import {FONTS} from './fonts';
import {Paper} from './scenes/Paper';

/** Side-view reference: fixed poses on top, a looping stand -> sit below. */
export const SideViewSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const poses = [
    {label: 'standing', stand: 1, bow: 0},
    {label: 'halfway', stand: 0.5, bow: 0},
    {label: 'sitting', stand: 0, bow: 0},
    {label: 'play bow', stand: 1, bow: 1},
  ];
  // Loop: stand 1s, drop into the sit, hold, get back up.
  const cycle = frame % (5 * fps);
  const drop = interpolate(cycle, [1 * fps, 1.45 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const rise = interpolate(cycle, [4 * fps, 4.6 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stand = cycle < 4 * fps ? drop : rise;
  const land = cycle - 1.45 * fps;
  const squash = land > 0 && land < 6 ? 1 - 0.07 * Math.sin((Math.PI * land) / 6) : 1;
  const live = {
    ...restPose(stand < 0.5 ? 'smug' : 'curious'),
    stand,
    squash,
    tailWag: 10 * Math.sin(t * 7),
    breathe: Math.sin(t * 2.4),
  };
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          {poses.map((p, i) => {
            const x = 260 + i * 470;
            return (
              <g key={p.label}>
                <LucaSide pose={{...restPose('curious'), stand: p.stand, bow: p.bow}} x={x} y={430} scale={1.0} />
                <text x={x} y={490} textAnchor="middle" fontFamily={FONTS.hand} fontSize={40} fill="#3A2A20">
                  {p.label}
                </text>
              </g>
            );
          })}
          <Sketch d="M560 960Q960 952 1360 962" strokeWidth={2.2} seed="side-floor" />
          <LucaSide pose={live} x={960} y={955} scale={1.45} flip />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
