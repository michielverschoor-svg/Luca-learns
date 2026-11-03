import React from 'react';
import {Hatch, Sketch, wobbleLine, wobbleRect} from '../character/sketch';
import type {Location} from '../types';

/* Everything here is drawn in stage coordinates (1920 x 1080). */

export const GROUND_Y = 880;
const WALL_FLOOR_Y = 760;

/** Bright, cheerful set colours. Luca's own palette stays as in CLAUDE.md. */
const C = {
  sun: '#FFD23F',
  coral: '#FF7A59',
  pink: '#FF8FB1',
  sky: '#8FD3F4',
  skyLight: '#C8ECFF',
  mint: '#7ED6A5',
  mintLight: '#BDF0D2',
  teal: '#5CC8C0',
  lilac: '#B79CF2',
  white: '#FFFDF7',
  orange: '#FFAE57',
  red: '#F25555',
  steel: '#E9EEF2',
};

const Wall: React.FC<{color: string}> = ({color}) => (
  <path d={`M-200 -200L2120 -200L2120 ${WALL_FLOOR_Y}L-200 ${WALL_FLOOR_Y}Z`} fill={color} />
);

const Floor: React.FC<{color: string; lines: string; checker?: string}> = ({color, lines, checker}) => (
  <g>
    <path d={`M-200 ${WALL_FLOOR_Y}L2120 ${WALL_FLOOR_Y}L2120 1300L-200 1300Z`} fill={color} />
    {checker ? (
      <g>
        {new Array(14).fill(0).flatMap((_, c) =>
          new Array(4).fill(0).map((__, r) =>
            (c + r) % 2 === 0 ? (
              <path
                key={`${c}-${r}`}
                d={`M${-120 + c * 160} ${WALL_FLOOR_Y + r * 90}l160 0l${(c - 6) * 12} 90l-160 0Z`}
                fill={checker}
              />
            ) : null,
          ),
        )}
      </g>
    ) : null}
    <Hatch
      d={[0, 1, 2, 3, 4, 5, 6, 7, 8]
        .map((i) => {
          const x = -100 + i * 260;
          return wobbleLine(x + 60, WALL_FLOOR_Y + 8, x - 140 + (i - 4) * 40, 1100, `board${i}`, 4);
        })
        .join('')}
      color={lines}
      opacity={checker ? 0 : 0.55}
      width={3}
    />
    <Sketch d={wobbleLine(-60, WALL_FLOOR_Y - 30, 1980, WALL_FLOOR_Y - 28, 'baseboard', 4)} strokeWidth={1.8} seed="baseboard" />
    <path d={`M-200 ${WALL_FLOOR_Y - 29}L2120 ${WALL_FLOOR_Y - 27}L2120 ${WALL_FLOOR_Y}L-200 ${WALL_FLOOR_Y}Z`} fill={C.white} opacity={0.8} />
    <Sketch d={wobbleLine(-60, WALL_FLOOR_Y, 1980, WALL_FLOOR_Y + 4, 'wallfloor', 5)} seed="wallfloor" />
  </g>
);

/** Little polka dots for walls. */
const Dots: React.FC<{color: string; y0?: number; y1?: number}> = ({color, y0 = 40, y1 = 700}) => (
  <g opacity={0.35}>
    {new Array(12).fill(0).flatMap((_, c) =>
      new Array(Math.ceil((y1 - y0) / 110)).fill(0).map((__, r) => (
        <circle key={`${c}-${r}`} cx={40 + c * 170 + (r % 2) * 85} cy={y0 + r * 110} r={9} fill={color} />
      )),
    )}
  </g>
);

