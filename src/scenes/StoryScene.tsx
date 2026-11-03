import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Platypus} from '../character/BodyParts';
import {Luca} from '../character/Luca';
import {LucaSide} from '../character/LucaSide';
import {restPose, type LucaPose} from '../character/pose';
import {PENCIL, Sketch} from '../character/sketch';
import {buildTimeline, parseCues, type SceneTimeline, type TimedAction} from '../episode/cues';
import {FONTS} from '../fonts';
import {sfxSlug, type Framing, type Location, type StoryScene as StorySceneData} from '../types';
import {Background, GROUND_Y} from './Backgrounds';
import {Hand, HumanLegs} from './Human';
import {Paper} from './Paper';

/** Luca's size on the stage (sketch units -> stage pixels). */
const S = 1.15;
/** Side-view Luca's size on the stage. */
const S2 = 1.5;
const HUMAN_X = 500;
const JUMP_H = 170;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.quad);
const easeInOut = Easing.inOut(Easing.cubic);
const progress = (a: TimedAction, f: number) => clamp((f - a.start) / Math.max(1, a.end - a.start));

/** Where Luca sits at each location (stage x). */
const SPOT: Record<Location, number> = {room: 960, kitchen: 960, bathroom: 800, fridge: 1400};

type Setup = {
  framing: Framing;
  human: boolean;
  hand: boolean;
  treat: boolean;
  platypus: boolean;
};

/** Read the shot description for framing and props unless the JSON says otherwise. */
const inferSetup = (scene: StorySceneData, tl: SceneTimeline, location: Location): Setup => {
  const shot = scene.shot.toLowerCase();
  const framing: Framing =
    scene.framing ??
    (/close-?\s?up/.test(shot)
      ? 'close'
      : /low angle/.test(shot)
        ? 'low'
        : /wide/.test(shot)
          ? 'wide'
          : 'medium');
  const mentionsTreat = /treat|snack/.test(shot) || tl.has('handoff') || tl.has('trackTreat');
  const mentionsHuman = /human|her leg|his leg|person|owner/.test(shot);
  const treat = scene.treat ?? mentionsTreat;
  const human = scene.human ?? (mentionsHuman && framing !== 'close');
  const hand = treat || /\bhand\b/.test(shot);
  const platypus = scene.platypus ?? (location === 'room' && framing !== 'close' && framing !== 'low');
  return {framing, human, hand, treat, platypus};
};

type FrameState = {
  pose: LucaPose;
  lx: number;
  location: Location;
  segmentStart: number;
  segmentIndex: number;
  hand: {x: number; y: number; treat: boolean} | null;
  whoosh: number;
  woof: number;
  dust: number;
  crumbs: number;
  zoomBump: number;
};

