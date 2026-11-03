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
    chest: [50, -120] as Pt,
    rump: [-70, -122] as Pt,
    head: [118, -214] as Pt,
    thigh: [-66, -100] as Pt,
    thighRot: 72,
    knee: [-54, -62] as Pt,
    hock: [-88, -34] as Pt,
    hindPaw: [-80, -13] as Pt,
    elbow: [58, -58] as Pt,
    frontPaw: [62, -13] as Pt,
    tailTip: [-60, -50] as Pt,
  },
  sit: {
    chest: [40, -156] as Pt,
    rump: [-46, -64] as Pt,
    head: [100, -258] as Pt,
    thigh: [-38, -44] as Pt,
    thighRot: 6,
    knee: [6, -40] as Pt,
    hock: [-78, -15] as Pt,
    hindPaw: [8, -13] as Pt,
    elbow: [54, -70] as Pt,
    frontPaw: [60, -13] as Pt,
    tailTip: [-80, 60] as Pt,
  },
  bow: {
    chest: [64, -76] as Pt,
    rump: [-70, -132] as Pt,
    head: [140, -132] as Pt,
    thigh: [-66, -108] as Pt,
    thighRot: 72,
    knee: [-54, -66] as Pt,
    hock: [-88, -34] as Pt,
    hindPaw: [-80, -13] as Pt,
    elbow: [48, -28] as Pt,
    frontPaw: [124, -13] as Pt,
    tailTip: [-36, -76] as Pt,
  },
};
type Key = typeof KEY.stand;

const blend = (a: Key, b: Key, t: number): Key => {
  const out = {} as Record<keyof Key, unknown>;
  for (const k of Object.keys(a) as (keyof Key)[]) {
    const va = a[k];
    const vb = b[k];
    out[k] = typeof va === 'number' ? lerp(va, vb as number, t) : lp(va as Pt, vb as Pt, t);
  }
  return out as Key;
};
const blendKeys = (stand: number, bow: number): Key => {
  const base = blend(KEY.sit, KEY.stand, stand);
  return bow > 0 ? blend(base, KEY.bow, bow) : base;
};

/** A zigzag fur edge from a to b, teeth pointing along `dir` (a unit-ish offset). */
const zigzag = (a: Pt, b: Pt, teeth: number, depth: Pt): string => {
  let d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}`;
  for (let i = 1; i <= teeth * 2; i++) {
    const p = lp(a, b, i / (teeth * 2));
    const o = i % 2 === 1 ? depth : [0, 0];
    d += `L${(p[0] + o[0]).toFixed(1)} ${(p[1] + o[1]).toFixed(1)}`;
  }
  return d;
};

/** Feathered golden-retriever tail along a quadratic curve, zigzag fringe underneath. */
const tailPath = (base: Pt, mid: Pt, tip: Pt): string => {
  const q = (t: number): Pt => [
    (1 - t) * (1 - t) * base[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0],
    (1 - t) * (1 - t) * base[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1],
  ];
  const n = 13;
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = q(t);
    const p2 = q(Math.min(1, t + 0.01));
    const p1 = q(Math.max(0, t - 0.01));
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = 13 * (1 - t * 0.55);
    const fringe = i === 0 || i === n ? w : i % 2 === 0 ? w + 4 : w + 12 * (1 - t * 0.4);
    top.push([p[0] - nx * w, p[1] - ny * w]);
    bottom.push([p[0] + nx * fringe, p[1] + ny * fringe]);
  }
  const pts = [...top, ...bottom.reverse()];
  return `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
};

