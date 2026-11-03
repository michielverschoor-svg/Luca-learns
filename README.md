# Luca Learns

Animated dog-training episodes, rendered with [Remotion](https://www.remotion.dev) from JSON scene files.

## Quick start

```bash
npm install
npm run render -- ep01        # -> out/ep01.mp4 (1920x1080, h264)
npm run studio                # live preview (Episode + CharacterSheet compositions)
```

Options: `npm run render -- ep01 --frames=0-299` renders part of an episode; `--concurrency=4` sets render threads.
Remotion downloads its own headless Chrome on first render. To use one you already have, set `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome`.

## Layout

| Path | What |
|---|---|
| `episodes/epXX-*.json` | Episode scripts. `npm run render -- ep01` finds `ep01-*.json`. |
| `assets/luca-sketch.svg` | Original character sketch (source for the React character). |
| `audio/<episode>/<sceneId>.mp3` | Optional voiceover. Played if present, otherwise the scene is silent. A clip longer than the scene stretches the scene. |
| `src/character/` | Layered Luca: `BodyParts.tsx` (shadow, tail, haunches, hind paws, torso, chest, front legs and paws, bandana, platypus), `HeadParts.tsx` (ears, skull, eyes and brows, nose and mouth), `expressions.ts`, `pose.ts`, `sketch.tsx` (double pencil line, offset fill, hatching, line boil). |
| `src/episode/cues.ts` | Parses animation strings like `"tail:slow wag"` into cues and times them. |
| `src/scenes/` | Paper, backgrounds (room, kitchen, bathroom, fridge), human legs and hand, story scene, subtitles, tip card. |
| `scripts/render.ts` | The render command. |

## Scene JSON

Story scenes use `expression`, `animation`, `voiceover`, `shot` and `durationSec`. Framing (wide, medium, close-up, low angle), the human's legs, the hand and treat, and the platypus are inferred from the `shot` text. You can set them explicitly with optional fields: `framing` (`wide|medium|close|low`), `location` (`room|kitchen|bathroom|fridge`), `human`, `treat`, `platypus` (booleans).

Expressions: `curious`, `smug`, `betrayed`, `treat-hypnotized`, `guilty`, `sleepy`, `surprised`.

Animation cues (one string each, `target:action`):

| Cue | Example |
|---|---|
| blink | `blink`, `blink:every 3s` |
| tail wag | `tail:slow wag`, `tail:wag`, `tail:fast wag` |
| head tilt | `head:small tilt`, `head:slow tilt`, `head:tilt each cut` |
| head tip back | `head:tip back` |
| jump / slide | `body:jump`, `body:slide down`, `body:slide left` |
| spin, play bow, sit drop | `body:spin`, `body:play-bow`, `body:sit-drop` |
| cheeks puff | `cheeks:puff then deflate` |
| camera push-in | `camera:push-in 10%` |
| extras | `mouth:bark`, `paws:scrabble`, `eyes:track treat`, `tongue:out`, `treat:handoff`, `chew` |
| cuts | `cut:kitchen`, `cut:bathroom`, `cut:fridge` (scene splits into equal parts) |

Body actions (jump, slide, spin, bark, play bow, sit drop, handoff, chew, cheeks puff) play one after another in the listed order. The other cues run across the whole scene. Unknown cues are skipped with a warning.

`"type": "tipCard"` scenes render the clean recap card from `heading` and `steps`.
