"""Create short, original EchoDesk demo loops (no third-party samples)."""
from __future__ import annotations
import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "assets" / "audio"
RATE = 22050
DURATION = 16.0

# Chords are frequencies in Hz. Each progression is four gentle, sustained chords.
LOOPS = {
    "first-light": [
        [130.81, 164.81, 196.00, 246.94],
        [174.61, 220.00, 261.63, 329.63],
        [110.00, 130.81, 164.81, 196.00],
        [98.00, 146.83, 196.00, 246.94],
    ],
    "blue-hour": [
        [146.83, 174.61, 220.00, 261.63],
        [116.54, 146.83, 174.61, 233.08],
        [174.61, 220.00, 261.63, 349.23],
        [130.81, 164.81, 196.00, 261.63],
    ],
    "paper-planes": [
        [164.81, 196.00, 246.94, 293.66],
        [130.81, 164.81, 196.00, 246.94],
        [196.00, 246.94, 293.66, 392.00],
        [146.83, 185.00, 220.00, 293.66],
    ],
    "slow-bloom": [
        [196.00, 246.94, 293.66, 369.99],
        [164.81, 196.00, 246.94, 329.63],
        [146.83, 220.00, 293.66, 349.23],
        [174.61, 220.00, 261.63, 329.63],
    ],
}


def envelope(t: float, duration: float) -> float:
    attack = min(1.0, t / 0.85)
    release = min(1.0, (duration - t) / 1.4)
    return max(0.0, min(attack, release))


def make_loop(name: str, chords: list[list[float]]) -> None:
    path = OUT / f"{name}.wav"
    frames = int(RATE * DURATION)
    with wave.open(str(path), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(RATE)
        data = bytearray()
        for i in range(frames):
            t = i / RATE
            chord_index = min(3, int(t / 4.0))
            local_t = t - chord_index * 4.0
            env = envelope(t, DURATION)
            # A soft, self-composed pad with a quiet bell-like note every beat.
            left = right = 0.0
            for j, freq in enumerate(chords[chord_index]):
                gain = (0.105 if j == 0 else 0.075 / (j ** 0.28))
                left += gain * math.sin(2 * math.pi * freq * t + j * 0.17)
                right += gain * math.sin(2 * math.pi * (freq * (1.001 + j * 0.00015)) * t + j * 0.31)
            beat_t = local_t % 1.0
            bell_env = math.exp(-beat_t * 5.2)
            bell_freq = chords[chord_index][2] * (2 if int(local_t) % 2 == 0 else 1.5)
            left += 0.07 * bell_env * math.sin(2 * math.pi * bell_freq * beat_t)
            right += 0.065 * bell_env * math.sin(2 * math.pi * bell_freq * beat_t + 0.2)
            # A very low, slow shimmer prevents the demo from sounding like a test tone.
            shimmer = 0.012 * math.sin(2 * math.pi * 0.13 * t)
            left = max(-0.9, min(0.9, (left + shimmer) * env))
            right = max(-0.9, min(0.9, (right - shimmer) * env))
            data.extend(struct.pack("<hh", int(left * 32767), int(right * 32767)))
        f.writeframes(data)
    print(path)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for key, progression in LOOPS.items():
        make_loop(key, progression)
