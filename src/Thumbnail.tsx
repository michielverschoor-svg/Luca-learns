import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TreatShape} from './character/HeadParts';
import {Luca} from './character/Luca';
import {restPose} from './character/pose';
import {BoilContext} from './character/sketch';
import {FONTS} from './fonts';
import {Paper} from './scenes/Paper';
import type {ThumbnailProps} from './thumbnail-props';

export {thumbnailDefaults} from './thumbnail-props';
export type {ThumbnailProps};

const INK = '#3A2A20';

/** 1280x720 YouTube thumbnail: Luca's face huge, a floating treat, bold text. */
export const Thumbnail: React.FC<ThumbnailProps> = ({text, expression, color, badge}) => {
  const pose = {
    ...restPose(expression),
    headTilt: 8,
    look: {x: -0.7, y: -0.6},
    tongue: expression === 'treat-hypnotized' ? 1 : 0,
  };
  return (
    <AbsoluteFill style={{backgroundColor: color}}>
      <AbsoluteFill>
        <svg viewBox="0 0 1280 720" width="100%" height="100%">
          <g transform="translate(860 420)">
            {new Array(14).fill(0).map((_, i) => {
              const a0 = (i / 14) * Math.PI * 2;
              const a1 = a0 + Math.PI / 14;
              return (
                <path
                  key={i}
                  d={`M0 0L${Math.cos(a0) * 1400} ${Math.sin(a0) * 1400}L${Math.cos(a1) * 1400} ${Math.sin(a1) * 1400}Z`}
                  fill="#FFFFFF"
                  opacity={0.18}
                />
              );
            })}
          </g>
        </svg>
      </AbsoluteFill>
      <Paper overlay />
      <AbsoluteFill>
        <BoilContext.Provider value={0}>
          <svg viewBox="0 0 1280 720" width="100%" height="100%">
            {/* Luca's head and chest, very close up, on the right */}
            <Luca pose={pose} x={900} y={1230} scale={2.45} />
            {/* the treat he is staring at, with sparkles */}
            <g transform="translate(560 150) rotate(-14) scale(3.4)">
              <TreatShape />
            </g>
            {[
              [470, 90, 26],
              [680, 70, 18],
              [640, 240, 20],
            ].map(([x, y, r], i) => (
              <path
                key={i}
                d={`M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`}
                fill="#FFE27A"
                stroke={INK}
                strokeWidth={4}
              />
            ))}
          </svg>
        </BoilContext.Provider>
      </AbsoluteFill>
      {/* big text, bottom left */}
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 0 40px 50px'}}>
        <div
          style={{
            fontFamily: FONTS.clean,
            fontWeight: 800,
            // Shrink longer text so it never covers Luca's face.
            fontSize: text.length <= 6 ? 210 : text.length <= 9 ? 150 : 124,
            lineHeight: 0.95,
            color: '#FFE27A',
            WebkitTextStroke: `16px ${INK}`,
            paintOrder: 'stroke fill',
            textShadow: `10px 10px 0 ${INK}`,
            transform: 'rotate(-6deg)',
            transformOrigin: 'left bottom',
            maxWidth: 600,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
      {/* series badge, top left */}
      <AbsoluteFill style={{padding: '34px 0 0 40px'}}>
        <div
          style={{
            alignSelf: 'flex-start',
            background: '#C8342B',
            border: `6px solid ${INK}`,
            borderRadius: 999,
            padding: '6px 30px 10px',
            boxShadow: `6px 6px 0 ${INK}`,
            fontFamily: FONTS.hand,
            fontSize: 54,
            color: '#FFFFFF',
            WebkitTextStroke: `3px ${INK}`,
            paintOrder: 'stroke fill',
            transform: 'rotate(-3deg)',
          }}
        >
          {badge}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
