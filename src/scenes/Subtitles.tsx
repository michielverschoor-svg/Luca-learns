import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS} from '../fonts';

/** Luca's inner monologue, shown as a subtitle card at the bottom of the frame. */
export const Subtitles: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const inStart = Math.round(0.25 * fps);
  const outEnd = durationInFrames - 2;
  const opacity = interpolate(
    frame,
    [inStart, inStart + 8, outEnd - 8, outEnd],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const rise = interpolate(frame, [inStart, inStart + 10], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64}}>
      <div
        style={{
          opacity,
          transform: `translateY(${rise}px)`,
          maxWidth: 1380,
          padding: '18px 40px 20px',
          background: '#FFFDF7',
          border: '5px solid #3A2A20',
          borderRadius: '22px 30px 24px 28px / 28px 22px 30px 24px',
          boxShadow: '8px 8px 0 #FF7A59',
          fontFamily: FONTS.hand,
          fontSize: 62,
          lineHeight: 1.15,
          color: '#3A2A20',
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
