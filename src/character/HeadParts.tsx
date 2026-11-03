import React from 'react';
import {FaceConfig} from './expressions';
import {LUCA} from './palette';
import {Hatch, PENCIL, Sketch} from './sketch';
import type {LucaPose} from './pose';

/* All head parts use the head's local coordinates from luca-sketch.svg
   (origin at the middle of the face, before the head group's transform). */

const EAR_LEFT = 'M-78 -50Q-120 -40 -122 30Q-124 80 -104 96Q-88 60 -80 20';
const EAR_RIGHT = 'M78 -50Q120 -40 122 30Q124 80 104 96Q88 60 80 20';

export const Ear: React.FC<{side: 'left' | 'right'; lift: number}> = ({side, lift}) => {
  const left = side === 'left';
  const d = left ? EAR_LEFT : EAR_RIGHT;
  const pivot = left ? '-82 -46' : '82 -46';
  return (
    <g transform={`rotate(${left ? lift : -lift} ${pivot})`}>
      <Sketch
        d={d}
        fillD={`${d}Z`}
        fill={LUCA.ears}
        detail={left ? 'M-122 60l8 6l-6 8l8 6l-4 8l8 4' : 'M122 60l-8 6l6 8l-8 6l4 8l-8 4'}
        seed={`ear-${side}`}
      />
      <Hatch
        d={
          left
            ? 'M-112 -10q4 14 0 26M-104 10q4 14 0 26'
            : 'M112 -10q-4 14 0 26M104 10q-4 14 0 26'
        }
      />
    </g>
  );
};

export const Skull: React.FC = () => (
  <g>
    <Sketch
      d="M-90 -5Q-92 -78 0 -84Q92 -78 90 -5Q86 45 56 66Q0 98 -56 66Q-86 45 -90 -5Z"
      fill={LUCA.head}
      detail="M-10 -82Q-4 -100 6 -86M4 -84Q14 -100 20 -82M-24 -80Q-20 -94 -12 -82M-56 66l-8 10l10 2l-6 10l12 0M56 66l8 10l-10 2l6 10l-12 0"
      seed="skull"
    />
    <Hatch d="M-82 10q8 8 6 18M-80 34q8 8 6 16M82 10q-8 8 -6 18M80 34q-8 8 -6 16M-30 -60q2 10 -2 16M0 -66q2 10 -2 16M30 -60q-2 10 2 16" />
  </g>
);

const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

const Eye: React.FC<{
  cx: number;
  cy: number;
  face: FaceConfig;
  look: {x: number; y: number};
  lid: number;
  side: 'left' | 'right';
}> = ({cx, cy, face, look, lid, side}) => {
  const r = face.eyeR;
  const closed = lid >= 0.92;
  let eye: React.ReactNode;
  if (face.eyeStyle === 'sclera') {
    eye = (
      <g>
        <ellipse cx={cx} cy={cy} rx={r} ry={r + 1} fill={LUCA.sclera} stroke={PENCIL} strokeWidth={2.2} />
        <circle cx={cx + look.x * 5} cy={cy + look.y * 5} r={5.5} fill={LUCA.eyes} />
        <circle cx={cx + look.x * 5 + 1.8} cy={cy + look.y * 5 - 2} r={1.6} fill={LUCA.sclera} />
      </g>
    );
  } else {
    const px = cx + look.x * 3.5;
    const py = cy + look.y * 3.5;
    eye = (
      <g>
        <circle cx={px} cy={py} r={r} fill={LUCA.eyes} />
        {face.eyeStyle === 'sparkle' ? (
          <>
            <path d={star(px + 4, py - 5, 6.5)} fill={LUCA.sclera} />
            <circle cx={px - 5} cy={py + 5} r={2.2} fill={LUCA.sclera} opacity={0.9} />
          </>
        ) : (
          <>
            <circle cx={px + 4 * (r / 11)} cy={py - 4 * (r / 11)} r={3.5 * (r / 11)} fill={LUCA.sclera} />
            {r >= 13 ? <circle cx={px - 4} cy={py + 5} r={1.8} fill={LUCA.sclera} opacity={0.85} /> : null}
          </>
        )}
      </g>
    );
  }
  if (closed) {
    return (
      <path
        d={`M${cx - r} ${cy}Q${cx} ${cy + r * 0.55} ${cx + r} ${cy}`}
        fill="none"
        stroke={PENCIL}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
    );
  }
  if (lid <= 0.02) return <>{eye}</>;
  const top = cy - r - 3;
  const lidY = top + lid * (2 * r + 3);
  const lean = side === 'left' ? -1.5 : 1.5;
  return (
    <g>
      {eye}
      <path
        d={`M${cx - r - 4} ${top - 4}L${cx + r + 4} ${top - 4}L${cx + r + 4} ${lidY + lean}Q${cx} ${lidY + 3} ${cx - r - 4} ${lidY - lean}Z`}
        fill={LUCA.lid}
      />
      <path
        d={`M${cx - r - 2} ${lidY - lean}Q${cx} ${lidY + 3} ${cx + r + 2} ${lidY + lean}`}
        fill="none"
        stroke={PENCIL}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </g>
  );
};

