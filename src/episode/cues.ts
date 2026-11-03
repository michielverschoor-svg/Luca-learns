import type {Location} from '../types';

/**
 * Animation cues come from the episode JSON as loose strings like
 * "blink:every 3s", "tail:slow wag", "camera:push-in 10%" or "body:slide down".
 * They are normalised here into typed cues.
 */
export type ActionKind =
  | 'jump'
  | 'slide'
  | 'spin'
  | 'playBow'
  | 'sitDrop'
  | 'bark'
  | 'handoff'
  | 'chew'
  | 'cheeksPuff'
  | 'tipOver'
  | 'zoomies';

export type Cue =
  | {kind: 'blink'; everySec: number | null}
  | {kind: 'tailWag'; speed: 'slow' | 'normal' | 'fast'}
  | {kind: 'headTilt'; size: 'small' | 'normal' | 'big'; slow: boolean; eachCut: boolean}
  | {kind: 'headTipBack'}
  | {kind: 'pushIn'; amount: number}
  | {kind: 'punchIn'; at: number | null}
  | {kind: 'scrabble'}
  | {kind: 'trackTreat'}
  | {kind: 'tongueOut'}
  | {kind: 'cut'; location: Location}
  | {kind: 'slide'; direction: 'down' | 'left' | 'right'}
  | {kind: Exclude<ActionKind, 'slide'>};

const LOCATIONS: Location[] = ['kitchen', 'bathroom', 'fridge', 'room'];

export const parseCue = (raw: string): Cue | null => {
  const text = raw.trim().toLowerCase();
  const idx = text.indexOf(':');
  const target = idx === -1 ? text : text.slice(0, idx).trim();
  const action = idx === -1 ? '' : text.slice(idx + 1).trim();
  const all = `${target} ${action}`;

  if (target === 'cut') {
    const location = LOCATIONS.find((l) => action.includes(l)) ?? 'room';
    return {kind: 'cut', location};
  }
  if (/punch/.test(all)) {
    const at = /(?:at|@)\s*(\d+(?:\.\d+)?)\s*s/.exec(all);
    return {kind: 'punchIn', at: at ? parseFloat(at[1]) : null};
  }
  if (/zoomies|run around|race around/.test(all)) return {kind: 'zoomies'};
  if (target === 'camera' || /push-?in/.test(all)) {
    const pct = /(\d+(?:\.\d+)?)\s*%/.exec(action);
    return {kind: 'pushIn', amount: pct ? parseFloat(pct[1]) / 100 : 0.15};
  }
  if (target === 'blink' || /\bblink/.test(all)) {
    const every = /every\s+(\d+(?:\.\d+)?)\s*s/.exec(all);
    return {kind: 'blink', everySec: every ? parseFloat(every[1]) : null};
  }
  if (target === 'tail' || /\bwag/.test(all)) {
    const speed = /slow/.test(all) ? 'slow' : /fast|happy|wild/.test(all) ? 'fast' : 'normal';
    return {kind: 'tailWag', speed};
  }
  if (/cheek|puff|sigh/.test(all)) return {kind: 'cheeksPuff'};
  if (/tip back|tips back|look up/.test(all)) return {kind: 'headTipBack'};
  if (/tip over|tips over|fall over|topple/.test(all)) return {kind: 'tipOver'};
  if (/tilt/.test(all)) {
    const size = /small|slight/.test(all) ? 'small' : /big|large/.test(all) ? 'big' : 'normal';
    return {kind: 'headTilt', size, slow: /slow/.test(all), eachCut: /each cut|every cut/.test(all)};
  }
  if (/scrabble|paddle/.test(all)) return {kind: 'scrabble'};
  if (/track/.test(all)) return {kind: 'trackTreat'};
  if (/tongue/.test(all)) return {kind: 'tongueOut'};
  if (/handoff|hand off|give/.test(all)) return {kind: 'handoff'};
  if (/chew|crunch|munch/.test(all)) return {kind: 'chew'};
  if (/bark|woof/.test(all)) return {kind: 'bark'};
  if (/sit-?drop|sit/.test(all)) return {kind: 'sitDrop'};
  if (/play-?bow|bow/.test(all)) return {kind: 'playBow'};
  if (/spin/.test(all)) return {kind: 'spin'};
  if (/jump|hop/.test(all)) return {kind: 'jump'};
  if (/slide/.test(all)) {
    const direction = /left/.test(all) ? 'left' : /right/.test(all) ? 'right' : 'down';
    return {kind: 'slide', direction};
  }
  return null;
};

