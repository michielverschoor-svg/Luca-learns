"""
Generate free voiceover clips for an episode with Kokoro TTS (Apache-2.0, runs
offline, no API key, no cost).

    python scripts/voiceover.py ep01 --models /path/to/kokoro-models
    python scripts/voiceover.py ep01 --voice am_michael --force

Writes audio/<episode>/<sceneId>.mp3 for every scene that has a voiceover line.
Existing clips are kept unless --force is given, so a hand-recorded clip is
never overwritten by accident.

Setup (once):
    python3 -m venv .venv-tts && .venv-tts/bin/pip install kokoro-onnx soundfile
    Download kokoro-v1.0.fp16.onnx and voices-v1.0.bin from
    https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    into a folder and pass it with --models (or set KOKORO_MODELS).
Requires ffmpeg on PATH for the mp3 encode.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def find_episode(episode_id: str) -> Path:
    folder = ROOT / "episodes"
    files = sorted(folder.glob("*.json"))
    for f in files:
        if f.stem == episode_id:
            return f
    for f in files:
        if f.stem.startswith(episode_id + "-"):
            return f
    sys.exit(f"No episode file for '{episode_id}' in episodes/")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("episode")
    parser.add_argument("--models", default=os.environ.get("KOKORO_MODELS", "kokoro-models"))
    parser.add_argument("--voice", default="am_puck", help="Kokoro voice id (am_puck, am_michael, am_fenrir, bm_fable...)")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--force", action="store_true", help="overwrite existing clips")
    args = parser.parse_args()

    import soundfile as sf
    from kokoro_onnx import Kokoro

    models = Path(args.models)
    onnx = next((models / n for n in ("kokoro-v1.0.onnx", "kokoro-v1.0.fp16.onnx", "kokoro-v1.0.int8.onnx") if (models / n).exists()), None)
    if onnx is None or not (models / "voices-v1.0.bin").exists():
        sys.exit(f"Kokoro model files not found in {models}. See the setup notes at the top of this script.")
    kokoro = Kokoro(str(onnx), str(models / "voices-v1.0.bin"))

    episode = json.loads(find_episode(args.episode).read_text())
    out_dir = ROOT / "audio" / episode["id"]
    out_dir.mkdir(parents=True, exist_ok=True)

    for scene in episode["scenes"]:
        line = scene.get("voiceover")
        if not line:
            continue
        target = out_dir / f"{scene['id']}.mp3"
        if target.exists() and not args.force:
            print(f"  keep   {target.relative_to(ROOT)}")
            continue
        samples, rate = kokoro.create(line, voice=args.voice, speed=args.speed, lang="en-us")
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "line.wav"
            sf.write(wav, samples, rate)
            # Short lead-in so the line starts after the subtitle fades in.
            subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav),
                 "-af", "adelay=300:all=1,loudnorm=I=-16:TP=-1.5",
                 "-ar", "44100", "-b:a", "160k", str(target)],
                check=True,
            )
        print(f"  wrote  {target.relative_to(ROOT)}  ({len(samples) / rate:.1f}s)  \"{line}\"")


if __name__ == "__main__":
    main()
