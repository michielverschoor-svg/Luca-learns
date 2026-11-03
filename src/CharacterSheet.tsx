import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Luca} from './character/Luca';
import {restPose} from './character/pose';
import {Platypus} from './character/BodyParts';
import {Paper} from './scenes/Paper';
import {EXPRESSIONS} from './types';
import {FONTS} from './fonts';

/** A reference sheet with every expression, handy in the Studio. */
export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        {EXPRESSIONS.map((e, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 240 + col * 480;
          const y = 470 + row * 500;
          const pose = {...restPose(e), tailWag: 10 * Math.sin(t * 6), breathe: Math.sin(t * 2)};
          return (
            <g key={e}>
              <Luca pose={pose} x={x} y={y} scale={0.95} />
              <text x={x} y={y + 50} textAnchor="middle" fontFamily={FONTS.hand} fontSize={40} fill="#3A2A20">
                {e}
              </text>
            </g>
          );
        })}
        <g transform="translate(1680 920)">
          <Platypus scale={1.4} />
        </g>
        <text x={1680} y={980} textAnchor="middle" fontFamily={FONTS.hand} fontSize={40} fill="#3A2A20">
          platypus
        </text>
      </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