export const Eyes: React.FC<{face: FaceConfig; pose: LucaPose}> = ({face, pose}) => {
  const look = pose.look ?? face.look;
  const lid = Math.min(1, Math.max(face.lid, pose.blink));
  const dy = -14 * pose.tipBack;
  return (
    <g transform={`translate(0 ${dy})`}>
      <Eye cx={-38} cy={-10} face={face} look={look} lid={lid} side="left" />
      <Eye cx={38} cy={-10} face={face} look={look} lid={lid} side="right" />
      <Sketch d={face.brows} seed="brows" />
    </g>
  );
};

const NOSE = 'M-22 18Q0 4 22 18Q20 38 0 40Q-20 38 -22 18Z';

const mouthPath = (style: FaceConfig['mouth']): string => {
  switch (style) {
    case 'smirk':
      return 'M0 40L0 52M0 52Q-14 62 -30 56M0 52Q18 60 34 46M34 46l7 -3';
    case 'frown':
      return 'M0 40L0 52M-32 66Q-16 54 0 56Q16 54 32 66';
    case 'wavy':
      return 'M0 40L0 54M-26 62Q-18 56 -9 61Q0 66 9 60Q18 55 26 61';
    case 'soft':
      return 'M0 40L0 52M0 52Q-14 60 -28 56M0 52Q14 60 28 56';
    default:
      return 'M0 40L0 54M0 54Q-16 68 -36 58M0 54Q16 68 36 58';
  }
};

/** Muzzle, nose, mouth, tongue and cheeks. */
export const NoseMouth: React.FC<{face: FaceConfig; pose: LucaPose}> = ({face, pose}) => {
  const c = pose.cheeks;
  const dy = -18 * pose.tipBack;
  const openFromStyle = face.mouth === 'open' ? 0.55 : 0;
  const open = Math.max(pose.mouthOpen, openFromStyle, pose.chew * 0.3);
  const sealed = c > 0.3 && open < 0.1;

  let mouth: React.ReactNode;
  if (sealed) {
    mouth = <Sketch d="M0 40L0 50M-9 55Q0 59 9 55" seed="mouth-sealed" />;
  } else if (open > 0.05) {
    const h = 8 + 34 * open;
    const w = 22 + 6 * open;
    const d = `M${-w} 52Q0 46 ${w} 52Q${w - 2} ${52 + h} 0 ${54 + h}Q${-w + 2} ${52 + h} ${-w} 52Z`;
    mouth = (
      <g>
        <path d={d} fill={LUCA.mouth} transform="translate(2 2)" opacity={0.95} />
        <path
          d={`M${-w * 0.6} ${52 + h * 0.75}Q0 ${52 + h * 0.45} ${w * 0.6} ${52 + h * 0.75}Q${w * 0.5} ${54 + h} 0 ${54 + h}Q${-w * 0.5} ${54 + h} ${-w * 0.6} ${52 + h * 0.75}Z`}
          fill={LUCA.tongue}
        />
        <Sketch d={`M0 40L0 50${d}`} seed="mouth-open" />
      </g>
    );
  } else if (face.mouth === 'o') {
    mouth = (
      <g>
        <ellipse cx={1} cy={66} rx={9} ry={11} fill={LUCA.mouth} />
        <Sketch d="M0 40L0 54M-9 66Q-9 54 0 54Q9 54 9 66Q9 78 0 78Q-9 78 -9 66Z" seed="mouth-o" />
      </g>
    );
  } else {
    mouth = <Sketch d={mouthPath(face.mouth)} seed={`mouth-${face.mouth}`} />;
  }

  const t = pose.tongue;
  const tongueBase = open > 0.05 ? 52 + (8 + 34 * open) * 0.7 : 56;
  return (
    <g transform={`translate(0 ${dy})`}>
      {c > 0.01 ? (
        <g>
          <Sketch
            d={`M-30 30Q${-46 - 24 * c} ${30 - 4 * c} ${-48 - 22 * c} ${48}Q${-46 - 20 * c} ${68 + 6 * c} -30 66Z`}
            fill={LUCA.muzzle}
            seed="cheek-l"
          />
          <Sketch
            d={`M30 30Q${46 + 24 * c} ${30 - 4 * c} ${48 + 22 * c} ${48}Q${46 + 20 * c} ${68 + 6 * c} 30 66Z`}
            fill={LUCA.muzzle}
            seed="cheek-r"
          />
        </g>
      ) : null}
      <g transform={`translate(0 38) scale(${1 + 0.12 * c} 1) translate(0 -38)`}>
        <Sketch d="M-46 20Q-48 -6 0 -8Q48 -6 46 20Q46 70 0 84Q-46 70 -46 20Z" fill={LUCA.muzzle} seed="muzzle" />
      </g>
      <path d={NOSE} fill={LUCA.eyes} />
      <path d={NOSE} fill="none" stroke={PENCIL} strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={-8} cy={17} r={3} fill={LUCA.sclera} opacity={0.8} />
      {mouth}
      {t > 0.02 ? (
        <Sketch
          d={`M-11 ${tongueBase}Q-14 ${tongueBase + 30 * t} 0 ${tongueBase + 34 * t}Q14 ${tongueBase + 30 * t} 11 ${tongueBase}`}
          fillD={`M-11 ${tongueBase}Q-14 ${tongueBase + 30 * t} 0 ${tongueBase + 34 * t}Q14 ${tongueBase + 30 * t} 11 ${tongueBase}Z`}
          fill={LUCA.tongue}
          detail={`M0 ${tongueBase + 2}L0 ${tongueBase + 20 * t}`}
          fillOffset={[1, 1]}
          seed="tongue"
        />
      ) : null}
      {pose.treatInMouth ? (
        <g transform="translate(26 58) rotate(-18)">
          <TreatShape />
        </g>
      ) : null}
      {pose.exhale > 0.01 ? (
        <g opacity={pose.exhale} transform={`translate(${30 * (1 - pose.exhale)} 0)`}>
          <Sketch d="M30 62q14 -8 24 2q8 8 20 0M40 80q12 -6 20 2q8 8 18 0M50 46q10 -6 18 0" strokeWidth={2} seed="sigh" />
        </g>
      ) : null}
    </g>
  );
};

