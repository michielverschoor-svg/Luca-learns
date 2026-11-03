import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Luca} from '../character/Luca';
import {restPose} from '../character/pose';
import {BoilContext, Sketch} from '../character/sketch';
import {FONTS} from '../fonts';
import type {TipCardScene} from '../types';
import {Paper} from './Paper';

const INK = '#3A2A20';
const RED = '#C8342B';

/** The clean recap card at the end of every episode. */
export const TipCard: React.FC<{scene: TipCardScene; episodeLabel: string}> = ({scene, episodeLabel}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cardIn = spring({frame, fps, config: {damping: 16}});
  const stepAt = (i: number) => Math.round((1.2 + i * 1.5) * fps);

  const blinkPhase = frame % Math.round(3.5 * fps);
  const pose = {
    ...restPose('smug'),
    tailWag: 10 * Math.sin(t * 2 * Math.PI * 1.2),
    breathe: Math.sin(t * 2.4),
    blink: blinkPhase < 6 ? 1 - Math.abs(blinkPhase - 3) / 3 : 0,
    headTilt: 6 * Math.sin(t * 0.8),
  };

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill
        style={{
          padding: '0 90px',
          justifyContent: 'center',
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 40}px)`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 1260,
            background: '#FFFCF4',
            border: `3px solid ${INK}`,
            borderRadius: 28,
            boxShadow: '8px 8px 0 rgba(58, 42, 32, 0.14)',
            padding: '56px 70px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.clean,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: RED,
            }}
          >
            Training tip
          </div>
          <div
            style={{
              fontFamily: FONTS.hand,
              fontSize: 86,
              lineHeight: 1.05,
              color: INK,
              marginTop: 6,
              marginBottom: 34,
            }}
          >
            {scene.heading}
          </div>
          {scene.steps.map((step, i) => {
            const s = spring({frame: frame - stepAt(i), fps, config: {damping: 18}});
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 26,
                  marginBottom: 26,
                  opacity: s,
                  transform: `translateX(${(1 - s) * -30}px)`,
                }}
              >
                <div
                  style={{
                    flex: '0 0 auto',
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    background: RED,
                    color: '#FFFCF4',
                    fontFamily: FONTS.clean,
                    fontWeight: 700,
                    fontSize: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{fontFamily: FONTS.clean, fontSize: 38, lineHeight: 1.3, color: INK, paddingTop: 4}}>
                  {step}
                </div>
              </div>
            );
          })}
          <div
            style={{
              marginTop: 18,
              fontFamily: FONTS.clean,
              fontSize: 24,
              color: '#8A6A50',
            }}
          >
            Short sessions · small treats · lots of praise
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill>
        <BoilContext.Provider value={6}>
          <svg viewBox="0 0 1920 1080" width="100%" height="100%">
            <g opacity={interpolate(frame, [10, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <Luca pose={pose} x={1660} y={850} scale={1.0} />
            </g>
            <Sketch d="M1450 900Q1660 890 1880 902" strokeWidth={2} seed="tip-floor" />
            <text x={1660} y={970} textAnchor="middle" fontFamily={FONTS.hand} fontSize={40} fill={INK}>
              {episodeLabel}
            </text>
          </svg>
        </BoilContext.Provider>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