const computeFrame = (
  f: number,
  frames: number,
  fps: number,
  scene: StorySceneData,
  tl: SceneTimeline,
  setup: Setup,
): FrameState => {
  const pose = restPose(scene.expression);
  const segIndex = Math.max(
    0,
    tl.segments.findIndex((s) => f >= s.start && f < s.end),
  );
  const seg = tl.segments[segIndex] ?? tl.segments[0];
  const location = seg.location;
  const side = scene.view === 'side';
  const lx = setup.human ? 1120 : SPOT[location] + (side ? 100 : 0);
  const ly = GROUND_Y;
  const toward = setup.human ? -(lx - HUMAN_X - 300) / S : 0;

  // Ambient life: breathing and a lazy tail.
  pose.breathe = Math.sin((2 * Math.PI * f) / (2.6 * fps));
  pose.tailWag = 3 * Math.sin((2 * Math.PI * f) / (3 * fps));

  // Blink.
  const blink = tl.get('blink');
  if (blink) {
    const blinkAt = (start: number) => {
      const d = f - start;
      return d < 0 || d > 7 ? 0 : d < 3 ? d / 3 : 1 - (d - 3) / 4;
    };
    if (blink.everySec) {
      const period = blink.everySec * fps;
      const first = period * 0.55;
      const k = Math.max(0, Math.floor((f - first) / period));
      pose.blink = Math.max(blinkAt(first + k * period), blinkAt(first + (k - 1) * period));
    } else {
      pose.blink = blinkAt(Math.round(frames * 0.6));
    }
  }

  // Tail wag.
  const wag = tl.get('tailWag');
  if (wag) {
    const [amp, hz] = wag.speed === 'slow' ? [9, 1.1] : wag.speed === 'fast' ? [16, 3.6] : [12, 2.2];
    pose.tailWag = amp * Math.sin((2 * Math.PI * hz * f) / fps);
  }

  // Head tilt.
  const tilt = tl.get('headTilt');
  if (tilt) {
    const size = tilt.size === 'small' ? 7 : tilt.size === 'big' ? 20 : 13;
    if (tilt.eachCut) {
      const local = f - seg.start;
      const dir = segIndex % 2 === 0 ? 1 : -1;
      pose.headTilt = dir * size * easeOut(clamp((local - 5) / 10));
    } else if (tilt.slow) {
      pose.headTilt = size * easeInOut(clamp((f - frames * 0.15) / (frames * 0.55)));
    } else {
      pose.headTilt = size * easeOut(clamp((f - frames * 0.12) / (0.4 * fps)));
    }
  }

  // Head tips back (following a lure): the bottom starts to sink too.
  if (tl.has('headTipBack')) {
    pose.tipBack = easeInOut(clamp((f - frames * 0.12) / (frames * 0.55)));
    pose.stand = 1 - 0.25 * pose.tipBack;
  }
  if (tl.has('tongueOut')) {
    pose.tongue = easeOut(clamp((f - frames * 0.35) / (0.5 * fps)));
  }

  // Treat and hand placement.
  // Side view faces left; its head sits forward of the body.
  const sideHead = (): [number, number] => {
    const hx = 94 + (108 - 94) * pose.stand;
    const hy = -240 + 34 * pose.stand;
    return [hx, hy];
  };
  const headX = () => (side ? lx - sideHead()[0] * S2 : lx + pose.bodyX * S);
  const headY = () =>
    side
      ? ly + (sideHead()[1] + pose.bodyY) * S2
      : ly + (228 - 532 + pose.bodyY - 30 * pose.stand + 77 * pose.bow - 12 * pose.tipBack) * S;
  let hand: FrameState['hand'] = null;
  if (setup.hand) {
    if (tl.has('trackTreat') || tl.has('headTipBack')) {
      const r = easeInOut(clamp((f - frames * 0.1) / (frames * 0.62)));
      hand = side
        ? {x: lx - 300 + 260 * r, y: ly - 300 - 230 * r, treat: setup.treat}
        : {x: lx - 20 + 30 * r, y: ly - 300 - 250 * r, treat: setup.treat};
    } else if (setup.human) {
      hand = {x: HUMAN_X + 290, y: ly - 450 + 4 * Math.sin(f / 9), treat: setup.treat};
    } else if (setup.framing === 'close') {
      hand = {x: lx - 150, y: ly - 300 + 4 * Math.sin(f / 9), treat: setup.treat};
    } else {
      hand = {x: (side ? lx - 330 : lx - 170), y: ly - 470 + 4 * Math.sin(f / 9), treat: setup.treat};
    }
  }

  if (tl.actions.some((a) => a.kind === 'sitDrop')) pose.stand = 1;

  let whoosh = 0;
  let woof = 0;
  let dust = 0;
  let crumbs = 0;
  let extraWag = 0;

  for (const a of tl.actions) {
    if (f < a.start) continue;
    const p = progress(a, f);
    const done = f >= a.end;
    switch (a.kind) {
      case 'jump': {
        const holds = a.chainedInto === 'slide';
        if (holds) {
          if (done) {
            pose.bodyY = -JUMP_H;
            pose.reach = 1;
            pose.bodyX = toward;
            pose.lean = -10;
            break;
          }
          if (p < 0.12) {
            pose.squash = 1 - 0.12 * (p / 0.12);
          } else {
            const e = easeOut(clamp((p - 0.12) / 0.38));
            pose.bodyY = -JUMP_H * e + (p > 0.5 ? 4 * Math.sin(f * 0.9) : 0);
            pose.reach = e;
            pose.bodyX = toward * e;
            pose.lean = -10 * e;
            pose.squash = 1 + 0.06 * (1 - e) * e * 4;
            pose.scrabble = p > 0.5 ? 0.5 : 0;
            pose.scrabblePhase = f * 1.3;
            pose.earBounce = 12 * e;
          }
        } else if (!done) {
          if (p < 0.15) {
            pose.squash = 1 - 0.1 * (p / 0.15);
          } else if (p < 0.85) {
            const q = (p - 0.15) / 0.7;
            pose.bodyY = -JUMP_H * 4 * q * (1 - q);
            pose.reach = 0.6 * Math.sin(Math.PI * q);
            pose.earBounce = 14 * Math.sin(Math.PI * q);
          } else {
            pose.squash = 1 - 0.1 * Math.sin((Math.PI * (p - 0.85)) / 0.15);
          }
        }
        break;
      }
      case 'slide': {
        if (a.slideDirection === 'down') {
          const startH = pose.bodyY < -1 ? -pose.bodyY : 120;
          if (done) {
            pose.bodyY = 0;
            pose.reach = 0;
            pose.lean = 0;
            pose.scrabble = 0;
            break;
          }
          pose.bodyY = -startH * (1 - Math.pow(p, 1.7));
          pose.reach = 1 - Math.pow(p, 3);
          pose.lean = pose.lean * (1 - p);
          pose.scrabble = p < 0.93 ? 1 : 0;
          pose.scrabblePhase = f * 1.6;
          pose.squash = p > 0.93 ? 1 - 0.1 * Math.sin((Math.PI * (p - 0.93)) / 0.07) : 1;
          pose.earBounce = 10 * (1 - p);
        } else {
          const dir = a.slideDirection === 'left' ? -1 : 1;
          pose.bodyX += dir * 260 * easeInOut(p);
          if (!done) pose.lean = dir * 8 * Math.sin(Math.PI * p);
        }
        break;
      }
      case 'spin': {
        if (done) {
          pose.spin = 1;
          break;
        }
        const q = easeInOut(p);
        pose.spin = Math.cos(2 * Math.PI * 2 * q);
        pose.bodyY += -26 * Math.sin(Math.PI * p);
        pose.earBounce = 10 * Math.sin(Math.PI * p);
        whoosh = Math.sin(Math.PI * p);
        break;
      }
      case 'bark': {
        if (done) break;
        const m = Math.sin(2 * Math.PI * 2 * p);
        const open = Math.pow(Math.max(0, m), 0.8);
        pose.mouthOpen = open;
        pose.earBounce += 10 * open;
        pose.bodyY += -12 * open;
        woof = open;
        break;
      }
      case 'playBow': {
        if (done) break;
        const env = p < 0.25 ? easeOut(p / 0.25) : p > 0.8 ? 1 - easeIn((p - 0.8) / 0.2) : 1;
        pose.bow = env;
        extraWag = 18 * env;
        pose.earBounce += 6 * env;
        break;
      }
      case 'sitDrop': {
        if (done) {
          pose.stand = 0;
          break;
        }
        const startStand = pose.stand;
        if (p < 0.3) {
          pose.stand = startStand * (1 - easeIn(p / 0.3));
        } else {
          pose.stand = 0;
          if (p < 0.5) pose.squash = 1 - 0.1 * Math.sin((Math.PI * (p - 0.3)) / 0.2);
        }
        dust = p > 0.28 && p < 0.7 ? (p - 0.28) / 0.42 : 0;
        break;
      }
      case 'handoff': {
        const mouthX = side ? headX() - 62 * S2 : headX() + 20;
        const mouthY = side ? headY() + 46 * S2 : headY() + 70 * S;
        const startX = side ? lx - 330 : lx - 170;
        const startY = ly - 500;
        if (done) {
          pose.treatInMouth = true;
          hand = null;
          break;
        }
        if (p < 0.5) {
          const e = easeInOut(p / 0.5);
          hand = {x: startX + (mouthX - startX) * e, y: startY + (mouthY - startY) * e, treat: true};
        } else {
          const e = easeIn((p - 0.5) / 0.5);
          hand = {x: mouthX + (startX - 80 - mouthX) * e, y: mouthY + (-200 - mouthY) * e, treat: false};
          pose.treatInMouth = true;
        }
        pose.look = {x: hand.x > headX() ? 0.3 : -0.5, y: 0.2};
        if (side) pose.look = {x: 0.6, y: 0.3};
        break;
      }
      case 'tipOver': {
        const e = done ? 1 : easeIn(clamp(p / 0.8));
        pose.lean = 72 * e;
        if (!done && p > 0.8) pose.squash = 1 - 0.06 * Math.sin((Math.PI * (p - 0.8)) / 0.2);
        break;
      }
      case 'chew': {
        if (done) {
          pose.treatInMouth = false;
          break;
        }
        pose.chew = p < 0.9 ? Math.abs(Math.sin(2 * Math.PI * 3 * p)) : 0;
        pose.treatInMouth = p < 0.25;
        pose.earBounce += 4 * pose.chew;
        crumbs = p;
        break;
      }
      case 'cheeksPuff': {
        if (done) break;
        if (p < 0.45) {
          pose.cheeks = easeOut(p / 0.45);
        } else if (p < 0.6) {
          pose.cheeks = 1 + 0.04 * Math.sin(f * 1.4);
        } else {
          const d = clamp((p - 0.6) / 0.25);
          pose.cheeks = 1 - easeOut(d);
          pose.exhale = Math.sin(Math.PI * clamp((p - 0.6) / 0.4));
          pose.squash = 1 - 0.035 * Math.sin(Math.PI * clamp((p - 0.6) / 0.4));
          pose.earBounce -= 8 * Math.sin(Math.PI * clamp((p - 0.6) / 0.4));
        }
        break;
      }
    }
  }

  // Before a handoff starts, the hand waits above with the treat.
  const handoff = tl.actions.find((a) => a.kind === 'handoff');
  if (handoff && f < handoff.start) {
    hand = {x: side ? lx - 330 : lx - 170, y: ly - 500 + 5 * Math.sin(f / 8), treat: true};
  }

  if (extraWag) pose.tailWag += extraWag * Math.sin((2 * Math.PI * 4 * f) / fps);

  // Eyes follow the treat.
  if (hand && hand.treat && (tl.has('trackTreat') || !pose.look)) {
    const dx = hand.x - headX();
    const dy = hand.y - headY();
    const len = Math.hypot(dx, dy) || 1;
    pose.look = {x: (side ? -dx : dx) / len, y: dy / len};
  }

  // Scrabbling paws without a slide: just paddle the whole time.
  if (tl.has('scrabble') && !tl.actions.some((a) => a.kind === 'slide')) {
    pose.scrabble = Math.max(pose.scrabble, 0.8);
    pose.scrabblePhase = f * 1.5;
  }

  const sinceCut = f - seg.start;
  const zoomBump = tl.segments.length > 1 ? 0.07 * Math.exp(-sinceCut / 5) : 0;

  return {
    pose,
    lx,
    location,
    segmentStart: seg.start,
    segmentIndex: segIndex,
    hand,
    whoosh,
    woof,
    dust,
    crumbs,
    zoomBump,
  };
};

