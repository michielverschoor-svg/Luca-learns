import React from 'react';
import {Hatch, Sketch, wobbleLine, wobbleRect} from '../character/sketch';
import type {Location} from '../types';

/* Everything here is drawn in stage coordinates (1920 x 1080). */

export const GROUND_Y = 880;
const WALL_FLOOR_Y = 760;

const C = {
  wood: '#E3CFA6',
  woodDark: '#D4BB8C',
  counter: '#CDB89A',
  steel: '#DAD5C8',
  glass: '#C9C2B0',
  tile: '#DCE7E2',
  tileLine: '#9FB3AC',
  porcelain: '#FBF8F0',
  curtain: '#E9C3A8',
  mat: '#BFD3DA',
  fridge: '#EEEBE2',
  note: '#F3E58E',
  wall: '#EFE3C8',
};

const Floor: React.FC = () => (
  <g>
    <path d={`M-100 ${WALL_FLOOR_Y}L2020 ${WALL_FLOOR_Y}L2020 1200L-100 1200Z`} fill="#EBDDBE" opacity={0.6} />
    <Sketch d={wobbleLine(-60, WALL_FLOOR_Y, 1980, WALL_FLOOR_Y + 4, 'wallfloor', 5)} seed="wallfloor" />
    <Sketch d={wobbleLine(-60, WALL_FLOOR_Y - 26, 1980, WALL_FLOOR_Y - 24, 'baseboard', 4)} strokeWidth={1.8} seed="baseboard" />
    <Hatch
      d={[0, 1, 2, 3, 4, 5, 6, 7, 8]
        .map((i) => {
          const x = -100 + i * 260;
          return wobbleLine(x + 60, WALL_FLOOR_Y + 8, x - 140 + (i - 4) * 40, 1100, `board${i}`, 4);
        })
        .join('')}
      opacity={0.35}
    />
    <Hatch
      d={[0, 1, 2, 3, 4, 5].map((i) => wobbleLine(120 + i * 300, 990 + (i % 2) * 30, 260 + i * 300, 990 + (i % 2) * 30, `fh${i}`, 2)).join('')}
      opacity={0.3}
    />
  </g>
);

const Room: React.FC = () => (
  <g>
    {/* window */}
    <Sketch d={wobbleRect(1290, 130, 380, 400, 'win')} fill="#F3EBDA" seed="win" />
    <Sketch d={`${wobbleLine(1480, 134, 1482, 528, 'win-v')}${wobbleLine(1294, 330, 1666, 332, 'win-h')}`} strokeWidth={2} seed="win-bars" />
    <Hatch d="M1320 170l40 -30M1320 210l80 -60M1520 170l40 -30M1520 210l80 -60M1320 380l40 -30M1520 380l40 -30" opacity={0.4} />
    <Sketch d={wobbleLine(1270, 540, 1690, 540, 'sill', 2)} strokeWidth={3} seed="sill" />
    {/* picture frame */}
    <Sketch d={wobbleRect(300, 210, 220, 170, 'frame')} fill="#E8D8B6" seed="frame" />
    <Sketch d="M340 350Q380 270 420 330Q450 290 480 350" strokeWidth={2} seed="frame-art" />
    <circle cx={460} cy={260} r={14} fill="#E9C46A" opacity={0.8} />
    <Floor />
  </g>
);