const Room: React.FC = () => (
  <g>
    <Wall color={C.mintLight} />
    <Dots color={C.white} />
    {/* window with sky, sun and a cloud */}
    <Sketch d={wobbleRect(1290, 130, 380, 400, 'win')} fill={C.skyLight} fillOpacity={1} seed="win" />
    <circle cx={1580} cy={220} r={46} fill={C.sun} stroke="#3A2A20" strokeWidth={4} />
    <Sketch d="M1340 300q10 -30 40 -20q16 -26 46 -8q30 -6 34 22q20 6 10 26l-126 0q-20 -6 -4 -20Z" fill={C.white} fillOpacity={1} seed="cloud" />
    <Sketch d={`${wobbleLine(1480, 134, 1482, 528, 'win-v')}${wobbleLine(1294, 330, 1666, 332, 'win-h')}`} strokeWidth={2.4} seed="win-bars" />
    {/* curtains */}
    <Sketch d="M1250 110Q1290 300 1260 560L1320 560Q1300 300 1330 110Z" fill={C.pink} fillOpacity={1} seed="curtain-l" />
    <Sketch d="M1710 110Q1670 300 1700 560L1640 560Q1660 300 1630 110Z" fill={C.pink} fillOpacity={1} seed="curtain-r" />
    <Sketch d={wobbleLine(1220, 108, 1740, 108, 'rod', 1)} strokeWidth={3.4} seed="rod" />
    <Sketch d={wobbleLine(1270, 540, 1690, 540, 'sill', 2)} strokeWidth={3.4} seed="sill" />
    {/* picture frame with a happy bone */}
    <g transform="rotate(-3 410 300)">
      <Sketch d={wobbleRect(300, 210, 220, 170, 'frame')} fill={C.sun} fillOpacity={1} seed="frame" />
      <Sketch d={wobbleRect(322, 230, 176, 130, 'frame-in')} fill={C.white} fillOpacity={1} strokeWidth={1.8} seed="frame-in" />
      <path d="M350 330Q380 260 410 310Q440 270 470 330Z" fill={C.mint} stroke="#3A2A20" strokeWidth={3} />
      <circle cx={455} cy={262} r={14} fill={C.coral} stroke="#3A2A20" strokeWidth={3} />
    </g>
    {/* bunting */}
    <Sketch d="M-40 40Q300 110 640 40Q980 110 1240 50" strokeWidth={1.6} seed="bunting" />
    {[C.coral, C.sun, C.sky, C.pink, C.mint, C.lilac, C.coral, C.sun, C.sky, C.pink].map((col, i) => {
      const x = 20 + i * 122;
      const y = i < 5 ? 40 + 70 * Math.sin((Math.PI * (x + 40)) / 680) : 40 + 70 * Math.sin((Math.PI * (x - 640)) / 600);
      return <Sketch key={i} d={`M${x - 24} ${y}L${x + 24} ${y}L${x} ${y + 50}Z`} fill={col} fillOpacity={1} strokeWidth={1.6} seed={`flag${i}`} />;
    })}
    <Floor color={C.orange} lines="#D9772A" />
  </g>
);

const Kitchen: React.FC = () => {
  const doors = [-40, 250, 1180, 1470, 1760];
  const handle = [C.coral, C.sun, C.coral, C.sun, C.coral];
  return (
    <g>
      <Wall color="#FFF1B8" />
      {/* backsplash tiles */}
      <Hatch
        d={[0, 1, 2, 3].map((r) => wobbleLine(-40, 40 + r * 44, 1960, 40 + r * 44, `bs${r}`, 2)).join('')}
        color={C.coral}
        opacity={0.6}
        width={3}
      />
      <Sketch d={wobbleRect(-60, 196, 2040, 34, 'counter', 2)} fill={C.sun} fillOpacity={1} seed="counter" />
      <Sketch d={wobbleRect(-60, 230, 2040, WALL_FLOOR_Y - 230 - 30, 'cab', 3)} fill={C.sky} fillOpacity={1} seed="cab" />
      {doors.map((x, i) => (
        <g key={x}>
          <Sketch d={wobbleRect(x + 16, 250, 258, 100, `drawer${i}`)} strokeWidth={2} seed={`drawer${i}`} />
          <Sketch d={wobbleRect(x + 16, 370, 258, 330, `door${i}`)} strokeWidth={2} seed={`door${i}`} />
          <circle cx={x + 145} cy={300} r={13} fill={handle[i]} stroke="#3A2A20" strokeWidth={3.5} />
          <circle cx={x + 240} cy={530} r={13} fill={handle[i]} stroke="#3A2A20" strokeWidth={3.5} />
          <Hatch d={`M${x + 40} 400l30 30M${x + 40} 440l50 50M${x + 40} 480l30 30`} color={C.white} opacity={0.6} width={3} />
        </g>
      ))}
      {/* oven */}
      <Sketch d={wobbleRect(560, 240, 580, 470, 'oven', 3)} fill={C.white} fillOpacity={1} seed="oven" />
      {[620, 760, 900, 1040].map((x) => (
        <circle key={x} cx={x + 20} cy={275} r={14} fill={C.red} stroke="#3A2A20" strokeWidth={3.5} />
      ))}
      <Sketch d={wobbleLine(620, 330, 1080, 330, 'oven-bar', 1)} strokeWidth={6} seed="oven-bar" />
      <Sketch d={wobbleRect(620, 370, 460, 290, 'oven-win', 3)} fill="#3B3B58" fillOpacity={1} seed="oven-win" />
      <Hatch d="M650 420l60 -40M650 480l140 -100M900 640l160 -110M980 640l90 -60" color={C.white} opacity={0.6} width={4} />
      {/* striped tea towel */}
      <Sketch
        d="M700 330L700 470Q712 480 724 468L740 476Q752 466 760 470L760 330"
        fillD="M700 330L700 470Q712 480 724 468L740 476Q752 466 760 470L760 330Z"
        fill={C.pink}
        fillOpacity={1}
        seed="towel"
      />
      <Hatch d="M700 360L760 360M700 390L760 390M700 430L760 430" color={C.white} opacity={1} width={6} />
      {/* fruit bowl on the counter */}
      <circle cx={1360} cy={170} r={26} fill={C.red} stroke="#3A2A20" strokeWidth={3.5} />
      <circle cx={1404} cy={176} r={22} fill={C.sun} stroke="#3A2A20" strokeWidth={3.5} />
      <Sketch d="M1310 180Q1380 250 1450 180Z" fill={C.teal} fillOpacity={1} seed="bowl" />
      <Floor color="#FFE3D6" lines="#E0A080" checker="#FFB8A0" />
    </g>
  );
};