const camera = (
  framing: Framing,
  lx: number,
  human: boolean,
  push: number,
  pushT: number,
  bump: number,
) => {
  const headY = GROUND_Y - 340;
  let z = 1;
  let fx = 960;
  let fy = 540;
  if (framing === 'medium') {
    z = 1.32;
    fx = human ? lx - 220 : lx;
    fy = 600;
  } else if (framing === 'close') {
    z = 2.1;
    fx = lx;
    fy = headY - 30;
  } else if (framing === 'low') {
    z = 1.5;
    fx = lx - 80;
    fy = GROUND_Y - 300;
  }
  const e = easeInOut(pushT);
  z *= 1 + push * e;
  fx += (lx - fx) * 0.6 * e * (push > 0 ? 1 : 0);
  fy += (headY - fy) * 0.6 * e * (push > 0 ? 1 : 0);
  z *= 1 + bump;
  fx = clamp(fx, 960 / z, 1920 - 960 / z);
  fy = clamp(fy, 540 / z, 1080 - 540 / z);
  return `translate(960 540) scale(${z}) translate(${-fx} ${-fy})`;
};

const Effects: React.FC<{st: FrameState; frame: number}> = ({st, frame}) => {
  const {pose, lx} = st;
  const bx = lx + pose.bodyX * S;
  const by = GROUND_Y + pose.bodyY * S;
  return (
    <g>
      {st.whoosh > 0.02 ? (
        <g opacity={st.whoosh}>
          <Sketch
            d={`M${bx - 260} ${by - 260}Q${bx} ${by - 340} ${bx + 260} ${by - 250}M${bx - 280} ${by - 120}Q${bx} ${by - 40} ${bx + 270} ${by - 130}M${bx + 230} ${by - 330}l40 10l-20 30`}
            strokeWidth={3}
            stroke="#5CC8C0"
            seed={`whoosh-${Math.floor(frame / 3)}`}
          />
        </g>
      ) : null}
      {st.woof > 0.25 ? (
        <g transform={`translate(${bx + 230} ${by - 470}) rotate(-10) scale(${0.7 + 0.4 * st.woof})`}>
          <Sketch d="M-130 -40l-30 -20M-130 0l-40 0M-130 40l-30 20" strokeWidth={3} stroke="#FF7A59" seed="woof-lines" />
          <text
            x={0}
            y={20}
            textAnchor="middle"
            fontFamily={FONTS.hand}
            fontSize={96}
            fill="#FFD23F"
            stroke={PENCIL}
            strokeWidth={5}
            paintOrder="stroke"
          >
            WOOF!
          </text>
        </g>
      ) : null}
      {st.dust > 0
        ? [-1, 1].map((s) => (
            <g key={s} opacity={1 - st.dust} transform={`translate(${bx + s * (190 + 80 * st.dust)} ${GROUND_Y - 10 - 30 * st.dust})`}>
              <Sketch d={`M0 0q${s * 20} -16 ${s * 40} 0M${s * 10} 18q${s * 20} -12 ${s * 36} 2`} strokeWidth={2.4} seed={`dust${s}`} />
            </g>
          ))
        : null}
      {st.crumbs > 0.05 && st.crumbs < 0.9
        ? [0, 1, 2, 3].map((i) => {
            const t = (st.crumbs * 3 + i * 0.27) % 1;
            return (
              <rect
                key={i}
                x={bx + 30 + i * 14 - 20}
                y={by - 260 + t * 240}
                width={7}
                height={6}
                fill="#B5793A"
                stroke={PENCIL}
                strokeWidth={1}
                opacity={1 - t}
                transform={`rotate(${i * 40} ${bx + 30 + i * 14 - 20} ${by - 260 + t * 240})`}
              />
            );
          })
        : null}
    </g>
  );
};

