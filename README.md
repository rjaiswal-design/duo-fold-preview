# Duo fold preview

noon's screens on a foldable device, in the browser. The device arrives open, folds shut on its own, and a picker beside the fold control switches between eight screens — each one a cover and an open layout.

Adapted from [iphone-duo](https://github.com/chuspeeism/iphone-duo) by jadon7. Three.js renders Apple's USDZ reference model; the screens are flat images mapped onto the two display surfaces.

## Run it

The Apple model is not in this repo (see **Assets**), so prepare it once, then serve the folder:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-assets.txt pillow
python scripts/prepare-assets.py
python3 -c "
import functools, http.server
D='$PWD'
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, must-revalidate')
        super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1',3013), functools.partial(H, directory=D)).serve_forever()
"
```

Open <http://localhost:3013>. Any static server works — `no-store` just stops the browser serving stale JS while you edit.

Two things worth knowing:

- **A hidden tab freezes it.** Startup waits on `requestAnimationFrame`, which browsers don't fire for a hidden page, so the preview stalls mid-load until the tab is visible. The render loop also zeroes its delta when hidden, which pauses every animation.
- Serve from a directory your shell can read. macOS blocks sandboxed processes from `~/Downloads`, which surfaces as a 404 on every file rather than a permission error.

## Screens

Each screen is a pair in `previews/screens/` — `<id>-outer.webp` for the cover, `<id>-inner.webp` for the open layout — listed in `experiences` in [`main.js`](main.js). The default screen is bundled separately as `previews/outer.webp` and `previews/inner.webp`, so changing `BUNDLED_SCREEN` means copying that pair's files too.

Exports are fitted, never cropped. Ship them at **585 × 851** (cover) and **2160 × 1518** (open) — 1.5× the draw canvas, which is roughly a retina display's pixels. Anything larger is discarded at draw time:

```sh
python - <<'PY'
from PIL import Image
image = Image.open('export.png').convert('RGB')
tw, th = 2160, 1518            # 585, 851 for a cover
scale = min(tw / image.width, th / image.height)
resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
canvas = Image.new('RGB', (tw, th), '#ffffff')
canvas.paste(resized, ((tw - resized.width) // 2, (th - resized.height) // 2))
canvas.save('previews/screens/<id>-inner.webp', 'WEBP', quality=88, method=6)
PY
```

## Assets

`scripts/prepare-assets.py` downloads Apple's reference USDZ and exports `assets/iPhone_Duo_Render.usdc` plus its textures. That directory is gitignored — the model is not covered by this repo's licence and is not ours to redistribute. Re-run the script on a fresh clone.

## Deploy

Static. `vercel deploy --prod` serves the folder as-is; `vercel.json` has no build step because the assets are prepared locally and uploaded. `.vercelignore` keeps the Apple source USDZ and the upstream portfolio captures out of the upload.

## Licence

Application code keeps the upstream [MIT licence](LICENSE). The device model, Apple's textures and the noon screens are **not** covered by it — see [third-party notices](THIRD_PARTY_NOTICES.md). This is an independent study, not an Apple-endorsed product.