export const parseCues = (raw: string[], sceneId: string): Cue[] => {
  const cues: Cue[] = [];
  for (const r of raw) {
    const cue = parseCue(r);
    if (cue) {
      cues.push(cue);
    } else if (typeof console !== 'undefined') {
      console.warn(`[${sceneId}] Unknown animation cue "${r}" was ignored.`);
    }
  }
  return cues;
};

const ACTION_KINDS: ActionKind[] = [
  'jump',
  'slide',
  'spin',
  'playBow',
  'sitDrop',
  'bark',
  'handoff',
  'chew',
  'cheeksPuff',
  'tipOver',
  'zoomies',
];

/** Relative share of the scene each action takes when several are chained. */
const ACTION_WEIGHT: Record<ActionKind, number> = {
  jump: 1,
  slide: 1.4,
  spin: 1.1,
  playBow: 1.4,
  sitDrop: 0.8,
  bark: 1,
  handoff: 1,
  chew: 1.6,
  cheeksPuff: 1,
  tipOver: 1.5,
  zoomies: 2.4,
};

export type TimedAction = {
  kind: ActionKind;
  start: number;
  end: number;
  slideDirection?: 'down' | 'left' | 'right';
  /** True when the next action continues from this one (e.g. jump then slide down). */
  chainedInto?: ActionKind;
};

export type Segment = {location: Location; start: number; end: number};

export type SceneTimeline = {
  cues: Cue[];
  actions: TimedAction[];
  segments: Segment[];
  has: (kind: Cue['kind']) => boolean;
  get: <K extends Cue['kind']>(kind: K) => Extract<Cue, {kind: K}> | undefined;
};

/**
 * Actions (jump, spin, bark...) play one after another in the order they are
 * listed. Everything else (blink, wag, tilt, push-in) runs across the scene.
 */
export const buildTimeline = (
  cues: Cue[],
  frames: number,
  defaultLocation: Location,
): SceneTimeline => {
  const actionCues = cues.filter((c): c is Extract<Cue, {kind: ActionKind}> =>
    (ACTION_KINDS as string[]).includes(c.kind),
  );
  const lead = Math.round(frames * 0.08);
  const tail = Math.round(frames * 0.06);
  const usable = Math.max(1, frames - lead - tail);
  const totalWeight = actionCues.reduce((sum, c) => sum + ACTION_WEIGHT[c.kind], 0);
  let cursor = lead;
  const actions: TimedAction[] = actionCues.map((c, i) => {
    const len = (usable * ACTION_WEIGHT[c.kind]) / totalWeight;
    const a: TimedAction = {
      kind: c.kind,
      start: Math.round(cursor),
      end: Math.round(cursor + len),
      slideDirection: c.kind === 'slide' ? c.direction : undefined,
      chainedInto: actionCues[i + 1]?.kind,
    };
    cursor += len;
    return a;
  });

  const cutCues = cues.filter((c): c is Extract<Cue, {kind: 'cut'}> => c.kind === 'cut');
  const segments: Segment[] =
    cutCues.length === 0
      ? [{location: defaultLocation, start: 0, end: frames}]
      : cutCues.map((c, i) => ({
          location: c.location,
          start: Math.round((frames * i) / cutCues.length),
          end: Math.round((frames * (i + 1)) / cutCues.length),
        }));

  return {
    cues,
    actions,
    segments,
    has: (kind) => cues.some((c) => c.kind === kind),
    get: (kind) => cues.find((c) => c.kind === kind) as never,
  };
};
