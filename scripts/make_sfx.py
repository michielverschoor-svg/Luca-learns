"""
Synthesize the cartoon sound effects into audio/sfx/<name>.mp3.

Everything is generated from code (oscillators, filtered noise), so the sounds
are ours to use anywhere with no licence to track. Requires numpy and ffmpeg.

    python scripts/make_sfx.py

Scene JSON refers to effects by name, e.g. "sfx": ["thump", "bark"]. Names are
matched loosely: "sad trombone (short)" -> sad-trombone, "pop cut x3" -> pop-cut.
To use a different sound, drop your own mp3 with the same name into audio/sfx/.
"""

import math
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "audio" / "sfx"
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, attack, release, shape=2.0):
    """Attack/decay envelope over n samples (attack, release in seconds)."""
    e = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n - a, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[n - r:] = np.linspace(1, 0, r) ** shape
    return e


def biquad(x, kind, freq, q=0.707):
    """RBJ biquad. freq may be a scalar or a per-sample array (for sweeps)."""
    freq = np.broadcast_to(np.asarray(freq, dtype=float), x.shape)
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    last = None
    for i in range(len(x)):
        f = freq[i]
        if f != last:
            w = 2 * math.pi * min(f, SR * 0.45) / SR
            cw, sw = math.cos(w), math.sin(w)
            alpha = sw / (2 * q)
            if kind == "lp":
                b0, b1, b2 = (1 - cw) / 2, 1 - cw, (1 - cw) / 2
            elif kind == "hp":
                b0, b1, b2 = (1 + cw) / 2, -(1 + cw), (1 + cw) / 2
            else:  # band-pass
                b0, b1, b2 = alpha, 0.0, -alpha
            a0, a1, a2 = 1 + alpha, -2 * cw, 1 - alpha
            b0, b1, b2, a1, a2 = b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0
            last = f
        xi = x[i]
        yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi
        y[i] = yi
    return y


def sweep_sine(f0, f1, sec, curve=1.0):
    n = int(sec * SR)
    f = f0 + (f1 - f0) * np.linspace(0, 1, n) ** curve
    return np.sin(2 * math.pi * np.cumsum(f) / SR)


def saw(freq, n):
    phase = np.cumsum(np.broadcast_to(freq, (n,))) / SR
    return 2 * (phase % 1) - 1


def noise(sec):
    return rng.uniform(-1, 1, int(sec * SR))


def pad(x, sec):
    return np.concatenate([x, np.zeros(int(sec * SR))])


# ---------------------------------------------------------------- effects

