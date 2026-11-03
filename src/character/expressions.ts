import type {Expression} from '../types';

export type EyeStyle = 'dark' | 'sparkle' | 'sclera';
export type MouthStyle = 'neutral' | 'smirk' | 'frown' | 'open' | 'wavy' | 'o' | 'soft';
export type Extra = 'tear' | 'sweat' | 'zzz' | 'drool';

export type FaceConfig = {
  eyeStyle: EyeStyle;
  eyeR: number;
  /** Resting eyelid: 0 = wide open, 1 = shut. */
  lid: number;
  /** Brow path in head coordinates (left then right). */
  brows: string;
  mouth: MouthStyle;
  /** Ear lift in degrees, [left, right]. Positive lifts the ear outward, negative pins it back. */
  ears: [number, number];
  /** Resting head tilt in degrees on top of the sketch's -9. */
  tilt: number;
  /** Resting gaze, -1..1. */
  look: {x: number; y: number};
  extras: Extra[];
};

export const FACES: Record<Expression, FaceConfig> = {
  curious: {
    eyeStyle: 'dark',
    eyeR: 12,
    lid: 0,
    brows: 'M-54 -38Q-40 -50 -22 -40M22 -36Q38 -42 52 -34',
    mouth: 'neutral',
    ears: [10, 2],
    tilt: 4,
    look: {x: 0, y: 0},
    extras: [],
  },
  smug: {
    eyeStyle: 'dark',
    eyeR: 11,
    lid: 0.5,
    brows: 'M-54 -30Q-38 -34 -22 -28M22 -38Q38 -46 54 -36',
    mouth: 'smirk',
    ears: [0, 0],
    tilt: -4,
    look: {x: 0.3, y: 0},
    extras: [],
  },
  betrayed: {
    eyeStyle: 'dark',
    eyeR: 13,
    lid: 0.12,
    brows: 'M-56 -28Q-42 -32 -24 -44M24 -44Q42 -32 56 -28',
    mouth: 'frown',
    ears: [-10, -10],
    tilt: 6,
    look: {x: 0, y: 0.2},
    extras: ['tear'],
  },
  'treat-hypnotized': {
    eyeStyle: 'sparkle',
    eyeR: 14,
    lid: 0,
    brows: 'M-54 -42Q-38 -54 -22 -44M22 -44Q38 -54 54 -42',
    mouth: 'open',
    ears: [6, 6],
    tilt: 0,
    look: {x: 0, y: -0.4},
    extras: ['drool'],
  },
  guilty: {
    eyeStyle: 'dark',
    eyeR: 10,
    lid: 0.28,
    brows: 'M-54 -30Q-40 -34 -24 -42M24 -42Q40 -34 54 -30',
    mouth: 'wavy',
    ears: [-16, -16],
    tilt: 8,
    look: {x: -0.8, y: 0.6},
    extras: ['sweat'],
  },
  sleepy: {
    eyeStyle: 'dark',
    eyeR: 11,
    lid: 0.72,
    brows: 'M-52 -28Q-38 -32 -22 -28M22 -28Q38 -32 52 -28',
    mouth: 'soft',
    ears: [-8, -8],
    tilt: 10,
    look: {x: 0, y: 0.3},
    extras: ['zzz'],
  },
  surprised: {
    eyeStyle: 'sclera',
    eyeR: 15,
    lid: 0,
    brows: 'M-56 -44Q-40 -60 -22 -48M22 -48Q40 -60 56 -44',
    mouth: 'o',
    ears: [16, 16],
    tilt: 0,
    look: {x: 0, y: 0},
    extras: [],
  },
};
