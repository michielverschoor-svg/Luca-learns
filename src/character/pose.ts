import type {Expression} from '../types';

/**
 * Everything the character can do in a single frame. Scenes compute a pose
 * per frame from the animation cues; the character just draws it.
 */
export type LucaPose = {
  expression: Expression;
  /** Extra eyelid closing for blinks, 0..1. */
  blink: number;
  /** Head tilt in degrees, added to the expression's resting tilt. */
  headTilt: number;
  /** Head tipped back to look straight up, 0..1. */
  tipBack: number;
  /** Gaze override, -1..1. null = expression default. */
  look: {x: number; y: number} | null;
  /** Tail rotation in degrees. */
  tailWag: number;
  /** Extra ear lift in degrees (bounces, barks). */
  earBounce: number;
  /** Cheek puff, 0..1. */
  cheeks: number;
  /** Visibility of the sigh puff lines, 0..1. */
  exhale: number;
  /** Mouth open (bark), 0..1. */
  mouthOpen: number;
  tongue: number;
  /** Jaw position while chewing, 0..1. */
  chew: number;
  treatInMouth: boolean;
  /** Body offset in sketch units (y < 0 is up). */
  bodyX: number;
  bodyY: number;
  /** Whole-body lean in degrees. */
  lean: number;
  /** Vertical squash/stretch, 1 = none. */
  squash: number;
  /** Horizontal scale used to fake a spin, -1..1. */
  spin: number;
  /** Play bow, 0..1. */
  bow: number;
  /** 0 = sitting, 1 = standing. */
  stand: number;
  /** Front paws raised (jumping up at something), 0..1. */
  reach: number;
  /** Paw scrabble phase (radians) and strength. */
  scrabblePhase: number;
  scrabble: number;
  /** Subtle breathing, -1..1. */
  breathe: number;
  /** Side view run cycle strength (0..1) and phase (radians). */
  run: number;
  runPhase: number;
  /** Side view: ears streaming back (degrees), from speed or follow-through. */
  earStream: number;
};

export const restPose = (expression: Expression): LucaPose => ({
  expression,
  blink: 0,
  headTilt: 0,
  tipBack: 0,
  look: null,
  tailWag: 0,
  earBounce: 0,
  cheeks: 0,
  exhale: 0,
  mouthOpen: 0,
  tongue: 0,
  chew: 0,
  treatInMouth: false,
  bodyX: 0,
  bodyY: 0,
  lean: 0,
  squash: 1,
  spin: 1,
  bow: 0,
  stand: 0,
  reach: 0,
  scrabblePhase: 0,
  scrabble: 0,
  breathe: 0,
  run: 0,
  runPhase: 0,
  earStream: 0,
});
