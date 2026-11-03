import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Bandana,
  Chest,
  FrontLeg,
  FrontPaw,
  Haunch,
  HindPaw,
  Shadow,
  Tail,
  Torso,
} from './BodyParts';
import {FACES} from './expressions';
import {Ear, Eyes, FaceExtras, NoseMouth, Skull} from './HeadParts';
import type {LucaPose} from './pose';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Head group: ears, skull, eyes, nose and mouth, plus expression extras. */
export const Head: React.FC<{pose: LucaPose}> = ({pose}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const face = FACES[pose.expression];
  const tilt = face.tilt + pose.headTilt;
  const [earL, earR] = face.ears;
  const lift = pose.earBounce + 6 * pose.tipBack;
  return (
    <g
      transform={`translate(340 228) rotate(-9) rotate(${tilt} 0 70) translate(0 ${-12 * pose.tipBack})`}
    >
      <Ear side="left" lift={earL + lift} />
      <Ear side="right" lift={earR + lift} />
      <g transform={`translate(0 -84) scale(1 ${1 - 0.06 * pose.tipBack}) translate(0 84)`}>
        <Skull />
      </g>
      <Eyes face={face} pose={pose} />
      <NoseMouth face={face} pose={pose} />
      {/* keep the Zzz upright even when he tips over */}
      <FaceExtras face={face} frame={frame} fps={fps} upright={9 - tilt - pose.lean} />
    </g>
  );
};

type LucaProps = {
  pose: LucaPose;
  /** Where the middle of his paws touches the ground, in the parent's coordinates. */
  x: number;
  y: number;
  scale: number;
  flip?: boolean;
};

/**
 * Luca, split into layered groups that can move on their own:
 * shadow, tail, hind legs and paws, body, front legs and paws, bandana, head
 * (ears, eyes, nose and mouth).
 */
export const Luca: React.FC<LucaProps> = ({pose, x, y, scale, flip}) => {
  const {stand, bow, reach} = pose;
  const air = clamp(-pose.bodyY / 500, 0, 0.5);
  const spinX = Math.sign(pose.spin || 1) * Math.max(0.06, Math.abs(pose.spin));
  const breath = 1 + 0.006 * pose.breathe;
  const hindUp = -42 * stand - 70 * bow;
  const upperY = -30 * stand + 55 * bow - 18 * reach;
  const legStretch = 1 + 0.36 * stand - 0.45 * bow;

  const paw = (side: 'left' | 'right') => {
    const sign = side === 'left' ? -1 : 1;
    const phase = pose.scrabblePhase + (side === 'left' ? 0 : Math.PI);
    const scrabbleY = -22 * pose.scrabble * Math.max(0, Math.sin(phase));
    const spread = sign * 26 * bow + sign * -10 * reach;
    const pawCx = side === 'left' ? 310 : 370;
    return (
      <g
        key={side}
        transform={`translate(${spread} ${-70 * reach + scrabbleY}) rotate(${sign * -16 * reach} ${pawCx} 470)`}
      >
        <g transform={`translate(0 504) scale(1 ${legStretch}) translate(0 -504)`}>
          <FrontLeg side={side} />
        </g>
        <g transform={`translate(${pawCx} 510) scale(${1 + 0.1 * bow}) translate(${-pawCx} -510)`}>
          <FrontPaw side={side} />
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * (flip ? -1 : 1)} ${scale}) translate(-340 -532)`}>
      <g transform={`translate(${pose.bodyX} 0)`}>
        <Shadow spread={1 - air} opacity={1 - air} />
      </g>
      <g
        transform={`translate(${pose.bodyX} ${pose.bodyY}) rotate(${pose.lean} 340 532) translate(340 532) scale(${spinX} ${pose.squash * breath}) translate(-340 -532)`}
      >
        <g transform={`translate(0 ${hindUp}) rotate(${pose.tailWag - 30 * bow} 445 490)`}>
          <Tail />
        </g>
        <g transform={`translate(0 ${hindUp})`}>
          <Haunch side="left" />
          <Haunch side="right" />
        </g>
        <g transform={`translate(${18 * stand} ${-8 * stand})`}>
          <HindPaw side="left" />
        </g>
        <g transform={`translate(${-18 * stand} ${-8 * stand})`}>
          <HindPaw side="right" />
        </g>
        <g
          transform={`translate(0 ${-30 * stand}) translate(0 515) scale(1 ${1 - 0.25 * bow}) translate(0 -515)`}
        >
          <Torso />
        </g>
        {paw('left')}
        {paw('right')}
        <g transform={`translate(0 ${upperY})`}>
          <Chest />
          <Bandana />
          <g transform={`translate(0 ${22 * bow})`}>
            <Head pose={pose} />
          </g>
        </g>
      </g>
    </g>
  );
};
