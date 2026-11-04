# MesureCam

Measure an object's length, or the distance from the phone camera to an object, in French and English. The app is installable on Android and iPhone as a Progressive Web App.

Once GitHub Pages serves this repository from `main`, the app is at
`https://badian3117.github.io/Blast-predictor/mesurecam/`. It must be served over HTTPS, because browsers only allow camera, motion sensors and WebXR on secure pages.

## Why three modes

A single camera image has no absolute scale: a 1 m object at 10 m looks exactly like a 10 cm object at 1 m. Every mode therefore adds one piece of real-world information:

| Mode | Extra information | Formula | Typical accuracy |
|---|---|---|---|
| **3D AR** (Chrome on Android + ARCore) | Motion tracking (SLAM) gives metric 3D points | Euclidean distance between hit-test points | 1–3 % |
| **Photo – Reference** | Object of known length in the same plane | `L = L_ref × p_obj / p_ref` | 1–5 % |
| **Photo – Distance / Size** | Focal length in pixels `f` (calibrated once) + known size or known distance | `D = f × S / p`, `S = p × D / f` | ~3 % calibrated, ~15 % uncalibrated |
| **Tilt** | Lens height `h` + orientation sensor, flat ground | `d = h / tan δ`, `H = h − d × tan δ_top` | Good up to ~10 × `h` |

`p` is a length in image pixels and `δ` is the angle of the camera axis below the horizon. The angle is computed as `asin(cos β · cos γ)` from the device orientation, so it holds in both portrait and landscape.

Every result is shown with an error estimate. For Photo, it combines the pointing error (about 1 display pixel per endpoint with the magnifier) with the calibration error. For Tilt, it propagates an angle error of ±0.5°.

## Files

- `index.html`: the whole app.
- `manifest.webmanifest`, `icons/`: install metadata.
- `sw.js`: the service worker that makes the app work offline after the first visit. AR still needs ARCore on the device.

## Limits

- The Photo modes assume a pinhole camera, so lens distortion is ignored. Keep measured objects near the centre of the image.
- Calibration is stored per device as focal length ÷ image long side. Any change of lens or zoom invalidates it.
- Web AR is not available in iOS Safari. On iPhone, use Photo and Tilt.