const Kitchen: React.FC = () => {
  const doors = [-40, 250, 1180, 1470, 1760];
  return (
    <g>
      {/* backsplash */}
      <Hatch
        d={[0, 1, 2, 3].map((r) => wobbleLine(-40, 40 + r * 44, 1960, 40 + r * 44, `bs${r}`, 2)).join('')}
        color="#B9A27A"
        opacity={0.45}
      />
      {/* counter */}
      <Sketch d={wobbleRect(-60, 196, 2040, 34, 'counter', 2)} fill={C.counter} seed="counter" />
      {/* cabinet body */}
      <Sketch d={wobbleRect(-60, 230, 2040, WALL_FLOOR_Y - 230 - 24, 'cab', 3)} fill={C.wood} seed="cab" />
      {doors.map((x, i) => (
        <g key={x}>
          <Sketch d={wobbleRect(x + 16, 250, 258, 100, `drawer${i}`)} strokeWidth={2} seed={`drawer${i}`} />
          <Sketch d={wobbleRect(x + 16, 370, 258, 330, `door${i}`)} strokeWidth={2} seed={`door${i}`} />
          <Sketch d={wobbleLine(x + 115, 300, x + 175, 300, `dh${i}`, 1)} strokeWidth={4} seed={`dh${i}`} />
          <Sketch d={wobbleLine(x + 240, 500, x + 240, 570, `kh${i}`, 1)} strokeWidth={4} seed={`kh${i}`} />
          <Hatch d={`M${x + 40} 400l30 30M${x + 40} 440l50 50M${x + 40} 480l30 30`} opacity={0.35} />
        </g>
      ))}
      {/* oven */}
      <Sketch d={wobbleRect(560, 240, 580, 470, 'oven', 3)} fill={C.steel} seed="oven" />
      {[620, 760, 900, 1040].map((x, i) => (
        <circle key={x} cx={x + 20} cy={275} r={13} fill="#BDB6A6" stroke="#3A2A20" strokeWidth={2} />
      ))}
      <Sketch d={wobbleLine(620, 330, 1080, 330, 'oven-bar', 1)} strokeWidth={6} seed="oven-bar" />
      <Sketch d={wobbleRect(620, 370, 460, 290, 'oven-win', 3)} fill={C.glass} seed="oven-win" />
      <Hatch d="M650 420l60 -40M650 480l140 -100M900 640l160 -110M980 640l90 -60" color="#F6EEDC" opacity={0.7} width={3} />
      {/* tea towel */}
      <Sketch
        d="M700 330L700 470Q712 480 724 468L740 476Q752 466 760 470L760 330"
        fillD="M700 330L700 470Q712 480 724 468L740 476Q752 466 760 470L760 330Z"
        fill="#C8342B"
        fillOpacity={0.55}
        seed="towel"
      />
      <Hatch d="M700 360L760 360M700 380L760 380M700 430L760 430" color="#F6EEDC" opacity={0.9} width={2} />
      <Floor />
    </g>
  );
};

const Bathroom: React.FC = () => (
  <g>
    {/* tiles */}
    <path d="M-100 -100L2020 -100L2020 440L-100 440Z" fill={C.tile} opacity={0.6} />
    <Hatch
      d={[
        ...[0, 1, 2, 3, 4, 5].map((r) => wobbleLine(-80, -20 + r * 80, 2000, -20 + r * 80, `th${r}`, 2)),
        ...new Array(25).fill(0).map((_, c) => wobbleLine(-60 + c * 85, -100, -60 + c * 85, 440, `tv${c}`, 2)),
      ].join('')}
      color={C.tileLine}
      opacity={0.55}
    />
    <Sketch d={wobbleLine(-60, 440, 1980, 442, 'wainscot', 3)} strokeWidth={3} seed="wainscot" />
    {/* toilet */}
    <Sketch d={wobbleRect(250, 330, 230, 200, 'tank', 3)} fill={C.porcelain} seed="tank" />
    <Sketch d="M220 560Q220 530 270 530L460 530Q510 530 510 560Q505 640 420 680L420 750L300 750L300 680Q225 640 220 560Z" fill={C.porcelain} seed="bowl" />
    <Sketch d={wobbleLine(230, 562, 500, 562, 'seat', 2)} strokeWidth={2} seed="seat" />
    <Sketch d={wobbleLine(420, 370, 460, 370, 'flush', 1)} strokeWidth={5} seed="flush" />
    {/* tub */}
    <Sketch d="M1130 470Q1130 440 1170 440L1930 440L1930 740L1230 740Q1140 740 1132 640Z" fill={C.porcelain} seed="tub" />
    <Sketch d={wobbleLine(1140, 486, 1930, 486, 'tub-rim', 2)} strokeWidth={2} seed="tub-rim" />
    <Hatch d="M1180 560q10 40 40 80M1220 520q8 40 40 100" opacity={0.4} />
    <Sketch d="M1230 740l-10 26M1880 740l10 26" strokeWidth={5} seed="tub-feet" />
    {/* shower curtain */}
    <Sketch d={wobbleLine(1120, 40, 1960, 40, 'rod', 1)} strokeWidth={5} seed="rod" />
    <Sketch
      d="M1150 46Q1180 200 1170 420Q1200 430 1230 420Q1260 432 1290 420Q1300 250 1330 46"
      fillD="M1150 46Q1180 200 1170 420Q1200 430 1230 420Q1260 432 1290 420Q1300 250 1330 46Z"
      fill={C.curtain}
      detail="M1200 60Q1210 240 1200 420M1250 60Q1250 240 1260 420"
      seed="curtain"
    />
    <Floor />
    {/* bath mat */}
    <Sketch d="M560 850Q560 820 600 820L1000 820Q1040 820 1040 850L1040 900Q1040 930 1000 930L600 930Q560 930 560 900Z" fill={C.mat} seed="mat" />
    <Hatch d="M600 840l0 80M640 840l0 80M680 840l0 80M720 840l0 80M760 840l0 80M800 840l0 80M840 840l0 80M880 840l0 80M920 840l0 80M960 840l0 80M1000 840l0 80" color="#7E9AA4" opacity={0.4} />
  </g>
);