const SideHead: React.FC<{pose: LucaPose}> = ({pose}) => {
  const face = FACES[pose.expression];
  const lid = Math.min(1, Math.max(face.lid, pose.blink));
  const look = pose.look ?? face.look;
  const r = face.eyeR * 1.15;
  const ex = 20 + look.x * 2;
  const ey = -16 + look.y * 2;
  const open = Math.max(pose.mouthOpen, face.mouth === 'open' ? 0.55 : 0, pose.chew * 0.35);
  const jaw = 24 * open;
  const earLift = (face.ears[0] + face.ears[1]) / 2 + pose.earBounce;

  let eye: React.ReactNode;
  if (lid >= 0.92) {
    eye = <path d={`M${ex - r} ${ey}Q${ex} ${ey + r * 0.6} ${ex + r} ${ey}`} fill="none" stroke={PENCIL} strokeWidth={4.5} strokeLinecap="round" />;
  } else if (face.eyeStyle === 'sclera') {
    eye = (
      <g>
        <ellipse cx={ex} cy={ey} rx={r * 0.9} ry={r + 2} fill={LUCA.sclera} stroke={PENCIL} strokeWidth={3.6} />
        <circle cx={ex + 3 + look.x * 3} cy={ey + 1 + look.y * 3} r={5.5} fill={LUCA.eyes} />
        <circle cx={ex + 5} cy={ey - 1} r={1.8} fill={LUCA.sclera} />
      </g>
    );
  } else {
    eye = (
      <g>
        <circle cx={ex} cy={ey} r={r} fill={LUCA.eyes} />
        <circle cx={ex + r * 0.35} cy={ey - r * 0.35} r={r * 0.33} fill={LUCA.sclera} />
        <circle cx={ex - r * 0.35} cy={ey + r * 0.4} r={r * 0.14} fill={LUCA.sclera} opacity={0.85} />
      </g>
    );
  }
  const lidY = ey - r - 2 + lid * (2 * r + 2);

  let mouth: React.ReactNode;
  if (face.mouth === 'o' && open < 0.05) {
    mouth = (
      <g>
        <ellipse cx={64} cy={42} rx={7} ry={9} fill={LUCA.mouth} />
        <Sketch d="M74 26L72 32M57 42Q57 32 64 32Q71 32 71 42Q71 52 64 52Q57 52 57 42Z" seed="side-mouth-o" strokeWidth={2.2} />
      </g>
    );
  } else {
    const d =
      face.mouth === 'smirk'
        ? 'M74 24L72 32Q60 42 46 34Q42 30 40 24'
        : face.mouth === 'frown'
          ? 'M74 24L72 32Q60 30 48 40'
          : 'M74 24L72 32Q60 42 44 36';
    mouth = <Sketch d={d} seed="side-mouth" strokeWidth={2.4} />;
  }

  return (
    <g>
      {/* lower jaw, opens for barks and chewing */}
      <g transform={`rotate(${jaw} 36 32)`}>
        <Union shapes={[{t: 'seg', pts: [[34, 38], [62, 42]], w: 20}]} fill={LUCA.muzzle} seed="side-jaw" />
        {open > 0.05 ? <path d="M36 30L66 32L64 42L38 40Z" fill={LUCA.mouth} /> : null}
        {pose.tongue > 0.02 ? (
          <Sketch
            d={`M54 40Q${58 + 4 * pose.tongue} ${48 + 34 * pose.tongue} ${68} ${50 + 30 * pose.tongue}Q74 ${40 + 20 * pose.tongue} 68 38`}
            fill={LUCA.tongue}
            fillOffset={[1, 1]}
            seed="side-tongue"
          />
        ) : null}
      </g>
      <Union
        shapes={[
          {t: 'circle', c: [0, 0], r: 66},
          {t: 'circle', c: [46, 20], r: 30},
          {t: 'seg', pts: [[26, 22], [58, 22]], w: 52},
        ]}
        fill={LUCA.head}
        seed="side-skull"
      />
      {/* short round muzzle */}
      <ellipse cx={50} cy={22} rx={30} ry={26} fill={LUCA.muzzle} />
      <Sketch d="M30 -2Q60 -8 74 8" seed="side-muzzle-line" strokeWidth={2} />
      {/* big round black nose */}
      <ellipse cx={76} cy={12} rx={15} ry={12} fill={LUCA.eyes} stroke={PENCIL} strokeWidth={3} />
      <circle cx={72} cy={8} r={3.4} fill={LUCA.sclera} opacity={0.8} />
      {mouth}
      {/* eye, lid and brow */}
      {eye}
      {lid > 0.02 && lid < 0.92 ? (
        <g>
          <path d={`M${ex - r - 3} ${ey - r - 4}L${ex + r + 3} ${ey - r - 4}L${ex + r + 3} ${lidY}L${ex - r - 3} ${lidY}Z`} fill={LUCA.head} />
          <path d={`M${ex - r - 2} ${lidY}L${ex + r + 2} ${lidY}`} stroke={PENCIL} strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : null}
      <Sketch d={`M${ex - 16} ${ey - 24 - (face.eyeStyle === 'sclera' ? 6 : 0)}Q${ex} ${ey - 34} ${ex + 16} ${ey - 24}`} strokeWidth={2.4} seed="side-brow" />
      {pose.treatInMouth ? (
        <g transform="translate(70 40) rotate(-10) scale(0.9)">
          <TreatShape />
        </g>
      ) : null}
      {/* top tufts and cheek fluff, as on the front view */}
      <Sketch d="M-14 -64Q-8 -82 2 -68M0 -66Q10 -82 16 -64M-28 -60Q-24 -74 -16 -62" seed="side-tufts" />
      <Sketch d="M-10 60l-8 10l10 2l-6 10l12 0" seed="side-cheek-fluff" />
      <Hatch d="M-40 -16q6 10 2 20M-46 10q6 10 2 20M8 -48q2 10 -2 16M-14 -50q2 10 -2 16" />
      {/* near ear on top */}
      <g transform={`rotate(${-earLift} -6 -42)`}>
        <Sketch
          d="M-6 -46Q-46 -40 -50 20Q-52 62 -34 74Q-20 48 -12 16"
          fillD="M-6 -46Q-46 -40 -50 20Q-52 62 -34 74Q-20 48 -12 16Q0 -14 -6 -46Z"
          fill={LUCA.ears}
          detail="M-50 46l8 6l-6 8l8 6l-4 6"
          seed="side-ear"
        />
        <Hatch d="M-38 -14q4 12 0 22M-30 6q4 12 0 22" />
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

  const hind = (dx: number): Pt[] => [add(k.knee, [dx, 0]), add(k.hock, [dx, 0]), add(k.hindPaw, [dx, 0])];
  const shoulder = add(k.chest, [10, 26]);
  const front = (dx: number): Pt[] => [add(shoulder, [dx, 0]), add(k.elbow, [dx, 0]), add(k.frontPaw, [dx, 0])];
  const neckBase = add(k.chest, [16, -28]);
  const tailBase = add(k.rump, [-44, -16]);
  const tailTip = add(tailBase, k.tailTip);
  const tailMid: Pt = add(lp(tailBase, tailTip, 0.5), [lerp(-6, -18, pose.stand), lerp(18, -16, pose.stand)]);

  const headRot = pose.headTilt * 0.6 - 26 * pose.tipBack + 10 * pose.bow;
  const bandA = add(lp(neckBase, k.head, 0.22), [14, 6]);
  const belly = lp(k.chest, k.rump, 0.45);
  const bellyDir: Pt = [k.rump[0] - k.chest[0], k.rump[1] - k.chest[1]];
  const bellyLen = Math.hypot(bellyDir[0], bellyDir[1]) || 1;
  const bellyN: Pt = [-bellyDir[1] / bellyLen, bellyDir[0] / bellyLen];
  const bellyEdge = add(belly, [-bellyN[0] * 50, -bellyN[1] * 50]);

  const paw = (p: Pt, fill: string, seed: string, toes: boolean) => (
    <g>
      <Union shapes={[{t: 'ellipse', c: [p[0] + 12, -14], rx: 32, ry: 16, rot: 0}]} fill={fill} seed={seed} />
      {toes ? <Sketch d={`M${p[0] + 26} -24l0 16M${p[0] + 36} -22l0 14`} strokeWidth={2} seed={`${seed}-toes`} /> : null}
    </g>
  );

  const tail = tailPath(tailBase, tailMid, tailTip);

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * (flip ? -1 : 1)} ${scale})`}>
      <ellipse cx={0} cy={4} rx={150 * (1 - air)} ry={12} fill="#000" opacity={0.07 * (1 - air)} />
      <Hatch d="M-140 10L140 10M-110 16L110 16" opacity={0.5 * (1 - air)} />
      <g
        transform={`translate(${pose.bodyX} ${pose.bodyY}) rotate(${pose.lean}) scale(${Math.sign(pose.spin || 1) * Math.max(0.06, Math.abs(pose.spin))} ${pose.squash * breath})`}
      >
        {/* far legs, in the haunch shade */}
        <Union shapes={[{t: 'seg', pts: hind(-16), w: 28}]} fill={LUCA.haunches} seed="side-hind-far" />
        {paw(add(k.hindPaw, [-16, 0]), LUCA.haunches, 'side-hpaw-far', false)}
        <Union shapes={[{t: 'seg', pts: front(-18), w: 34}]} fill={LUCA.haunches} seed="side-front-far" />
        {paw(add(k.frontPaw, [-18, 0]), LUCA.haunches, 'side-fpaw-far', false)}

        {/* feathered tail */}
        <g transform={`rotate(${pose.tailWag} ${tailBase[0]} ${tailBase[1]})`}>
          <Sketch d={tail} fill={LUCA.coat} seed="side-tail" />
          <Hatch d={`M${tailMid[0]} ${tailMid[1]}q8 -4 14 4M${lp(tailMid, tailTip, 0.5)[0]} ${lp(tailMid, tailTip, 0.5)[1]}q8 -4 14 4`} />
        </g>

        {/* near front leg, top tucked under the chest */}
        <Union shapes={[{t: 'seg', pts: front(0), w: 36}]} fill={LUCA.coat} seed="side-front-near" />

        {/* body: chest, rump and neck as one silhouette */}
        <Union
          shapes={[
            {t: 'seg', pts: [k.chest, k.rump], w: 104},
            {t: 'circle', c: k.chest, r: 58},
            {t: 'circle', c: k.rump, r: 54},
            {t: 'seg', pts: [neckBase, lp(neckBase, k.head, 0.7)], w: 70},
          ]}
          fill={LUCA.coat}
          seed="side-body"
        />
        {/* fluffy chest bib and belly fringe */}
        <Sketch
          d={zigzag(add(k.chest, [40, -34]), add(k.chest, [30, 52]), 4, [12, 0])}
          fill={LUCA.chest}
          fillD={`${zigzag(add(k.chest, [40, -34]), add(k.chest, [30, 52]), 4, [12, 0])}L${k.chest[0] + 6} ${k.chest[1] + 40}L${k.chest[0] + 16} ${k.chest[1] - 30}Z`}
          strokeWidth={2.2}
          seed="side-bib"
        />
        <Sketch
          d={zigzag(add(bellyEdge, [26, 0]), add(bellyEdge, [-34, 0]), 3, [bellyN[0] * -10, bellyN[1] * -10 + 6])}
          strokeWidth={2.2}
          seed="side-belly"
        />
        <Hatch
          d={`M${k.rump[0] - 10} ${k.rump[1] - 36}q10 6 14 18M${k.rump[0] + 30} ${k.rump[1] - 40}q10 6 14 18M${k.chest[0] - 40} ${k.chest[1] - 40}q8 6 12 16`}
        />

        {/* near hind leg: big haunch with the lower leg folding under it */}
        <Union shapes={[{t: 'seg', pts: hind(0), w: 30}]} fill={LUCA.coat} seed="side-hind-near" />
        {paw(k.hindPaw, LUCA.muzzle, 'side-hpaw-near', true)}
        <Union shapes={[{t: 'ellipse', c: k.thigh, rx: 56, ry: 44, rot: k.thighRot}]} fill={LUCA.haunches} seed="side-thigh" />
        <Sketch
          d={`M${k.thigh[0] - 44} ${k.thigh[1] + 18}l-8 8l9 2l-6 9l10 2`}
          strokeWidth={2.2}
          seed="side-thigh-fluff"
        />
        <Hatch d={`M${k.thigh[0] - 20} ${k.thigh[1] - 10}q8 8 4 20M${k.thigh[0]} ${k.thigh[1] - 14}q8 8 4 20M${k.thigh[0] + 18} ${k.thigh[1] - 6}q6 6 2 16`} />

        {/* near front paw in front of everything */}
        {paw(k.frontPaw, LUCA.muzzle, 'side-fpaw-near', true)}

        {/* bandana around the neck */}
        <Sketch
          d={`M${bandA[0] - 34} ${bandA[1] - 10}Q${bandA[0]} ${bandA[1] + 8} ${bandA[0] + 38} ${bandA[1] - 4}L${bandA[0] + 16} ${bandA[1] + 70}Z`}
          fill={LUCA.bandana}
          fillOpacity={1}
          strokeWidth={2.4}
          seed="side-bandana"
        />
        <path
          d={`M${bandA[0] - 8} ${bandA[1] + 10}l6 4M${bandA[0] + 16} ${bandA[1] + 12}l6 4M${bandA[0] + 6} ${bandA[1] + 32}l6 4M${bandA[0] + 16} ${bandA[1] + 52}l4 5M${bandA[0] - 20} ${bandA[1] + 2}l6 3`}
          stroke={LUCA.bandanaPattern}
          strokeWidth={3}
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
