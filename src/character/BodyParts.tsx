import React from 'react';
import {LUCA} from './palette';
import {Hatch, Sketch} from './sketch';

/* Body parts use the full sketch coordinates from luca-sketch.svg (680x610,
   ground under the paws at y = 532). */

export const Shadow: React.FC<{spread: number; opacity: number}> = ({spread, opacity}) => (
  <g transform={`translate(340 532) scale(${spread} 1) translate(-340 -532)`} opacity={opacity}>
    <ellipse cx={340} cy={532} rx={185} ry={14} fill="#000" opacity={0.07} />
    <Hatch d="M190 538L490 538M212 544L468 544M240 550L440 550" />
  </g>
);

const TAIL = 'M440 500L470 506L478 498L500 504L508 490L528 490L534 474L552 468L554 450L572 440L568 420L580 408L564 388Q556 430 520 460Q480 480 450 478';

export const Tail: React.FC = () => (
  <g>
    <Sketch d={TAIL} fillD={`${TAIL}Z`} fill={LUCA.coat} seed="tail" />
    <Hatch d="M500 440q8 -4 14 4M520 420q8 -4 14 4M490 465q8 -4 14 4" />
  </g>
);

const HAUNCH_L = 'M285 430Q225 420 218 480Q222 520 262 515Q290 505 296 470';
const HAUNCH_R = 'M395 430Q455 420 462 480Q458 520 418 515Q390 505 384 470';
const HIND_PAW_L = 'M205 512Q215 495 255 498Q280 505 272 524Q235 532 205 522Z';
const HIND_PAW_R = 'M475 512Q465 495 425 498Q400 505 408 524Q445 532 475 522Z';

export const Haunch: React.FC<{side: 'left' | 'right'}> = ({side}) => {
  const left = side === 'left';
  const d = left ? HAUNCH_L : HAUNCH_R;
  return (
    <g>
      <Sketch
        d={d}
        fillD={`${d}Z`}
        fill={LUCA.haunches}
        detail={left ? 'M218 484l-8 8l9 2l-6 9l10 2' : 'M462 484l8 8l-9 2l6 9l-10 2'}
        seed={`haunch-${side}`}
      />
      <Hatch
        d={
          left
            ? 'M232 450q6 8 4 18M246 448q6 8 4 18M236 482q6 6 4 14'
            : 'M448 450q-6 8 -4 18M434 448q-6 8 -4 18M444 482q-6 6 -4 14'
        }
      />
    </g>
  );
};

export const HindPaw: React.FC<{side: 'left' | 'right'}> = ({side}) => (
  <Sketch d={side === 'left' ? HIND_PAW_L : HIND_PAW_R} fill={LUCA.muzzle} seed={`hindpaw-${side}`} />
);

export const Torso: React.FC = () => (
  <g>
    <Sketch
      d="M268 332Q256 430 272 500M412 332Q424 430 408 500"
      fillD="M268 332Q256 430 272 500Q340 520 408 500Q424 430 412 332Q340 305 268 332Z"
      fill={LUCA.coat}
      seed="torso"
    />
    <Hatch d="M280 350q4 12 0 22M278 380q4 12 0 22M280 410q4 12 0 18M400 350q-4 12 0 22M402 380q-4 12 0 22M400 410q-4 12 0 18" />
  </g>
);

const CHEST = 'M300 350L292 364L304 368L296 386L310 388L304 408L318 408L322 430L340 446L358 430L362 408L376 408L370 388L384 386L376 368L388 364L380 350';

export const Chest: React.FC = () => (
  <Sketch d={CHEST} fillD={`${CHEST}Q340 336 300 350Z`} fill={LUCA.chest} seed="chest" />
);

const FRONT_LEG_L = {
  fill: 'M306 420L298 434L306 440L298 456L306 462L298 478L304 484L298 500L336 504Q334 470 336 430Z',
  lines: 'M336 430Q334 470 336 500M306 420L298 434L306 440L298 456L306 462L298 478L304 484L298 500',
};
const FRONT_LEG_R = {
  fill: 'M344 430Q346 470 344 504L382 500L376 484L382 478L374 462L382 456L374 440L382 434L374 420Z',
  lines: 'M344 430Q346 470 344 500M374 420L382 434L374 440L382 456L374 462L382 478L376 484L382 500',
};

export const FrontLeg: React.FC<{side: 'left' | 'right'}> = ({side}) => {
  const leg = side === 'left' ? FRONT_LEG_L : FRONT_LEG_R;
  return <Sketch d={leg.lines} fillD={leg.fill} fill={LUCA.coat} seed={`frontleg-${side}`} />;
};

export const FrontPaw: React.FC<{side: 'left' | 'right'}> = ({side}) =>
  side === 'left' ? (
    <Sketch
      d="M284 508Q288 490 314 492Q336 494 335 512Q332 528 298 526Q282 522 284 508Z"
      detail="M306 506L306 522M320 504L320 520"
      fill={LUCA.muzzle}
      seed="frontpaw-left"
    />
  ) : (
    <Sketch
      d="M396 508Q392 490 366 492Q344 494 345 512Q348 528 382 526Q398 522 396 508Z"
      detail="M374 506L374 522M360 504L360 520"
      fill={LUCA.muzzle}
      seed="frontpaw-right"
    />
  );

const BANDANA = 'M258 322Q340 352 422 322L340 434Z';

export const Bandana: React.FC = () => (
  <g>
    <Sketch d={BANDANA} fill={LUCA.bandana} fillOpacity={1} strokeWidth={2.4} seed="bandana" />
    <path
      d="M320 372l6 4M350 372l6 4M335 392l6 4M300 346l6 3M374 346l6 3M338 414l4 5M312 352l5 3M362 356l5 3"
      stroke={LUCA.bandanaPattern}
      strokeWidth={2.2}
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

/** Luca's yellow plush platypus. Origin at the bottom middle of the toy. */
export const Platypus: React.FC<{scale?: number; rotate?: number}> = ({scale = 1, rotate = 0}) => (
  <g transform={`rotate(${rotate}) scale(${scale}) translate(-122 -536)`}>
    <Sketch
      d="M52 520Q56 498 110 498Q156 500 164 516Q156 534 110 536Q60 536 52 520Z"
      fill={LUCA.platypus}
      seed="platypus"
    />
    <Sketch d="M164 512Q186 506 192 516Q186 528 164 526Z" fill={LUCA.platypusBill} seed="platypus-bill" />
    <path d="M60 520Q40 514 34 526Q46 534 60 528" fill={LUCA.platypusBill} stroke="#3A2A20" strokeWidth={2.2} strokeLinejoin="round" />
    <circle cx={150} cy={508} r={3} fill={LUCA.eyes} />
    <Hatch d="M70 504l4 6M90 500l4 6M110 500l4 6M130 502l4 6" />
  </g>
);
