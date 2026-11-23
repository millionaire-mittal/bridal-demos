"""Turn a raw client video into a web-ready testimonial clip plus a poster image.

    python tools/video.py raw.mov <slug> <name>
    python tools/video.py raw.mov yashaswini-mumbai priya --at 2.5      # poster at 2.5 seconds
    python tools/video.py raw.mov yashaswini-mumbai priya --max 720     # cap on the SHORT side, default 720

Writes:
    demos/<slug>/video/<name>.mp4      H.264 + AAC, compressed, streamable (faststart)
    demos/<slug>/img/video-<name>.jpg  poster frame (the card the visitor sees before pressing play)

Then reference it in leads.json:
    "videos": {"items": [{"name": "Client name", "role": "Actor", "quote": "word for word",
                          "file": "<name>.mp4", "poster": "video-<name>.jpg"}]}

Keep each clip under about 25 MB (GitHub rejects files over 100 MB). Needs ffmpeg and ffprobe on your PATH.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{r.stderr[-1500:]}")
    return r.stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("slug")
    ap.add_argument("name", help="short file-safe name, e.g. priya")
    ap.add_argument("--at", type=float, default=1.0, help="poster frame time in seconds")
    ap.add_argument("--max", type=int, default=720, help="cap on the short side in pixels (720 = 720x1280 phone video)")
    ap.add_argument("--crf", type=int, default=26, help="quality: lower is better and bigger (default 26)")
    a = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            sys.exit(f"{tool} not found on PATH")
    src = Path(a.video)
    if not src.is_file():
        sys.exit(f"not found: {src}")
    if not a.name.replace("-", "").replace("_", "").isalnum():
        sys.exit("name must be letters, digits, dashes or underscores")

    site = ROOT / "demos" / a.slug
    if not site.is_dir():
        sys.exit(f"demos/{a.slug}/ does not exist yet (add the lead and run build.py first)")
    vdir, idir = site / "video", site / "img"
    vdir.mkdir(exist_ok=True)
    idir.mkdir(exist_ok=True)
    out, poster = vdir / f"{a.name}.mp4", idir / f"video-{a.name}.jpg"

    info = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                           "stream=width,height:format=duration", "-of", "json", str(src)]))
    w, h = info["streams"][0]["width"], info["streams"][0]["height"]
    dur = float(info["format"]["duration"])
    short = min(w, h)
    # cap the short side (720 means 720x1280 for a phone video, 1280x720 for landscape); never upscale
    vf = f"scale=-2:{a.max}" if h <= w and short > a.max else (f"scale={a.max}:-2" if short > a.max else "scale=trunc(iw/2)*2:trunc(ih/2)*2")
    run(["ffmpeg", "-y", "-i", str(src), "-vf", vf, "-c:v", "libx264", "-crf", str(a.crf), "-preset", "slow",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(out)])
    run(["ffmpeg", "-y", "-ss", str(min(a.at, max(dur - 0.1, 0))), "-i", str(out), "-frames:v", "1",
         "-vf", "scale=720:-2", "-q:v", "3", str(poster)])

    mb = out.stat().st_size / 1e6
    print(f"{src.name}: {w}x{h}, {dur:.1f}s")
    print(f"  -> {out.relative_to(ROOT)}  ({mb:.1f} MB)")
    print(f"  -> {poster.relative_to(ROOT)}")
    if mb > 25:
        print("  warning: over 25 MB. Try --crf 29 or --max 540, or trim the clip.")
    if mb > 90:
        print("  ERROR: GitHub rejects files over 100 MB. Compress more before committing.")


if __name__ == "__main__":
    main()