def room_tone():
    n = noise(8)
    x = biquad(n, "lp", 400) * 0.6 + biquad(n, "bp", 120, 0.5) * 0.4
    fade = int(0.5 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x * 0.06


def dramatic_sigh():
    sec = 1.8
    n = noise(sec)
    center = np.linspace(1400, 380, len(n))
    x = biquad(n, "bp", center, 1.4) + 0.3 * biquad(n, "bp", center * 2.2, 2)
    # a little voiced "hhhaa" underneath
    voice = saw(np.linspace(180, 120, len(n)), len(n))
    voice = biquad(voice, "lp", 700) * 0.12
    e = env(len(n), 0.35, 1.2, 1.6)
    return (x + voice) * e * 0.9


def thump():
    body = sweep_sine(110, 45, 0.35, 0.5) * env(int(0.35 * SR), 0.003, 0.32, 3)
    click = biquad(noise(0.04), "lp", 1800) * env(int(0.04 * SR), 0.001, 0.035)
    click = np.pad(click, (0, len(body) - len(click)))
    return body * 0.9 + click * 0.5


def scrabble():
    out = np.zeros(int(1.6 * SR))
    pos = 0.0
    while pos < 1.5:
        g = biquad(noise(0.03), "bp", rng.uniform(2500, 5000), 3) * env(int(0.03 * SR), 0.001, 0.025)
        i = int(pos * SR)
        out[i:i + len(g)] += g * rng.uniform(0.5, 1)
        pos += rng.uniform(0.035, 0.09)
    return out * 1.6


def trombone_note(freq, sec, bend=0.0, vibrato=0.0):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    f = freq * (1 + bend * np.linspace(0, 1, n)) * (1 + vibrato * np.sin(2 * math.pi * 6 * tt))
    x = saw(f, n) + 0.5 * saw(f * 0.5, n)
    x = biquad(x, "lp", 900, 0.9)
    wah = 0.6 + 0.4 * np.minimum(1, tt / 0.12)
    return x * wah * env(n, 0.03, 0.08)


def sad_trombone():
    notes = [
        trombone_note(293.7, 0.32),
        trombone_note(277.2, 0.32),
        trombone_note(261.6, 0.32),
        trombone_note(247.0, 1.1, bend=-0.03, vibrato=0.02),
    ]
    return np.concatenate(notes) * 0.45


def bark():
    sec = 0.22
    n = int(sec * SR)
    f = 520 * np.exp(-np.linspace(0, 1.1, n))
    tone = saw(f + 120, n)
    x = biquad(tone, "bp", 900, 1.2) * 0.9 + biquad(noise(sec), "bp", 1600, 1.5) * 0.5
    x = biquad(x, "lp", 3000)
    return pad(x * env(n, 0.006, 0.17, 1.5) * 1.6, 0.05)


def whoosh():
    sec = 0.7
    n = noise(sec)
    center = 300 * (12 ** np.sin(np.linspace(0, math.pi, len(n))))
    x = biquad(n, "bp", center, 1.2)
    return x * np.sin(np.linspace(0, math.pi, len(n))) ** 1.5 * 1.3


def bell(freq, sec, amp=1.0):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * math.pi * freq * tt) + 0.4 * np.sin(2 * math.pi * freq * 2.76 * tt) + 0.2 * np.sin(2 * math.pi * freq * 5.4 * tt)
    return x * np.exp(-tt * 5) * amp


def mix_at(parts, total):
    out = np.zeros(int(total * SR))
    for start, x in parts:
        i = int(start * SR)
        seg = x[: len(out) - i]
        out[i:i + len(seg)] += seg
    return out


def rising_sparkle():
    freqs = [784, 988, 1175, 1568, 1976, 2349]
    return mix_at([(i * 0.12, bell(f, 0.8, 0.25)) for i, f in enumerate(freqs)], 1.6)


def plop():
    x = sweep_sine(520, 120, 0.16, 0.6) * env(int(0.16 * SR), 0.002, 0.12)
    return pad(x * 0.9, 0.1)


def crunch():
    parts = []
    pos = 0.0
    while pos < 0.9:
        size = rng.uniform(0.02, 0.06)
        g = biquad(noise(size), "bp", rng.uniform(1500, 4000), 1.5) * env(int(size * SR), 0.001, size * 0.8)
        parts.append((pos, g * rng.uniform(0.6, 1.2)))
        pos += rng.uniform(0.02, 0.07) if (pos % 0.3) < 0.15 else rng.uniform(0.08, 0.12)
    return mix_at(parts, 1.0) * 1.4


def pop_cut():
    x = sweep_sine(500, 950, 0.07, 0.5) * env(int(0.07 * SR), 0.001, 0.06)
    return pad(x * 0.8, 0.05)


def twinkle():
    return mix_at([(0, bell(1568, 1.0, 0.35)), (0.11, bell(2093, 1.0, 0.3)), (0.22, bell(2637, 1.2, 0.28))], 1.5)


def boing():
    sec = 0.7
    n = int(sec * SR)
    tt = np.arange(n) / SR
    f = 260 * (1 + 0.45 * np.sin(2 * math.pi * 13 * tt) * np.exp(-4.5 * tt)) * (1 + 0.5 * tt)
    x = np.sin(2 * math.pi * np.cumsum(f) / SR)
    return x * env(n, 0.005, 0.55, 1.4)


