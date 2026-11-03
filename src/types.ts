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
  /** Luca's thought. With cuts, a list gives each location its own bubble. */
  voiceover: string | string[] | null;
  sfx?: string[];
  /** Camera side: 'front' (default) or 'side' profile, which shows sitting clearly. */
  view?: 'front' | 'side';
  /** A short line the (off-screen) human says, shown as a speech bubble. */
  humanLine?: string;
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

/** A short "Step N" card between scenes, for step-by-step lessons. */
export type StepCardScene = {
  id: string;
  type: 'stepCard';
  durationSec: number;
  step: number;
  text: string;
};

/** Opening title: series name, episode label and title. */
export type TitleCardScene = {
  id: string;
  type: 'titleCard';
  durationSec: number;
  /** Defaults to "Luca Learns". */
  series?: string;
  /** Small text on the ribbon, e.g. "Episode 1". */
  episodeLabel?: string;
  /** Big text on the ribbon, e.g. "Sit!". */
  title: string;
};

export type Scene = StoryScene | TipCardScene | StepCardScene | TitleCardScene;

export type Episode = {
  id: string;
  title: string;
  youtubeTitle?: string;
  fps: number;
  resolution: [number, number];
  background?: string;
  /** Optional thumbnail settings for `npm run thumbnail` (text, expression, color, badge). */
  thumbnail?: {text?: string; expression?: Expression; color?: string; badge?: string};
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
export const isStepCard = (s: Scene): s is StepCardScene => s.type === 'stepCard';
export const isTitleCard = (s: Scene): s is TitleCardScene => s.type === 'titleCard';
