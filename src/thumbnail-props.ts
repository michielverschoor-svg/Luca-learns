import type {Expression} from './types';

export type ThumbnailProps = {
  /** Big text, 1 to 3 words. */
  text: string;
  expression: Expression;
  /** Background colour of the sunburst. */
  color: string;
  /** Small badge, e.g. "Luca Learns". */
  badge: string;
};

export const thumbnailDefaults: ThumbnailProps = {
  text: 'SIT?!',
  expression: 'treat-hypnotized',
  color: '#2FA3E6',
  badge: 'Luca Learns',
};