/**
 * When each sound effect fires, matched by name to the scene's actions:
 * "thump" lands with the jump, "bark" on each bark, "pop" on each cut, etc.
 * Returns frame offsets, or 'loop' for ambience.
 */
const sfxTimes = (name: string, tl: SceneTimeline, frames: number, fps: number): number[] | 'loop' => {
  const act = (kind: TimedAction['kind']) => tl.actions.find((a) => a.kind === kind);
  const at = (a: TimedAction | undefined, p: number) => (a ? [Math.round(a.start + (a.end - a.start) * p)] : null);
  if (/room|ambien|tone/.test(name)) return 'loop';
  if (/sigh/.test(name)) return at(act('cheeksPuff'), 0.58) ?? [Math.round(frames * 0.3)];
  if (/thump/.test(name)) {
    const jump = act('jump');
    return at(jump, jump?.chainedInto === 'slide' ? 0.45 : 0.85) ?? [0];
  }
  if (/scrabble/.test(name)) return at(act('slide'), 0) ?? [Math.round(frames * 0.2)];
  if (/trombone/.test(name)) return [Math.max(0, frames - Math.round(2.6 * fps))];
  if (/bark|woof/.test(name)) {
    const b = act('bark');
    return b ? [0.08, 0.58].map((p) => Math.round(b.start + (b.end - b.start) * p)) : [0];
  }
  if (/whoosh/.test(name)) return at(act('spin'), 0.05) ?? [0];
  if (/sparkle/.test(name)) return [Math.round(frames * 0.12)];
  if (/plop/.test(name)) return at(act('sitDrop'), 0.28) ?? [0];
  if (/crunch|chew/.test(name)) return at(act('chew'), 0.02) ?? [0];
  if (/pop/.test(name)) return tl.segments.map((s) => s.start);
  if (/twinkle/.test(name)) return [Math.round(frames * 0.4)];
  return [0];
};

