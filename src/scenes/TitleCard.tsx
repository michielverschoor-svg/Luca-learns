import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Platypus} from '../character/BodyParts';
import {Luca} from '../character/Luca';
import {restPose} from '../character/pose';
import {FONTS} from '../fonts';
import type {TitleCardScene} from '../types';
import {Paper} from './Paper';

const INK = '#3A2A20';
const LETTER_COLORS = ['#FF7A59', '#2FA3E6', '#22B573', '#F2549B', '#8B6CE6', '#FF9A1F'];

/** Opening title: "Luca Learns" with bouncing letters, the episode name on a red ribbon, and Luca. */
export const TitleCard: React.FC<{scene: TitleCardScene; sfx?: Record<string, string>}> = ({scene, sfx = {}}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const series = scene.series ?? 'Luca Learns';
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ribbon = spring({frame: frame - 14, fps, config: {damping: 9, stiffness: 140}});
  const lucaIn = spring({frame: frame - 6, fps, config: {damping: 11}});
  const pose = {
    ...restPose('smug'),
    tailWag: 16 * Math.sin(t * 2 * Math.PI * 2.4),
    headTilt: 8 * Math.sin(t * 2.2),
    breathe: Math.sin(t * 3),
    earBounce: 6 * Math.max(0, Math.sin(t * 6)),
  };
  const ribbonDelayFrame = 14;

  return (
    <AbsoluteFill style={{backgroundColor: '#FFD23F', opacity: out}}>
      {sfx.chime ? <Html5Audio src={staticFile(sfx.chime)} volume={0.55} /> : null}
      {sfx.boing ? (
        <Sequence from={ribbonDelayFrame} layout="none">
          <Html5Audio src={staticFile(sfx.boing)} volume={0.5} />
        </Sequence>
      ) : null}
      {/* sunburst */}
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <g transform={`translate(960 640) rotate(${t * 8})`}>
            {new Array(16).fill(0).map((_, i) => {
              const a0 = (i / 16) * Math.PI * 2;
              const a1 = a0 + Math.PI / 16;
              return (
                <path
                  key={i}
                  d={`M0 0L${Math.cos(a0) * 1600} ${Math.sin(a0) * 1600}L${Math.cos(a1) * 1600} ${Math.sin(a1) * 1600}Z`}
                  fill="#FFE77A"
                />
              );
            })}
          </g>
          {/* paw-print confetti */}
          {new Array(10).fill(0).map((_, i) => {
            const x = 120 + ((i * 197) % 1700);
            const y = 90 + ((i * 331) % 900) + 10 * Math.sin(t * 2 + i);
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${i * 37}) scale(0.9)`} opacity={0.45}>
                <ellipse cx={0} cy={10} rx={16} ry={13} fill="#FF9A1F" />
                <circle cx={-14} cy={-10} r={6} fill="#FF9A1F" />
                <circle cx={-4} cy={-17} r={6} fill="#FF9A1F" />
                <circle cx={8} cy={-16} r={6} fill="#FF9A1F" />
                <circle cx={16} cy={-7} r={6} fill="#FF9A1F" />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
      <Paper overlay />

      {/* "Luca Learns" with letters popping in one by one */}
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <div style={{display: 'flex', fontFamily: FONTS.hand, fontSize: 210, lineHeight: 1}}>
          {[...series].map((ch, i) => {
            const s = spring({frame: frame - i * 2, fps, config: {damping: 8, stiffness: 170}});
            const bounce = 8 * Math.sin(t * 4 + i * 0.6);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: ch === ' ' ? 60 : undefined,
                  color: LETTER_COLORS[i % LETTER_COLORS.length],
                  WebkitTextStroke: `10px ${INK}`,
                  paintOrder: 'stroke fill',
                  textShadow: `8px 8px 0 ${INK}`,
                  transform: `translateY(${(1 - s) * -220 + bounce}px) scale(${0.4 + 0.6 * s}) rotate(${(i % 2 ? 1 : -1) * 4}deg)`,
                  opacity: Math.min(1, s * 2),
                }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            );
          })}
        </div>

        {/* episode ribbon */}
        <div
          style={{
            marginTop: 18,
            transform: `scale(${ribbon}) rotate(-3deg)`,
            background: '#C8342B',
            border: `7px solid ${INK}`,
            borderRadius: 18,
            padding: '6px 56px 12px',
            boxShadow: `10px 10px 0 ${INK}`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 26,
          }}
        >
          {scene.episodeLabel ? (
            <span style={{fontFamily: FONTS.clean, fontWeight: 800, fontSize: 40, color: '#FFE27A', letterSpacing: 3, textTransform: 'uppercase'}}>
              {scene.episodeLabel}
            </span>
          ) : null}
          <span
            style={{
              fontFamily: FONTS.hand,
              fontSize: 110,
              color: '#FFFFFF',
              WebkitTextStroke: `6px ${INK}`,
              paintOrder: 'stroke fill',
              lineHeight: 1,
            }}
          >
            {scene.title}
          </span>
        </div>
      </AbsoluteFill>

      {/* Luca and his platypus */}
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <g transform={`translate(0 ${(1 - lucaIn) * 500})`}>
            <ellipse cx={1010} cy={1062} rx={330} ry={26} fill={INK} opacity={0.12} />
            <Luca pose={pose} x={960} y={1060} scale={0.98} />
            <g transform="translate(1290 1060)">
              <Platypus scale={1.25} rotate={-6} />
            </g>
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