const Fridge: React.FC = () => (
  <g>
    {/* a bit of counter on the left */}
    <Sketch d={wobbleRect(-60, 300, 860, 30, 'f-counter', 2)} fill={C.counter} seed="f-counter" />
    <Sketch d={wobbleRect(-60, 330, 860, WALL_FLOOR_Y - 330 - 24, 'f-cab', 3)} fill={C.wood} seed="f-cab" />
    <Sketch d={wobbleRect(-20, 360, 360, 340, 'f-door1')} strokeWidth={2} seed="f-door1" />
    <Sketch d={wobbleRect(380, 360, 380, 340, 'f-door2')} strokeWidth={2} seed="f-door2" />
    <Sketch d="M300 500L300 570M420 500L420 570" strokeWidth={4} seed="f-handles" />
    {/* fridge */}
    <Sketch d="M1100 -60L1700 -60L1700 770L1100 770Z" fill={C.fridge} seed="fridge" />
    <Sketch d={wobbleLine(1100, 300, 1700, 302, 'fridge-split', 2)} seed="fridge-split" />
    <Sketch d="M1140 140Q1136 200 1140 260M1140 340Q1136 460 1140 580" strokeWidth={8} seed="fridge-handles" />
    <Hatch d="M1640 -40l40 40M1600 -40l80 80M1640 340l40 40M1600 340l80 80M1620 650l60 60" opacity={0.35} />
    <Sketch d="M1110 770l0 14M1690 770l0 14" strokeWidth={5} seed="fridge-feet" />
    {/* kid drawing of a dog, held by a magnet */}
    <g transform="rotate(-4 1420 450)">
      <Sketch d={wobbleRect(1330, 360, 190, 170, 'drawing')} fill="#FFFDF5" fillOpacity={1} strokeWidth={2} seed="drawing" />
      <path d="M1370 480Q1380 430 1430 440Q1470 430 1480 480M1390 480l0 30M1460 480l0 30M1410 420q-10 -20 10 -24q20 0 14 22" fill="none" stroke="#C8342B" strokeWidth={3} strokeLinecap="round" />
      <circle cx={1425} cy={364} r={11} fill="#5E8FB8" stroke="#3A2A20" strokeWidth={2} />
    </g>
    {/* sticky note */}
    <g transform="rotate(5 1250 180)">
      <Sketch d={wobbleRect(1190, 120, 130, 120, 'note')} fill={C.note} fillOpacity={1} strokeWidth={2} seed="note" />
      <Hatch d="M1206 160L1300 160M1206 185L1290 185M1206 210L1270 210" color="#3A2A20" opacity={0.5} width={2} />
    </g>
    <circle cx={1580} cy={420} r={13} fill="#D9D66A" stroke="#3A2A20" strokeWidth={2} />
    <circle cx={1220} cy={620} r={12} fill="#C8342B" stroke="#3A2A20" strokeWidth={2} />
    <Floor />
  </g>
);

export const Background: React.FC<{location: Location}> = ({location}) => {
  switch (location) {
    case 'kitchen':
      return <Kitchen />;
    case 'bathroom':
      return <Bathroom />;
    case 'fridge':
      return <Fridge />;
    default:
      return <Room />;
  }
};
