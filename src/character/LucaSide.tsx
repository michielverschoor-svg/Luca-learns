import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {FACES} from './expressions';
import {LUCA} from './palette';
import type {LucaPose} from './pose';
import {Hatch, PENCIL, Sketch} from './sketch';
import {TreatShape} from './HeadParts';

/*
 * Luca in profile, facing right. Origin is on the ground under the middle of
 * his body; y < 0 is up. Built from simple round shapes so the body can move
 * between standing (pose.stand = 1), sitting (stand = 0) and a play bow.
 *
 * Each body "union" is drawn in three passes: a faint offset outline (the
 * doubled pencil line), a solid outline, then the fill on top, so overlapping
 * shapes merge into one outlined silhouette.
 */

type Pt = [number, number];
type Shape =
  | {t: 'circle'; c: Pt; r: number}
  | {t: 'seg'; pts: Pt[]; w: number}
  | {t: 'ellipse'; c: Pt; rx: number; ry: number; rot: number};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lp = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const ptsStr = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const ShapeEl: React.FC<{s: Shape; grow: number; color: string; offset?: Pt; opacity?: number}> = ({
  s,
  grow,
  color,
  offset = [0, 0],
  opacity = 1,
}) => {
  const tr = `translate(${offset[0]} ${offset[1]})`;
  if (s.t === 'circle') {
    return <circle cx={s.c[0]} cy={s.c[1]} r={s.r + grow} fill={color} opacity={opacity} transform={tr} />;
  }
  if (s.t === 'ellipse') {
    return (
      <ellipse
        cx={0}
        cy={0}
        rx={s.rx + grow}
        ry={s.ry + grow}
        fill={color}
        opacity={opacity}
        transform={`${tr} translate(${s.c[0]} ${s.c[1]}) rotate(${s.rot})`}
      />
    );
  }
  return (
    <polyline
      points={ptsStr(s.pts)}
      fill="none"
      stroke={color}
      strokeWidth={s.w + grow * 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      transform={tr}
    />
  );
};

const Union: React.FC<{shapes: Shape[]; fill: string; seed: string}> = ({shapes, fill, seed}) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / 4);
  const ghost: Pt = [2 + (random(`${seed}x${k}`) - 0.5) * 1.4, -1.5 + (random(`${seed}y${k}`) - 0.5) * 1.4];
  return (
    <g>
      {shapes.map((s, i) => (
        <ShapeEl key={`g${i}`} s={s} grow={4.4} color={PENCIL} offset={ghost} opacity={0.35} />
      ))}
      {shapes.map((s, i) => (
        <ShapeEl key={`o${i}`} s={s} grow={4.4} color={PENCIL} />
      ))}
      {shapes.map((s, i) => (
        <ShapeEl key={`f${i}`} s={s} grow={0} color={fill} />
      ))}
    </g>
  );
};

/** Key positions for standing, sitting and bowing. Blended by the pose. */
const KEY = {
  stand: {
    chest: [58, -122] as Pt,
    rump: [-92, -126] as Pt,
    head: [128, -208] as Pt,
    thigh: [-88, -104] as Pt,
    thighRot: 72,
    knee: [-74, -64] as Pt,
    hock: [-108, -34] as Pt,
    hindPaw: [-98, -11] as Pt,
    elbow: [64, -58] as Pt,
    frontPaw: [70, -11] as Pt,
    tailTip: [-62, -58] as Pt,
  },
  sit: {
    chest: [44, -160] as Pt,
    rump: [-62, -64] as Pt,
    head: [104, -252] as Pt,
    thigh: [-52, -42] as Pt,
    thighRot: 6,
    knee: [-8, -40] as Pt,
    hock: [-92, -13] as Pt,
    hindPaw: [-6, -11] as Pt,
    elbow: [60, -70] as Pt,
    frontPaw: [66, -11] as Pt,
    tailTip: [-78, 64] as Pt,
  },
  bow: {
    chest: [70, -74] as Pt,
    rump: [-92, -134] as Pt,
    head: [150, -128] as Pt,
    thigh: [-88, -110] as Pt,
    thighRot: 72,
    knee: [-74, -68] as Pt,
    hock: [-108, -34] as Pt,
    hindPaw: [-98, -11] as Pt,
    elbow: [52, -26] as Pt,
    frontPaw: [132, -11] as Pt,
    tailTip: [-40, -76] as Pt,
  },
};
type Key = typeof KEY.stand;

