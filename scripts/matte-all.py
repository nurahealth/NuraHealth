# Batch AI-matting over the whole MoveKit library (generalised from the
# Barbell Squat test). For each clip: extract frames (half-res), rembg matte
# (isnet-general-use), encode a transparent VP9-alpha WebM, and export a
# transparent poster PNG (representative frame). Uploads both to the public
# exercise-media bucket under alpha/{id}.webm and alpha/{id}.png.
#
# RESUMABLE / IDEMPOTENT: skips any clip whose alpha webm already exists in the
# bucket (so Barbell Squat is skipped, and an interrupted run continues).
#
# Run: python3 scripts/matte-all.py
import os, sys, glob, shutil, subprocess, time
import requests
from rembg import remove, new_session
from PIL import Image

SRC_DIR = '/Users/austin/Desktop/full-library'
TMP = '/tmp/mk-batch'
BUCKET = 'exercise-media'
MODEL = 'isnet-general-use'
FFMPEG = '/opt/homebrew/bin/ffmpeg'
ENVFILE = '/Users/austin/Downloads/nura/.env.local'

def env(k):
    for line in open(ENVFILE):
        if line.startswith(k + '='):
            return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY')
PUB = f'{SUPABASE_URL}/storage/v1/object/public/{BUCKET}'
UPLOAD = f'{SUPABASE_URL}/storage/v1/object/{BUCKET}'
HEADERS = {'Authorization': f'Bearer {KEY}', 'apikey': KEY, 'x-upsert': 'true'}

def exists(path):
    try:
        return requests.head(f'{PUB}/{path}', timeout=20).status_code == 200
    except Exception:
        return False

def upload(path, data, ct):
    r = requests.post(f'{UPLOAD}/{path}', headers={**HEADERS, 'Content-Type': ct}, data=data, timeout=180)
    if r.status_code not in (200, 201):
        raise RuntimeError(f'upload {path} -> {r.status_code} {r.text[:160]}')

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

session = new_session(MODEL)
# Source clips are already uploaded to exercise-media/clips/{id}.mp4 — matte
# straight from their public URLs (no local/Desktop dependency).
r = requests.get(f'{SUPABASE_URL}/rest/v1/exercises?select=id',
                 headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}, timeout=60)
slugs = sorted(x['id'] for x in r.json())
print(f'library: {len(slugs)} clips (from catalog) | model {MODEL}', flush=True)

ok = skipped = failed = 0
fails = []
t0 = time.time()

for n, slug in enumerate(slugs, 1):
    src = f'{PUB}/clips/{slug}.mp4'
    if exists(f'alpha/{slug}.webm'):
        skipped += 1
        continue
    work = os.path.join(TMP, slug)
    frames, cut = os.path.join(work, 'frames'), os.path.join(work, 'cut')
    try:
        shutil.rmtree(work, ignore_errors=True)
        os.makedirs(frames); os.makedirs(cut)
        # 1. extract half-res frames
        run([FFMPEG, '-v', 'error', '-i', src, '-vf', 'scale=968:-2', '-vsync', '0', f'{frames}/%04d.png'])
        names = sorted(os.listdir(frames))
        # 2. matte each frame
        for f in names:
            res = remove(Image.open(os.path.join(frames, f)).convert('RGBA'), session=session)
            res.save(os.path.join(cut, f))
        # 3. transparent poster (middle frame), downscaled for light list thumbnails
        mid = names[len(names) // 2]
        poster = Image.open(os.path.join(cut, mid)).convert('RGBA')
        poster.thumbnail((480, 480))
        poster_path = os.path.join(work, 'poster.png')
        poster.save(poster_path)
        # 4. encode transparent VP9-alpha webm (same settings as the test)
        webm_path = os.path.join(work, f'{slug}.webm')
        run([FFMPEG, '-v', 'error', '-framerate', '30', '-i', f'{cut}/%04d.png',
             '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-an', webm_path])
        # 5. upload both
        with open(webm_path, 'rb') as fh:
            upload(f'alpha/{slug}.webm', fh.read(), 'video/webm')
        with open(poster_path, 'rb') as fh:
            upload(f'alpha/{slug}.png', fh.read(), 'image/png')
        ok += 1
    except Exception as e:
        failed += 1
        fails.append(f'{slug}: {e}')
        print(f'  FAIL {slug}: {e}', flush=True)
    finally:
        shutil.rmtree(work, ignore_errors=True)

    if (ok + failed) % 10 == 0 and (ok + failed) > 0:
        el = (time.time() - t0) / 60
        print(f'  progress: {n}/{len(slugs)} seen | matted {ok} | skipped {skipped} | failed {failed} | {el:.1f} min', flush=True)

print('\n──────── SUMMARY ────────', flush=True)
print(f'matted this run: {ok}', flush=True)
print(f'skipped (already done): {skipped}', flush=True)
print(f'failed: {failed}', flush=True)
for f in fails:
    print('  -', f, flush=True)
print(f'elapsed: {(time.time()-t0)/60:.1f} min', flush=True)
