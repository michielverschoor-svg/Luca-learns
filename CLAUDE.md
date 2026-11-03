# Luca Learns: animated dog training series

A YouTube series about training Luca, a 5-month-old golden retriever puppy. Each episode follows one training challenge from Luca's point of view. He is confident, dramatic, and convinced he's the one training the human. Every episode ends with a real, usable training tip card.

## Your first task

Build a Remotion project that renders episodes from JSON scene files to 1080p MP4.

1. Set up Remotion (TypeScript) in this folder.
2. Turn `assets/luca-sketch.svg` into a layered React character component. Split it into separate groups: head, ears (left and right), eyes, nose and mouth, body, front legs and paws, hind legs and paws, tail, bandana, shadow. Keep the pencil-sketch look (double outlines, offset fills, hatching).
3. Support these expressions by swapping or animating the face parts: `curious`, `smug`, `betrayed`, `treat-hypnotized`, `guilty`, `sleepy`, `surprised`.
4. Support these animation cues: `blink`, `tail wag`, `head tilt`, `jump`, `spin`, `play-bow`, `sit-drop`, `cheeks puff`, `slide`, `camera push-in`.
5. Read `episodes/ep01-sit.json` and render each scene in order. Draw the scene background as warm paper with simple sketched props (floor line, kitchen, bathroom, fridge).
6. Show the voiceover as subtitles. Render the tip card as a clean final scene.
7. Add voiceover support: if `audio/<episode>/<sceneId>.mp3` exists, play it. Otherwise, render silent. Do not call any paid API unless I ask.
8. One command renders an episode: `npm run render -- ep01`.

## Character: Luca

- Pale cream golden retriever puppy (see the reference photo notes below), oversized paws, soft drop ears, big dark eyes, black nose.
- Signature item: red bandana with a white pattern.
- Signature traits: dramatic sigh, and a head tilt that means he's plotting.
- Favorite toy: a yellow plush platypus.

Palette:

| Part | Hex |
|---|---|
| Coat | #EFD9A8 |
| Haunches | #E4C88C |
| Ears | #DDB46C |
| Muzzle and paws | #F8EBCB |
| Eyes and nose | #2B1B14 |
| Bandana | #C8342B |
| Platypus toy | #D9D66A |
| Paper background | #F6EEDC |
| Pencil lines | #3A2A20 |

## Style rules

- Sketchy pencil look: doubled wobbly outlines, loose fills slightly offset from the lines, light hatching.
- Limited animation is fine: blinking, head tilts, bounces, sliding. Do not attempt fluid hand-drawn motion.
- Humans appear only from the shoulders down (legs and hands).
- Humor comes from Luca's inner monologue. Tone is warm, never mean to the dog.

## Episode structure

1. Cold open (about 20 sec): Luca causes chaos.
2. The problem, with Luca's inner monologue.
3. The training attempt: it half-works or fails.
4. The win, usually for selfish reasons (treats).
5. Tip card (about 25 sec): a clean recap of the real method.

Target 3 to 5 minutes per episode.

## Episode list

1. Sit: Luca negotiates for a better treat (script done: `episodes/ep01-sit.json`)
2. Stay: the longest 10 seconds of his life
3. Come when called: Luca vs. a squirrel
4. Leash walking: who's walking whom?
5. Leave it: the sandwich incident
6. Crate and alone time: Luca's dramatic goodbye
7. Doorbell barking: Luca, security professional
8. Tricks: shake, spin, play dead
9. Meeting other dogs: first day at the park
10. The handsome stranger (mirror): Luca meets his reflection and tries to steal its platypus
11. Season finale: Luca's graduation

## Training-tip accuracy

Tips must be positive-reinforcement based and safe for a young puppy: short sessions, small treats, no punishment, no physical corrections. When writing a tip card, keep it to 5 steps or fewer.

## Reference photo notes (Luca in real life)

Pale cream coat, soft floppy ears slightly darker than his body, black nose, dark round eyes, red bandana with a white pattern, big paws. He loves his yellow plush platypus and once met his own reflection in a wooden mirror on the terrace.