const blendKeys = (stand: number, bow: number): Key => {
  const a = KEY.sit;
  const b = KEY.stand;
  const base = {} as Record<keyof Key, unknown>;
  for (const k of Object.keys(a) as (keyof Key)[]) {
    const va = a[k];
    const vb = b[k];
    base[k] = typeof va === 'number' ? lerp(va, vb as number, stand) : lp(va as Pt, vb as Pt, stand);
  }
  const mid = base as Key;
  if (bow <= 0) return mid;
  const out = {} as Record<keyof Key, unknown>;
  for (const k of Object.keys(mid) as (keyof Key)[]) {
    const va = mid[k];
    const vb = KEY.bow[k];
    out[k] = typeof va === 'number' ? lerp(va, vb as number, bow) : lp(va as Pt, vb as Pt, bow);
  }
  return out as Key;
};

const SideHead: React.FC<{pose: LucaPose}> = ({pose}) => {
  const face = FACES[pose.expression];
  const lid = Math.min(1, Math.max(face.lid, pose.blink));
  const look = pose.look ?? face.look;
  const r = face.eyeR * 1.0;
  const ex = 26 + look.x * 2;
  const ey = -12 + look.y * 2;
  const open = Math.max(pose.mouthOpen, face.mouth === 'open' ? 0.55 : 0, pose.chew * 0.35);
  const jaw = 26 * open;
  const earLift = (face.ears[0] + face.ears[1]) / 2 + pose.earBounce;

  let eye: React.ReactNode;
  if (lid >= 0.92) {
    eye = <path d={`M${ex - r} ${ey}Q${ex} ${ey + r * 0.6} ${ex + r} ${ey}`} fill="none" stroke={PENCIL} strokeWidth={2.8} strokeLinecap="round" />;
  } else if (face.eyeStyle === 'sclera') {
    eye = (
      <g>
        <ellipse cx={ex} cy={ey} rx={r * 0.85} ry={r + 1} fill={LUCA.sclera} stroke={PENCIL} strokeWidth={2.2} />
        <circle cx={ex + 3 + look.x * 3} cy={ey + look.y * 3} r={4.5} fill={LUCA.eyes} />
      </g>
    );
  } else {
    eye = (
      <g>
        <circle cx={ex} cy={ey} r={r} fill={LUCA.eyes} />
        <circle cx={ex + r * 0.35} cy={ey - r * 0.35} r={r * 0.32} fill={LUCA.sclera} />
        {face.eyeStyle === 'sparkle' ? <circle cx={ex - r * 0.4} cy={ey + r * 0.4} r={1.8} fill={LUCA.sclera} /> : null}
      </g>
    );
  }
  const lidY = ey - r - 2 + lid * (2 * r + 2);

  return (
    <g>
      {/* lower jaw, opens for barks and chewing */}
      <g transform={`rotate(${jaw} 40 22)`}>
        <Union shapes={[{t: 'seg', pts: [[38, 28], [70, 32]], w: 20}]} fill={LUCA.muzzle} seed="side-jaw" />
        {open > 0.05 ? <path d="M42 22L72 24L70 32L44 30Z" fill={LUCA.mouth} /> : null}
        {pose.tongue > 0.02 ? (
          <Sketch
            d={`M70 30Q${76 + 4 * pose.tongue} ${38 + 34 * pose.tongue} ${86} ${40 + 30 * pose.tongue}Q92 ${30 + 20 * pose.tongue} 86 28`}
            fill={LUCA.tongue}
            fillOffset={[1, 1]}
            seed="side-tongue"
          />
        ) : null}
      </g>
      <Union
        shapes={[
          {t: 'circle', c: [0, 0], r: 58},
          {t: 'seg', pts: [[30, 12], [66, 14]], w: 44},
        ]}
        fill={LUCA.head}
        seed="side-skull"
      />
      {/* lighter muzzle patch */}
      <path d="M34 -4Q64 -8 84 4Q90 20 80 32Q56 36 36 30Z" fill={LUCA.muzzle} />
      {/* nose */}
      <ellipse cx={86} cy={6} rx={12} ry={10} fill={LUCA.eyes} stroke={PENCIL} strokeWidth={2} />
      <circle cx={83} cy={2} r={2.6} fill={LUCA.sclera} opacity={0.8} />
      {/* mouth line */}
      <Sketch
        d={face.mouth === 'smirk' ? 'M84 24Q70 32 52 26Q46 22 44 18' : face.mouth === 'frown' ? 'M84 26Q68 24 50 32' : 'M84 24Q68 30 48 26'}
        seed="side-mouth"
        strokeWidth={2.4}
      />
      {/* eye and lid */}
      {eye}
      {lid > 0.02 && lid < 0.92 ? (
        <g>
          <path d={`M${ex - r - 3} ${ey - r - 4}L${ex + r + 3} ${ey - r - 4}L${ex + r + 3} ${lidY}L${ex - r - 3} ${lidY}Z`} fill={LUCA.head} />
          <path d={`M${ex - r - 2} ${lidY}L${ex + r + 2} ${lidY}`} stroke={PENCIL} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      ) : null}
      <Sketch d={`M${ex - 14} ${ey - 20 - (face.eyeStyle === 'sclera' ? 6 : 0)}Q${ex} ${ey - 28} ${ex + 14} ${ey - 20}`} strokeWidth={2.4} seed="side-brow" />
      {pose.treatInMouth ? (
        <g transform="translate(76 32) rotate(-10) scale(0.9)">
          <TreatShape />
        </g>
      ) : null}
      {/* top tufts */}
      <Sketch d="M-14 -52Q-8 -68 2 -54M0 -54Q10 -70 16 -52" seed="side-tufts" />
      <Hatch d="M-30 -20q6 10 2 20M-38 6q6 10 2 20M10 -38q2 10 -2 16" />
      {/* ear: hangs from the top-back of the head */}
      <g transform={`translate(-10 0) rotate(${-earLift} -10 -38)`}>
        <Sketch
          d="M-10 -40Q-46 -36 -50 10Q-52 48 -32 62Q-18 40 -8 4Q0 -24 -10 -40Z"
          fill={LUCA.ears}
          detail="M-50 30l-8 6l7 4l-6 8l8 2"
          seed="side-ear"
        />
        <Hatch d="M-38 -12q4 14 0 26M-30 10q4 14 0 26" />
      </g>
    </g>
  );
};

