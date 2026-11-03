"""
Import the episode sound effects from two free CC0 libraries into audio/sfx/.

    git clone --depth 1 https://github.com/wyzowl/sfx-kit.git /tmp/sfx-kit
    git clone --depth 1 https://github.com/facebookincubator/Meta-open-sound.git /tmp/meta-sound
    python scripts/import_sfx.py --kit /tmp/sfx-kit --oculus /tmp/meta-sound

Both libraries are CC0 (public domain): free for commercial use, no credit
required. See audio/sfx/CREDITS.md for which file each effect comes from.
The bubble pop and the dramatic sigh stay synthesized (scripts/make_sfx.py).
Requires ffmpeg.
"""

import argparse
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "sfx"

# name -> (library, file, max seconds or None, peak dBFS, extra ffmpeg filter)
SOURCES = {
    "whoosh": ("oculus", "WHSH_WhooshMedium_OS_01.ogg", None, -3, ""),
    "boing": ("oculus", "TOONBoing_BounceCartoony_OS_01.ogg", None, -3, ""),
    "bark": ("oculus", "ANMLDog_DogBark_OS_01.ogg", None, -3, ""),
    "scrabble": ("oculus", "CLOTHMvmt_ClothingMovement_OS_01.ogg", None, -4, ""),
    "sad-trombone": ("oculus", "MUSCStngr_LossOrchestral_OS_01.ogg", None, -4, ""),
    "rising-sparkle": ("oculus", "UIMisc_BelltreeUp_OS_01.ogg", 2.2, -5, ""),
    "crunch": ("oculus", "PAPRHndl_PaperCrumple_OS_01.ogg", 1.3, -4, ""),
    "snore": ("oculus", "HMNBrth_MaleBreathing_OS_01.ogg", 3.5, -6, "asetrate=44100*0.82,aresample=44100,lowpass=f=1800"),
    "room-tone": ("oculus", "AMBHome_RoomTone_LOOP_01.ogg", 12, -32, ""),
    "thump": ("kit", "impacts/impact-medium-soft.wav", None, -3, ""),
    "plop": ("kit", "impacts/impact-light-soft.wav", None, -3, ""),
    "skid": ("kit", "foley/foley-plastic-slide.wav", None, -4, ""),
    "slide-whistle": ("kit", "notifications/notification-failure-deflate.wav", None, -4, ""),
    "slide-whistle-up": ("kit", "risers-and-fallers/riser-1s-soft.wav", None, -6, ""),
    "squeak": ("kit", "shape-changes/transform-stretch.wav", None, -4, ""),
    "slurp": ("kit", "everyday-props/props-drip.wav", None, -5, ""),
    "pop-cut": ("kit", "swishes-and-zips/swish-medium.wav", None, -4, ""),
    "twinkle": ("kit", "shimmers/shimmer-short-sparkle.wav", None, -5, ""),
    "chime": ("kit", "shimmers/shimmer-medium-bright.wav", None, -5, ""),
    "ding": ("kit", "tones/tone-ding-high.wav", None, -5, ""),
    # Paw footfalls on a wooden floor: soft pad, and a small nail click.
    "paw-pad": ("kit", "impacts/impact-light-soft.wav", None, -8, "highpass=f=180"),
    "paw-click": ("kit", "impacts/impact-light-hard.wav", None, -12, "asetrate=44100*1.25,aresample=44100"),
}


def peak_db(path: Path, filt: str) -> float:
    cmd = ["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"{filt + ',' if filt else ''}volumedetect", "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True).stderr
    m = re.search(r"max_volume: (-?[\d.]+) dB", out)
    return float(m.group(1)) if m else 0.0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kit", required=True, help="path to a clone of wyzowl/sfx-kit")
    parser.add_argument("--oculus", required=True, help="path to a clone of facebookincubator/Meta-open-sound")
    args = parser.parse_args()
    roots = {
        "kit": Path(args.kit) / "sounds",
        "oculus": Path(args.oculus) / "corpora" / "oculus-audio-pack" / "ogg",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (lib, rel, max_sec, target, extra) in SOURCES.items():
        src = roots[lib] / rel
        if not src.exists():
            print(f"  missing {lib}:{rel}")
            continue
        base = extra
        if max_sec:
            fade = f"afade=t=out:st={max_sec - 0.3}:d=0.3"
            base = f"{base},atrim=0:{max_sec},{fade}" if base else f"atrim=0:{max_sec},{fade}"
        gain = target - peak_db(src, base)
        filt = f"{base + ',' if base else ''}volume={gain:.2f}dB"
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-af", filt, "-ar", "44100", "-b:a", "160k", str(OUT / f"{name}.mp3")],
            check=True,
        )
        print(f"  {name:18s} <- {lib}:{rel}")


if __name__ == "__main__":
    main()
