import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Luca} from '../character/Luca';
import {restPose} from '../character/pose';
import {BoilContext, Sketch} from '../character/sketch';
import {FONTS} from '../fonts';
import type {TipCardScene} from '../types';
import {Paper} from './Paper';

const INK = '#3A2A20';
const RED = '#C8342B';
const STEP_COLORS = ['#FF7A59', '#5CC8C0', '#B79CF2', '#FFAE57', '#FF8FB1'];
const CONFETTI = ['#FF7A59', '#FFD23F', '#5CC8C0', '#B79CF2', '#FF8FB1', '#7ED6A5', '#8FD3F4'];

/** The clean recap card at the end of every episode. */
export const TipCard: React.FC<{scene: TipCardScene; episodeLabel: string}> = ({scene, episodeLabel}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cardIn = spring({frame, fps, config: {damping: 16}});
  const stepAt = (i: number) => Math.round((0.8 + i * 1.1) * fps);

  const blinkPhase = frame % Math.round(3.5 * fps);
  const pose = {
    ...restPose('smug'),
    tailWag: 10 * Math.sin(t * 2 * Math.PI * 1.2),
    breathe: Math.sin(t * 2.4),
    blink: blinkPhase < 6 ? 1 - Math.abs(blinkPhase - 3) / 3 : 0,
    headTilt: 6 * Math.sin(t * 0.8),
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#FFE9A8'}}>
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          {new Array(60).fill(0).map((_, i) => {
            const x = random(`cx${i}`) * 1920;
            const y = ((random(`cy${i}`) * 1180 + frame * (0.6 + random(`cv${i}`) * 0.8)) % 1180) - 50;
            const rot = random(`cr${i}`) * 360 + frame * 2;
            return (
              <rect
                key={i}
                x={-9}
                y={-5}
                width={18}
                height={10}
                rx={3}
                fill={CONFETTI[i % CONFETTI.length]}
                transform={`translate(${x} ${y}) rotate(${rot})`}
                opacity={0.85}
              />
            );
          })}
        </svg>
      </AbsoluteFill>
      <Paper overlay />
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
            background: '#FFFDF7',
            border: `6px solid ${INK}`,
            borderRadius: 32,
            boxShadow: '14px 14px 0 #FF7A59',
            padding: '56px 70px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.clean,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#FFFDF7',
              background: '#5CC8C0',
              display: 'inline-block',
              padding: '6px 18px',
              borderRadius: 999,
              border: `4px solid ${INK}`,
            }}
          >
            Training tip
          </div>
          <div
            style={{
              fontFamily: FONTS.hand,
              fontSize: 96,
              lineHeight: 1.05,
              color: RED,
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
                    background: STEP_COLORS[i % STEP_COLORS.length],
                    border: `4px solid ${INK}`,
                    boxSizing: 'border-box',
                    color: INK,
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
              fontSize: 26,
              fontWeight: 700,
              color: '#FF7A59',
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