def squeak():
    """Squeaky dog toy: two quick nasal chirps."""
    def chirp(f0, f1, sec):
        n = int(sec * SR)
        f = np.linspace(f0, f1, n) ** 1.0
        x = saw(f, n) * 0.6 + np.sin(2 * math.pi * np.cumsum(f) / SR)
        x = biquad(x, "bp", 2200, 1.5)
        return x * env(n, 0.01, sec * 0.6)
    return mix_at([(0, chirp(1700, 2600, 0.13)), (0.17, chirp(1900, 1500, 0.16))], 0.45) * 1.8


def slide_whistle(f0, f1, sec):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    f = np.exp(np.linspace(math.log(f0), math.log(f1), n)) * (1 + 0.012 * np.sin(2 * math.pi * 7 * tt))
    x = np.sin(2 * math.pi * np.cumsum(f) / SR) + 0.15 * biquad(noise(sec), "bp", f0, 4)
    return x * env(n, 0.03, 0.12)


def slide_whistle_down():
    return slide_whistle(1500, 320, 0.8)


def slide_whistle_up():
    return slide_whistle(380, 1500, 1.0)


def slurp():
    sec = 0.6
    n = noise(sec)
    center = np.linspace(500, 1600, len(n))
    x = biquad(n, "bp", center, 3)
    tt = np.arange(len(n)) / SR
    gurgle = 0.55 + 0.45 * np.sin(2 * math.pi * 28 * tt)
    return x * gurgle * env(len(n), 0.03, 0.2) * 2.2


def snore():
    sec = 2.2
    n = noise(sec)
    tt = np.arange(len(n)) / SR
    inhale = biquad(n, "lp", 260) * (0.6 + 0.4 * np.sin(2 * math.pi * 45 * tt))
    inhale *= np.clip(np.sin(math.pi * tt / 1.2), 0, None) * (tt < 1.2)
    whistle = np.sin(2 * math.pi * np.cumsum(np.linspace(950, 700, len(n))) / SR) * 0.25
    whistle *= np.clip(np.sin(math.pi * (tt - 1.3) / 0.8), 0, None) * (tt > 1.3)
    return (inhale * 2.5 + whistle) * 0.8


def ding():
    return mix_at([(0, bell(1318, 1.3, 0.6)), (0, bell(2637, 0.8, 0.15))], 1.3)


def chime():
    return mix_at([(0, bell(1047, 1.0, 0.4)), (0.09, bell(1319, 1.0, 0.35)), (0.18, bell(1568, 1.1, 0.35))], 1.3)


def bubble_pop():
    x = sweep_sine(320, 1250, 0.045, 0.7) * env(int(0.045 * SR), 0.002, 0.03)
    return pad(x * 0.7, 0.05)


EFFECTS = {
    "room-tone": room_tone,
    "dramatic-sigh": dramatic_sigh,
    "thump": thump,
    "scrabble": scrabble,
    "sad-trombone": sad_trombone,
    "bark": bark,
    "whoosh": whoosh,
    "rising-sparkle": rising_sparkle,
    "plop": plop,
    "crunch": crunch,
    "pop-cut": pop_cut,
    "twinkle": twinkle,
    "boing": boing,
    "squeak": squeak,
    "slide-whistle": slide_whistle_down,
    "slide-whistle-up": slide_whistle_up,
    "slurp": slurp,
    "snore": snore,
    "ding": ding,
    "chime": chime,
    "bubble-pop": bubble_pop,
}


def write_mp3(name, x):
    peak = np.max(np.abs(x)) or 1
    target = 0.06 if name == "room-tone" else 0.8
    x = x / peak * target if name != "room-tone" else x
    x = np.clip(x, -1, 1)
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "fx.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((x * 32767).astype("<i2").tobytes())
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav_path), "-b:a", "128k", str(OUT / f"{name}.mp3")],
            check=True,
        )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in EFFECTS.items():
        write_mp3(name, fn())
        print(f"  wrote audio/sfx/{name}.mp3")


if __name__ == "__main__":
    main()
