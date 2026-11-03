import React from 'react';
import {TreatShape} from '../character/HeadParts';
import {Hatch, Sketch} from '../character/sketch';

const DENIM = '#8B9BB3';
const SLEEVE = '#A9B98F';
const SKIN = '#F1C9A5';
const SHOE = '#F4EFE4';

/**
 * A human from the hips down, standing on the floor, facing right toward Luca.
 * `x` is the middle between the feet, `ground` the floor line.
 */
export const HumanLegs: React.FC<{x: number; ground: number}> = ({x, ground}) => {
  const top = -120;
  const leg = (dx: number, seed: string) => {
    const l = x + dx;
    const d = `M${l - 62} ${top}L${l + 62} ${top}Q${l + 58} ${ground - 300} ${l + 52} ${ground - 60}L${l - 50} ${ground - 60}Q${l - 60} ${ground - 300} ${l - 62} ${top}Z`;
    return (
      <g key={seed}>
        <Sketch d={d} fill={DENIM} seed={seed} />
        <Hatch
          d={`M${l - 40} ${ground - 400}q10 10 2 24M${l - 36} ${ground - 360}q10 10 2 24M${l + 30} ${ground - 200}q-10 10 -2 24`}
          color="#4E5E78"
        />
        <Sketch d={`M${l - 50} ${ground - 70}L${l + 52} ${ground - 70}`} strokeWidth={2} seed={`${seed}-hem`} />
        {/* sneaker */}
        <Sketch
          d={`M${l - 56} ${ground - 62}L${l + 50} ${ground - 62}Q${l + 120} ${ground - 50} ${l + 128} ${ground - 18}L${l + 128} ${ground}L${l - 60} ${ground}Z`}
          fill={SHOE}
          detail={`M${l - 60} ${ground - 14}L${l + 128} ${ground - 14}M${l + 30} ${ground - 58}l12 14M${l + 50} ${ground - 54}l12 14`}
          seed={`${seed}-shoe`}
        />
      </g>
    );
  };
  return (
    <g>
      <ellipse cx={x + 40} cy={ground + 4} rx={220} ry={14} fill="#000" opacity={0.06} />
      {leg(-80, 'leg-back')}
      {leg(70, 'leg-front')}
    </g>
  );
};

/**
 * A hand reaching down from above the frame, optionally pinching a treat.
 * (hx, hy) is where the treat sits.
 */
export const Hand: React.FC<{hx: number; hy: number; treat: boolean; fromX?: number}> = ({
  hx,
  hy,
  treat,
  fromX,
}) => {
  const sx = fromX ?? hx - 140;
  const wristX = hx - 6;
  const wristY = hy - 80;
  return (
    <g>
      <Sketch
        d={`M${sx - 70} -140L${sx + 70} -140L${wristX + 34} ${wristY}L${wristX - 34} ${wristY}Z`}
        fill={SLEEVE}
        seed="sleeve"
      />
      <Sketch d={`M${wristX - 36} ${wristY - 6}L${wristX + 36} ${wristY - 6}`} strokeWidth={2} seed="cuff" />
      <Sketch
        d={`M${wristX - 30} ${wristY}Q${wristX - 40} ${hy - 30} ${hx - 22} ${hy - 12}Q${hx - 6} ${hy - 2} ${hx + 6} ${hy - 10}L${hx + 24} ${hy - 24}Q${hx + 38} ${hy - 30} ${hx + 32} ${hy - 44}Q${wristX + 38} ${wristY + 10} ${wristX + 30} ${wristY}Z`}
        fill={SKIN}
        detail={`M${hx - 16} ${hy - 30}Q${hx - 2} ${hy - 26} ${hx + 8} ${hy - 34}M${hx - 22} ${hy - 48}Q${hx - 6} ${hy - 44} ${hx + 6} ${hy - 50}`}
        seed="hand"
      />
      {treat ? (
        <g transform={`translate(${hx} ${hy + 8}) rotate(-10)`}>
          <TreatShape scale={1.1} />
        </g>
      ) : null}
    </g>
  );
};
