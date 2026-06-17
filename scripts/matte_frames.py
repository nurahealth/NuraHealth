import sys, os
from rembg import remove, new_session
from PIL import Image

inp, out, model = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else 'isnet-general-use')
os.makedirs(out, exist_ok=True)
session = new_session(model)
files = sorted(f for f in os.listdir(inp) if f.endswith('.png'))
print(f'matting {len(files)} frames with {model} …', flush=True)
for i, f in enumerate(files):
    img = Image.open(os.path.join(inp, f)).convert('RGBA')
    res = remove(img, session=session)  # RGBA with cut-out alpha
    res.save(os.path.join(out, f))
    if (i + 1) % 25 == 0:
        print(f'  {i + 1}/{len(files)}', flush=True)
print('done', flush=True)
