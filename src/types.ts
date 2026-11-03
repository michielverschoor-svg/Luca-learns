export type Expression =
  | 'curious'
  | 'smug'
  | 'betrayed'
  | 'treat-hypnotized'
  | 'guilty'
  | 'sleepy'
  | 'surprised';

export const EXPRESSIONS: Expression[] = [
  'curious',
  'smug',
  'betrayed',
  'treat-hypnotized',
  'guilty',
  'sleepy',
  'surprised',
];

export type Location = 'room' | 'kitchen' | 'bathroom' | 'fridge';

export type Framing = 'wide' | 'medium' | 'close' | 'low';

export type StoryScene = {
  id: string;
  type?: 'story';
  durationSec: number;
  shot: string;
  expression: Expression;
  animation: string[];
  voiceover: string | null;
  sfx?: string[];
  /** Optional overrides. When omitted they are inferred from `shot`. */
  framing?: Framing;
  location?: Location;
  human?: boolean;
  treat?: boolean;
  platypus?: boolean;
};

export type TipCardScene = {
  id: string;
  type: 'tipCard';
  durationSec: number;
  heading: string;
  steps: string[];
};

export type Scene = StoryScene | TipCardScene;

export type Episode = {
  id: string;
  title: string;
  youtubeTitle?: string;
  fps: number;
  resolution: [number, number];
  background?: string;
  scenes: Scene[];
};

export type EpisodeProps = {
  episode: Episode;
  /** sceneId -> static file path inside audio/ (e.g. "ep01/s01.mp3"). */
  audio: Record<string, string>;
  /** sceneId -> clip length in seconds, used to stretch scenes that are too short. */
  audioDurations: Record<string, number>;
  /** Sound-effect name -> static file path inside audio/ (e.g. "thump" -> "sfx/thump.mp3"). */
  sfx: Record<string, string>;
};

/** "sad trombone (short)" -> "sad-trombone", "pop cut x3" -> "pop-cut". */
export const sfxSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\bx\d+\b/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const isTipCard = (s: Scene): s is TipCardScene => s.type === 'tipCard';