type Props = {
  pose: LucaPose;
  x: number;
  y: number;
  scale: number;
  /** true = facing left. */
  flip?: boolean;
};

export const LucaSide: React.FC<Props> = ({pose, x, y, scale, flip}) => {
  const k = blendKeys(pose.stand, pose.bow);
  const breath = 1 + 0.008 * pose.breathe;
  const air = Math.min(0.5, Math.max(0, -pose.bodyY / 500));

  // Hind leg chain (near side). Far side is the same, shifted back and darker.
  const hind = (dx: number): Pt[] => [add(k.thigh, [dx, 0]), add(k.knee, [dx, 0]), add(k.hock, [dx, 0]), add(k.hindPaw, [dx, 0])];
  const shoulder = add(k.chest, [12, 24]);
  const front = (dx: number): Pt[] => [add(shoulder, [dx, 0]), add(k.elbow, [dx, 0]), add(k.frontPaw, [dx, 0])];
  const neckBase = add(k.chest, [16, -26]);
  const tailBase = add(k.rump, [-40, -16]);
  const tailTip = add(tailBase, k.tailTip);
  const tailMid: Pt = add(lp(tailBase, tailTip, 0.5), [lerp(-6, -16, pose.stand), lerp(18, -14, pose.stand)]);

  const headRot = pose.headTilt * 0.6 - 26 * pose.tipBack + 10 * pose.bow;
  const bandA = lp(neckBase, k.head, 0.32);

  const paw = (p: Pt, dx: number, fill: string, seed: string) => (
    <Union shapes={[{t: 'ellipse', c: [p[0] + 12 + dx, -12], rx: 26, ry: 13, rot: 0}]} fill={fill} seed={seed} />
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * (flip ? -1 : 1)} ${scale})`}>
      <ellipse cx={0} cy={4} rx={150 * (1 - air)} ry={12} fill="#000" opacity={0.07 * (1 - air)} />
      <Hatch d="M-140 10L140 10M-110 16L110 16" opacity={0.5 * (1 - air)} />
      <g transform={`translate(${pose.bodyX} ${pose.bodyY}) rotate(${pose.lean}) scale(${Math.sign(pose.spin || 1) * Math.max(0.06, Math.abs(pose.spin))} ${pose.squash * breath})`}>
        {/* far legs, in the haunch shade */}
        <Union shapes={[{t: 'seg', pts: hind(-16).slice(1), w: 26}]} fill={LUCA.haunches} seed="side-hind-far" />
        {paw(add(k.hindPaw, [-16, 0]), 0, LUCA.haunches, 'side-hpaw-far')}
        <Union shapes={[{t: 'seg', pts: front(-18), w: 30}]} fill={LUCA.haunches} seed="side-front-far" />
        {paw(add(k.frontPaw, [-18, 0]), 0, LUCA.haunches, 'side-fpaw-far')}

        {/* tail */}
        <g transform={`rotate(${pose.tailWag} ${tailBase[0]} ${tailBase[1]})`}>
          <path
            d={`M${tailBase[0]} ${tailBase[1]}Q${tailMid[0]} ${tailMid[1]} ${tailTip[0]} ${tailTip[1]}`}
            fill="none"
            stroke={PENCIL}
            strokeWidth={33}
            strokeLinecap="round"
          />
          <path
            d={`M${tailBase[0]} ${tailBase[1]}Q${tailMid[0]} ${tailMid[1]} ${tailTip[0]} ${tailTip[1]}`}
            fill="none"
            stroke={LUCA.coat}
            strokeWidth={24}
            strokeLinecap="round"
          />
          <Sketch
            d={`M${tailTip[0] + 6} ${tailTip[1] - 10}l-12 -4l2 10l-12 0l6 8`}
            strokeWidth={2}
            seed="side-tail-fluff"
          />
        </g>

        {/* near front leg (top tucked under the chest) */}
        <Union shapes={[{t: 'seg', pts: front(0), w: 32}]} fill={LUCA.coat} seed="side-front-near" />
        {/* body: chest, rump and neck as one silhouette */}
        <Union
          shapes={[
            {t: 'seg', pts: [k.chest, k.rump], w: 92},
            {t: 'circle', c: k.chest, r: 54},
            {t: 'circle', c: k.rump, r: 50},
            {t: 'seg', pts: [neckBase, lp(neckBase, k.head, 0.7)], w: 64},
          ]}
          fill={LUCA.coat}
          seed="side-body"
        />
        <path
          d={`M${k.chest[0] + 34} ${k.chest[1] - 20}Q${k.chest[0] + 60} ${k.chest[1] + 10} ${k.chest[0] + 30} ${k.chest[1] + 44}L${k.chest[0] + 22} ${k.chest[1] + 30}L${k.chest[0] + 30} ${k.chest[1] + 18}L${k.chest[0] + 22} ${k.chest[1] + 6}Z`}
          fill={LUCA.chest}
        />
        <Hatch
          d={`M${k.rump[0] - 10} ${k.rump[1] - 36}q10 6 14 18M${k.rump[0] + 30} ${k.rump[1] - 40}q10 6 14 18M${k.chest[0] - 40} ${k.chest[1] - 40}q8 6 12 16`}
        />

        {/* near hind leg: big haunch with the lower leg folding under it */}
        <Union shapes={[{t: 'seg', pts: hind(0).slice(1), w: 28}]} fill={LUCA.coat} seed="side-hind-near" />
        {paw(k.hindPaw, 0, LUCA.muzzle, 'side-hpaw-near')}
        <Union shapes={[{t: 'ellipse', c: k.thigh, rx: 54, ry: 40, rot: k.thighRot}]} fill={LUCA.haunches} seed="side-thigh" />
        <Hatch d={`M${k.thigh[0] - 20} ${k.thigh[1] - 10}q8 8 4 20M${k.thigh[0]} ${k.thigh[1] - 14}q8 8 4 20M${k.thigh[0] + 18} ${k.thigh[1] - 6}q6 6 2 16`} />

        {paw(k.frontPaw, 0, LUCA.muzzle, 'side-fpaw-near')}
        <Sketch d={`M${k.frontPaw[0] + 22} -20l0 14M${k.frontPaw[0] + 30} -20l0 14`} strokeWidth={2} seed="side-toes" />

        {/* bandana around the neck */}
        <Sketch
          d={`M${bandA[0] - 30} ${bandA[1] - 8}Q${bandA[0]} ${bandA[1] + 8} ${bandA[0] + 34} ${bandA[1] - 4}L${bandA[0] + 14} ${bandA[1] + 62}Z`}
          fill={LUCA.bandana}
          fillOpacity={1}
          strokeWidth={2.4}
          seed="side-bandana"
        />
        <path
          d={`M${bandA[0] - 6} ${bandA[1] + 10}l5 3M${bandA[0] + 14} ${bandA[1] + 12}l5 3M${bandA[0] + 6} ${bandA[1] + 30}l5 3M${bandA[0] + 14} ${bandA[1] + 46}l4 4`}
          stroke={LUCA.bandanaPattern}
          strokeWidth={2.2}
          strokeLinecap="round"
        />

        {/* head */}
        <g transform={`translate(${k.head[0]} ${k.head[1]}) rotate(${headRot} -20 30)`}>
          <SideHead pose={pose} />
        </g>
      </g>
    </g>
  );
};