/** When the off-screen human speaks: as the treat is handed over, otherwise right at the start. */
const humanLineFrame = (tl: SceneTimeline, frames: number) => {
  const handoff = tl.actions.find((a) => a.kind === 'handoff');
  if (handoff) return Math.round(handoff.start + (handoff.end - handoff.start) * 0.4);
  return Math.round(frames * 0.04);
};

/** A speech bubble from the off-screen human, top left, popping in for about 1.5 seconds. */
const HumanLine: React.FC<{text: string; at: number}> = ({text, at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - at;
  if (local < 0 || local > 1.6 * fps) return null;
  const pop = spring({frame: local, fps, config: {damping: 9, stiffness: 180}});
  const out = interpolate(local, [1.35 * fps, 1.6 * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <g transform={`translate(330 170) scale(${pop}) rotate(-4)`} opacity={out}>
          <path d="M-110 -40L-200 -150L-60 -64Z" fill="#FFFDF7" stroke={PENCIL} strokeWidth={7} strokeLinejoin="round" />
          <ellipse cx={0} cy={0} rx={190} ry={86} fill="#FFFDF7" stroke={PENCIL} strokeWidth={7} />
          <path d="M-96 -52L-150 -116L-50 -60Z" fill="#FFFDF7" />
          <text x={0} y={28} textAnchor="middle" fontFamily={FONTS.hand} fontSize={96} fill="#FF7A59" stroke={PENCIL} strokeWidth={3} paintOrder="stroke">
            {text}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const SceneSfx: React.FC<{
  names: string[];
  files: Record<string, string>;
  tl: SceneTimeline;
  frames: number;
  fps: number;
}> = ({names, files, tl, frames, fps}) => (
  <>
    {names.map((raw) => {
      const file = files[sfxSlug(raw)];
      if (!file) return null;
      const times = sfxTimes(raw.toLowerCase(), tl, frames, fps);
      if (times === 'loop') {
        return <Html5Audio key={raw} src={staticFile(file)} loop volume={0.8} />;
      }
      return times.map((t, i) => (
        <Sequence key={`${raw}-${i}`} from={t} layout="none">
          <Html5Audio src={staticFile(file)} volume={0.45} />
        </Sequence>
      ));
    })}
  </>
);

export const StoryScene: React.FC<{scene: StorySceneData; sfx?: Record<string, string>}> = ({
  scene,
  sfx = {},
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {tl, setup} = useMemo(() => {
    const cues = parseCues(scene.animation, scene.id);
    const timeline = buildTimeline(cues, durationInFrames, scene.location ?? 'room');
    return {tl: timeline, setup: inferSetup(scene, timeline, scene.location ?? timeline.segments[0].location)};
  }, [scene, durationInFrames]);

  const st = computeFrame(frame, durationInFrames, fps, scene, tl, setup);
  const push = tl.get('pushIn');
  const side = scene.view === 'side';
  const cam = camera(
    setup.framing,
    side ? st.lx - 130 : st.lx,
    setup.human,
    push?.amount ?? 0,
    clamp(frame / durationInFrames),
    st.zoomBump,
  );
  const fadeIn = interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{opacity: fadeIn}}>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <g transform={cam}>
            <Background location={st.location} />
            {setup.platypus ? (
              <g
                transform={`translate(${tl.has('tipOver') ? st.lx + 430 : st.lx > 1200 ? 520 : 1560} ${GROUND_Y + 30})`}
              >
                <Platypus scale={1.2} rotate={-4} />
              </g>
            ) : null}
            {setup.human ? <HumanLegs x={HUMAN_X} ground={GROUND_Y + 10} /> : null}
            {side ? (
              <LucaSide pose={st.pose} x={st.lx} y={GROUND_Y} scale={S2} flip />
            ) : (
              <Luca pose={st.pose} x={st.lx} y={GROUND_Y} scale={S} />
            )}
            {st.hand ? <Hand hx={st.hand.x} hy={st.hand.y} treat={st.hand.treat} /> : null}
            <Effects st={st} frame={frame} />
          </g>
        </svg>
      </AbsoluteFill>
      <Paper overlay />
      {scene.humanLine ? <HumanLine text={scene.humanLine} at={humanLineFrame(tl, durationInFrames)} /> : null}
      <SceneSfx names={scene.sfx ?? []} files={sfx} tl={tl} frames={durationInFrames} fps={fps} />
    </AbsoluteFill>
  );
};
