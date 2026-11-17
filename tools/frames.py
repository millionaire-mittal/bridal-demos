"""Pull photos out of a screen recording of a client's website.

Many stylists' sites show photos in carousels and grids that are hard to save
one by one. Screen-record yourself scrolling slowly through their site, then:

    python tools/frames.py recording.mp4                 # frames + numbered contact sheet
    python tools/frames.py recording.mp4 --fps 3

Writes frames/<recording-name>/f_001.jpg ... at full resolution, plus
contact.jpg with a number on every frame. Look at the contact sheet, pick the
frames that show each photo whole, and crop them (Claude Code can do the crop
and remove the cursor for you: tell it the frame number and which photo).

Needs ffmpeg on your PATH, and Pillow (pip install pillow).
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=2)
    a = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found. Install it (winget install ffmpeg / brew install ffmpeg) and try again.")
    video = Path(a.video).resolve()
    out = HERE / "frames" / video.stem
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vf", f"fps={a.fps}", "-q:v", "2",
                    str(out / "f_%03d.jpg")], check=True)
    frames = sorted(out.glob("f_*.jpg"))
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        sys.exit(f"Wrote {len(frames)} frames to {out}. (pip install pillow for the contact sheet.)")
    w, cols = 480, 4
    first = Image.open(frames[0]); h = int(first.height * w / first.width)
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (w + 6), rows * (h + 6)), "black")
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(frames):
        x, y = (i % cols) * (w + 6), (i // cols) * (h + 6)
        sheet.paste(Image.open(f).resize((w, h)), (x, y))
        d.rectangle([x, y, x + 58, y + 26], fill="black")
        d.text((x + 8, y + 6), f"{i + 1:03d}", fill="white")
    sheet.save(out / "contact.jpg", quality=85)
    print(f"Wrote {len(frames)} frames and contact.jpg to {out.relative_to(HERE)}")


if __name__ == "__main__":
    main()