export const TreatShape: React.FC<{scale?: number}> = ({scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <Sketch
      d="M-18 -4Q-26 -12 -20 -16Q-14 -18 -12 -10L12 -10Q14 -18 20 -16Q26 -12 18 -4Q26 4 20 8Q14 10 12 2L-12 2Q-14 10 -20 8Q-26 4 -18 -4Z"
      fill={LUCA.treat}
      fillOffset={[2, 2]}
      strokeWidth={2.2}
      seed="treat"
    />
    <path d="M-6 -5l2 2M2 -6l2 2M7 -3l2 2" stroke="#7A4A1E" strokeWidth={1.4} strokeLinecap="round" />
  </g>
);

export const FaceExtras: React.FC<{face: FaceConfig; frame: number; fps: number}> = ({face, frame, fps}) => {
  const t = frame / fps;
  return (
    <g>
      {face.extras.includes('tear') ? (
        <g transform={`translate(0 ${(t * 14) % 22})`} opacity={1 - ((t * 14) % 22) / 26}>
          <Sketch
            d="M-48 6Q-55 18 -48 23Q-41 18 -48 6Z"
            fill={LUCA.tear}
            fillOffset={[1, 1]}
            strokeWidth={1.8}
            seed="tear"
          />
        </g>
      ) : null}
      {face.extras.includes('sweat') ? (
        <Sketch
          d="M98 -62Q88 -46 96 -40Q106 -42 98 -62Z"
          fill={LUCA.tear}
          fillOffset={[1, 1]}
          strokeWidth={1.8}
          seed="sweat"
        />
      ) : null}
      {face.extras.includes('drool') ? (
        <g transform={`translate(0 ${4 * Math.sin(t * 3)})`}>
          <Sketch
            d="M30 66Q28 84 33 90Q38 84 34 66"
            fillD="M30 66Q28 84 33 90Q38 84 34 66Z"
            fill={LUCA.tear}
            fillOffset={[1, 1]}
            strokeWidth={1.6}
            seed="drool"
          />
        </g>
      ) : null}
      {face.extras.includes('zzz')
        ? [0, 1, 2].map((i) => {
            const p = ((t * 0.5 + i / 3) % 1 + 1) % 1;
            const s = 0.6 + p * 0.6;
            return (
              <g
                key={i}
                transform={`translate(${96 + p * 50} ${-80 - p * 90}) rotate(10) scale(${s})`}
                opacity={Math.sin(p * Math.PI)}
              >
                <Sketch d="M-10 -10L10 -10L-10 10L10 10" strokeWidth={3} seed={`z${i}`} />
              </g>
            );
          })
        : null}
    </g>
  );
};
