import React from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import clip from '../../assets/clips/mirror-ai.mp4';
import {Platypus} from '../character/BodyParts';
import {Luca} from '../character/Luca';
import {restPose} from '../character/pose';
import {FONTS} from '../fonts';
import {Paper} from '../scenes/Paper';
import {BUBBLE_COLORS, ThoughtBubble} from '../scenes/ThoughtBubble';

/*
 * Vertical YouTube Short (1080x1920) built on the AI-generated mirror clip
 * (assets/clips/mirror-ai.mp4, 828x1108, ~15s), with Luca's thoughts as
 * cartoon thought bubbles, then a short end card.
 */

const W = 1080;
const H = 1920;
const INK = '#3A2A20';
const CLIP_W = 828;
const CLIP_H = 1108;
const CLIP_SEC = 15;
const TOP = 250;
const SCALE = W / CLIP_W;
const VIDEO_H = CLIP_H * SCALE;
export const MIRROR_SHORT_END_SEC = 2.5;

/** Luca's head in the clip, once per second (clip pixels). */
const HEAD: [number, number][] = [
  [450, 390], [414, 420], [474, 450], [504, 420], [504, 405],
  [360, 342], [264, 507], [159, 552], [174, 582], [174, 567],
  [360, 570], [474, 630], [474, 630], [444, 570], [384, 390], [384, 390],
];

const headAt = (sec: number) => {
  const i = Math.max(0, Math.min(HEAD.length - 2, Math.floor(sec)));
  const t = Math.max(0, Math.min(1, sec - i));
  const [x0, y0] = HEAD[i];
  const [x1, y1] = HEAD[i + 1];
  return {x: (x0 + (x1 - x0) * t) * SCALE, y: TOP + (y0 + (y1 - y0) * t) * SCALE, r: 110 * SCALE};
};

/** Luca's thoughts over the clip (seconds). */
const THOUGHTS: {text: string; from: number; to: number; side?: 'left' | 'right'; dy?: number}[] = [
  {text: 'Who is this handsome stranger?', from: 0.3, to: 3.0, dy: -60},
  {text: "...He's VERY handsome.", from: 3.1, to: 5.0, side: 'left'},
  {text: 'Wait. He has MY platypus.', from: 5.2, to: 7.6, side: 'right', dy: -190},
  {text: 'He copies everything I do!', from: 7.8, to: 10.0, side: 'right', dy: -260},
  {text: 'Mine. MINE.', from: 10.2, to: 12.8, side: 'left'},
  {text: 'Same time tomorrow, stranger.', from: 13.0, to: 15.0},
];

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pop = spring({frame, fps, config: {damping: 9, stiffness: 150}});
  const pose = {...restPose('smug'), tailWag: 16 * Math.sin(t * 15), headTilt: 8 * Math.sin(t * 3), breathe: Math.sin(t * 3)};
  return (
    <AbsoluteFill style={{backgroundColor: '#FFD23F'}}>
      <AbsoluteFill>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(540 1100) rotate(${t * 10})`}>
            {new Array(16).fill(0).map((_, i) => {
              const a0 = (i / 16) * Math.PI * 2;
              const a1 = a0 + Math.PI / 16;
              return (
                <path key={i} d={`M0 0L${Math.cos(a0) * 2000} ${Math.sin(a0) * 2000}L${Math.cos(a1) * 2000} ${Math.sin(a1) * 2000}Z`} fill="#FFE77A" />
              );
            })}
          </g>
        </svg>
      </AbsoluteFill>
      <Paper overlay />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 260}}>
        <div
          style={{
            transform: `scale(${pop}) rotate(-4deg)`,
            fontFamily: FONTS.hand,
            fontSize: 170,
            lineHeight: 1,
            color: '#FF7A59',
            WebkitTextStroke: `10px ${INK}`,
            paintOrder: 'stroke fill',
            textShadow: `8px 8px 0 ${INK}`,
          }}
        >
          Luca Learns
        </div>
        <div
          style={{
            marginTop: 40,
            transform: `scale(${spring({frame: frame - 8, fps, config: {damping: 10}})}) rotate(-2deg)`,
            background: '#C8342B',
            border: `6px solid ${INK}`,
            borderRadius: 20,
            padding: '10px 40px 16px',
            boxShadow: `8px 8px 0 ${INK}`,
            fontFamily: FONTS.clean,
            fontWeight: 800,
            fontSize: 60,
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          More Luca every week!
        </div>
      </AbsoluteFill>
      <AbsoluteFill>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <Luca pose={pose} x={500} y={1760} scale={1.3} />
          <g transform="translate(840 1760)">
            <Platypus scale={1.5} rotate={-6} />
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MirrorShort: React.FC<{sfx?: Record<string, string>}> = ({sfx = {}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = frame / fps;
  const clipFrames = Math.round(CLIP_SEC * fps);
  const head = headAt(Math.min(sec, CLIP_SEC - 0.01));
  const fadeTop = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#FFD23F'}}>
      <Sequence durationInFrames={clipFrames}>
        {/* frame around the clip */}
        <AbsoluteFill>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
            {new Array(9).fill(0).map((_, i) => (
              <circle key={i} cx={60 + i * 120} cy={1810 + 18 * Math.sin(sec * 2 + i)} r={16} fill="#FFFFFF" opacity={0.4} />
            ))}
          </svg>
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 0, top: TOP, width: W, height: VIDEO_H, overflow: 'hidden', borderTop: `8px solid ${INK}`, borderBottom: `8px solid ${INK}`, boxSizing: 'border-box'}}>
          <OffthreadVideo src={clip} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
        {/* top band: series badge */}
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 50, opacity: fadeTop}}>
          <div
            style={{
              background: '#C8342B',
              border: `6px solid ${INK}`,
              borderRadius: 999,
              padding: '8px 44px 14px',
              boxShadow: `7px 7px 0 ${INK}`,
              fontFamily: FONTS.hand,
              fontSize: 96,
              lineHeight: 1,
              color: '#FFFFFF',
              WebkitTextStroke: `4px ${INK}`,
              paintOrder: 'stroke fill',
              transform: 'rotate(-3deg)',
            }}
          >
            Luca Learns
          </div>
        </AbsoluteFill>
        {/* bottom band: honest label */}
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONTS.clean, fontWeight: 700, fontSize: 30, color: INK, opacity: 0.75}}>AI-generated clip</div>
        </AbsoluteFill>
        {THOUGHTS.map((t, i) => (
          <ThoughtBubble
            key={i}
            text={t.text}
            from={Math.round(t.from * fps)}
            to={Math.round(t.to * fps)}
            color={BUBBLE_COLORS[(i + 1) % BUBBLE_COLORS.length]}
            head={head}
            canvas={{w: W, h: H}}
            side={t.side}
            offset={{x: 0, y: t.dy ?? 0}}
          />
        ))}
        {sfx['bubble-pop']
          ? THOUGHTS.map((t, i) => (
              <Sequence key={`p${i}`} from={Math.round(t.from * fps)} layout="none">
                <Html5Audio src={staticFile(sfx['bubble-pop'])} volume={0.4} />
              </Sequence>
            ))
          : null}
        {sfx.squeak ? (
          <Sequence from={Math.round(10.6 * fps)} layout="none">
            <Html5Audio src={staticFile(sfx.squeak)} volume={0.5} />
          </Sequence>
        ) : null}
      </Sequence>
      <Sequence from={clipFrames}>
        <EndCard />
        {sfx.chime ? <Html5Audio src={staticFile(sfx.chime)} volume={0.55} /> : null}
      </Sequence>
    </AbsoluteFill>
  );
};