const Bathroom: React.FC = () => (
  <g>
    <Wall color={C.sky} />
    <Hatch
      d={[
        ...[0, 1, 2, 3, 4, 5].map((r) => wobbleLine(-80, -20 + r * 80, 2000, -20 + r * 80, `th${r}`, 2)),
        ...new Array(25).fill(0).map((_, c) => wobbleLine(-60 + c * 85, -100, -60 + c * 85, 440, `tv${c}`, 2)),
      ].join('')}
      color={C.white}
      opacity={0.8}
      width={3}
    />
    <path d={`M-200 440L2120 440L2120 ${WALL_FLOOR_Y}L-200 ${WALL_FLOOR_Y}Z`} fill={C.mintLight} />
    <Sketch d={wobbleLine(-60, 440, 1980, 442, 'wainscot', 3)} strokeWidth={3} seed="wainscot" />
    {/* rubber duck shelf */}
    <Sketch d={wobbleLine(620, 300, 900, 300, 'shelf', 1)} strokeWidth={5} seed="shelf" />
    <g transform="translate(700 262)">
      <Sketch d="M-30 0Q-34 -30 -6 -30Q4 -52 22 -40Q34 -32 26 -20L40 -18Q30 -6 22 -8Q24 10 -2 10Q-26 10 -30 0Z" fill={C.sun} fillOpacity={1} seed="duck" />
      <circle cx={16} cy={-34} r={3.5} fill="#3A2A20" />
    </g>
    {/* toilet */}
    <Sketch d={wobbleRect(250, 330, 230, 200, 'tank', 3)} fill={C.white} fillOpacity={1} seed="tank" />
    <Sketch d="M220 560Q220 530 270 530L460 530Q510 530 510 560Q505 640 420 680L420 750L300 750L300 680Q225 640 220 560Z" fill={C.white} fillOpacity={1} seed="bowl" />
    <Sketch d={wobbleLine(230, 562, 500, 562, 'seat', 2)} strokeWidth={2} seed="seat" />
    <Sketch d={wobbleLine(420, 370, 460, 370, 'flush', 1)} strokeWidth={5} seed="flush" />
    {/* tub */}
    <Sketch d="M1130 470Q1130 440 1170 440L1930 440L1930 740L1230 740Q1140 740 1132 640Z" fill={C.white} fillOpacity={1} seed="tub" />
    <Sketch d={wobbleLine(1140, 486, 1930, 486, 'tub-rim', 2)} strokeWidth={2} seed="tub-rim" />
    {[0, 1, 2, 3, 4].map((i) => (
      <circle key={i} cx={1300 + i * 110} cy={400 - (i % 2) * 40} r={16 + (i % 3) * 6} fill={C.white} stroke="#3A2A20" strokeWidth={3} opacity={0.9} />
    ))}
    <Sketch d="M1230 740l-10 26M1880 740l10 26" strokeWidth={5} seed="tub-feet" />
    {/* shower curtain, yellow with dots */}
    <Sketch d={wobbleLine(1120, 40, 1960, 40, 'rod', 1)} strokeWidth={5} seed="rod" />
    <Sketch
      d="M1150 46Q1180 200 1170 420Q1200 430 1230 420Q1260 432 1290 420Q1300 250 1330 46"
      fillD="M1150 46Q1180 200 1170 420Q1200 430 1230 420Q1260 432 1290 420Q1300 250 1330 46Z"
      fill={C.sun}
      fillOpacity={1}
      detail="M1200 60Q1210 240 1200 420M1250 60Q1250 240 1260 420"
      seed="curtain"
    />
    {[[1190, 120], [1270, 160], [1210, 250], [1280, 320], [1200, 370]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={10} fill={C.coral} />
    ))}
    <Floor color={C.lilac} lines="#8D6FD6" />
    {/* bath mat */}
    <Sketch d="M560 850Q560 820 600 820L1000 820Q1040 820 1040 850L1040 900Q1040 930 1000 930L600 930Q560 930 560 900Z" fill={C.pink} fillOpacity={1} seed="mat" />
    <Hatch d="M600 840l0 80M640 840l0 80M680 840l0 80M720 840l0 80M760 840l0 80M800 840l0 80M840 840l0 80M880 840l0 80M920 840l0 80M960 840l0 80M1000 840l0 80" color={C.white} opacity={0.7} width={4} />
  </g>
);

