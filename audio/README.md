# Audio

## Voiceover: `audio/<episode>/<sceneId>.mp3`

Played during that scene when present; scenes without a clip are silent with
subtitles. A clip longer than `durationSec` stretches the scene.

The ep01 clips were generated for free with Kokoro TTS (Apache-2.0, runs
offline, no API key) using `scripts/voiceover.py`:

```bash
python3 -m venv .venv-tts && .venv-tts/bin/pip install kokoro-onnx soundfile
# download kokoro-v1.0.fp16.onnx and voices-v1.0.bin from
# https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 into kokoro-models/
.venv-tts/bin/python scripts/voiceover.py ep01 --models kokoro-models            # keeps existing clips
.venv-tts/bin/python scripts/voiceover.py ep01 --voice am_michael --force         # try another voice
```

To use your own recording instead, replace the mp3 with the same name.

## Sound effects: `audio/sfx/<name>.mp3`

Taken from two free CC0 libraries (Meta Open Sound and SFX Kit) by
`scripts/import_sfx.py`; see `audio/sfx/CREDITS.md`. The bubble pop and the
sigh are synthesized by `scripts/make_sfx.py`. Scene `sfx` names are matched loosely
("sad trombone (short)" -> `sad-trombone.mp3`, "pop cut x3" -> `pop-cut.mp3`)
and timed to the matching action (thump with the jump, bark on each bark,
pop on each cut, plop on the sit-drop...). Room tone loops quietly under the
scene. Drop in your own mp3 with the same name to replace any effect.

No paid API is called by this project.
