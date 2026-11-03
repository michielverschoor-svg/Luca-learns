import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Luca} from '../character/Luca';
import {restPose} from '../character/pose';
import {FONTS} from '../fonts';
import type {StepCardScene} from '../types';
import {Paper} from './Paper';

const INK = '#3A2A20';
const BG = ['#8FD3F4', '#FFD23F', '#7ED6A5', '#FF8FB1', '#B79CF2'];
const BADGE = ['#FF7A59', '#5CC8C0', '#FF7A59', '#5CC8C0', '#FF7A59'];

/** "Step N" card: a bright full-screen title between lesson scenes. */
export const StepCard: React.FC<{scene: StepCardScene; sfx?: Record<string, string>}> = ({scene, sfx = {}}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const i = (scene.step - 1) % BG.length;
  const badge = spring({frame, fps, config: {damping: 8, stiffness: 160}});
  const text = spring({frame: frame - 6, fps, config: {damping: 14}});
  const peek = spring({frame: frame - 10, fps, config: {damping: 12}});
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pose = {
    ...restPose('curious'),
    tailWag: 14 * Math.sin(t * 2 * Math.PI * 2),
    headTilt: 10 * Math.sin(t * 2),
    breathe: Math.sin(t * 3),
  };

  return (
    <AbsoluteFill style={{backgroundColor: BG[i], opacity: out}}>
      {sfx.chime ? <Html5Audio src={staticFile(sfx.chime)} volume={0.5} /> : null}
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          {new Array(18).fill(0).map((_, k) => (
            <circle
              key={k}
              cx={random(`sx${k}`) * 1920}
              cy={random(`sy${k}`) * 1080 + 8 * Math.sin(t * 2 + k)}
              r={14 + random(`sr${k}`) * 22}
              fill="#FFFDF7"
              opacity={0.35}
            />
          ))}
        </svg>
      </AbsoluteFill>
      <Paper overlay />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 120}}>
        <div
          style={{
            transform: `scale(${badge}) rotate(-4deg)`,
            background: BADGE[i],
            border: `7px solid ${INK}`,
            borderRadius: 999,
            padding: '10px 56px 14px',
            boxShadow: `10px 10px 0 ${INK}`,
            fontFamily: FONTS.hand,
            fontSize: 120,
            color: '#FFFDF7',
            WebkitTextStroke: `3px ${INK}`,
          }}
        >
          Step {scene.step}
        </div>
        <div
          style={{
            marginTop: 50,
            maxWidth: 1300,
            opacity: text,
            transform: `translateY(${(1 - text) * 30}px)`,
            background: '#FFFDF7',
            border: `6px solid ${INK}`,
            borderRadius: 28,
            padding: '26px 48px',
            boxShadow: `10px 10px 0 ${BADGE[(i + 1) % BADGE.length]}`,
            fontFamily: FONTS.clean,
            fontWeight: 700,
            fontSize: 54,
            lineHeight: 1.25,
            color: INK,
            textAlign: 'center',
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          {/* Luca peeks in from the bottom right corner */}
          <g transform={`translate(0 ${(1 - peek) * 420})`}>
            <Luca pose={pose} x={1700} y={1260} scale={1.05} />
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