const Fridge: React.FC = () => (
  <g>
    <Wall color="#FFD1DC" />
    <Dots color={C.white} />
    <Sketch d={wobbleRect(-60, 300, 860, 30, 'f-counter', 2)} fill={C.sun} fillOpacity={1} seed="f-counter" />
    <Sketch d={wobbleRect(-60, 330, 860, WALL_FLOOR_Y - 330 - 30, 'f-cab', 3)} fill={C.teal} fillOpacity={1} seed="f-cab" />
    <Sketch d={wobbleRect(-20, 360, 360, 340, 'f-door1')} strokeWidth={2} seed="f-door1" />
    <Sketch d={wobbleRect(380, 360, 380, 340, 'f-door2')} strokeWidth={2} seed="f-door2" />
    <circle cx={300} cy={530} r={13} fill={C.coral} stroke="#3A2A20" strokeWidth={3.5} />
    <circle cx={420} cy={530} r={13} fill={C.coral} stroke="#3A2A20" strokeWidth={3.5} />
    {/* retro mint fridge */}
    <Sketch d="M1100 -60L1700 -60L1700 770L1100 770Z" fill={C.mint} fillOpacity={1} seed="fridge" />
    <Sketch d={wobbleLine(1100, 300, 1700, 302, 'fridge-split', 2)} seed="fridge-split" />
    <Sketch d="M1140 140Q1136 200 1140 260M1140 340Q1136 460 1140 580" strokeWidth={9} seed="fridge-handles" />
    <Hatch d="M1640 -40l40 40M1600 -40l80 80M1640 340l40 40M1600 340l80 80M1620 650l60 60" color={C.white} opacity={0.6} width={4} />
    <Sketch d="M1110 770l0 14M1690 770l0 14" strokeWidth={5} seed="fridge-feet" />
    <g transform="rotate(-4 1420 450)">
      <Sketch d={wobbleRect(1330, 360, 190, 170, 'drawing')} fill={C.white} fillOpacity={1} strokeWidth={2} seed="drawing" />
      <path d="M1370 480Q1380 430 1430 440Q1470 430 1480 480M1390 480l0 30M1460 480l0 30M1410 420q-10 -20 10 -24q20 0 14 22" fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" />
      <path d="M1350 520l160 0" stroke={C.mint} strokeWidth={6} strokeLinecap="round" />
      <circle cx={1350} cy={390} r={18} fill={C.sun} />
      <circle cx={1425} cy={364} r={13} fill={C.sky} stroke="#3A2A20" strokeWidth={3} />
    </g>
    <g transform="rotate(5 1250 180)">
      <Sketch d={wobbleRect(1190, 120, 130, 120, 'note')} fill={C.sun} fillOpacity={1} strokeWidth={2} seed="note" />
      <Hatch d="M1206 160L1300 160M1206 185L1290 185M1206 210L1270 210" color="#3A2A20" opacity={0.5} width={3} />
    </g>
    <circle cx={1580} cy={420} r={15} fill={C.lilac} stroke="#3A2A20" strokeWidth={3} />
    <circle cx={1220} cy={620} r={14} fill={C.red} stroke="#3A2A20" strokeWidth={3} />
    <circle cx={1620} cy={180} r={14} fill={C.orange} stroke="#3A2A20" strokeWidth={3} />
    <Floor color="#FFE3D6" lines="#E0A080" checker="#FFC9B8" />
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
