/** Hinge sounds for the fold slider, synthesised on the fly so no audio ships with the page. */
let ctx, master, noise;

function start() {
  if (ctx) return ctx.state === 'suspended' ? ctx.resume() : undefined;
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return;
  ctx = new Ctx();
  master = ctx.createGain();
  master.gain.value = .5;
  master.connect(ctx.destination);
  // One short noise buffer backs every click; filtering is what gives each its character.
  noise = ctx.createBuffer(1, ctx.sampleRate * .12, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

let lastClick = 0;
/** A detent click. `strength` 0–1 scales brightness and level with drag speed. */
function click(strength = .5, tone = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;
  // A fast scrub can cross detents faster than they can be heard apart; keep them distinct.
  if (t - lastClick < .025) return;
  lastClick = t;
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = (1500 + strength * 1400) * tone;
  band.Q.value = 5.5;
  const gain = ctx.createGain();
  const peak = .018 + strength * .042;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + .0015);
  gain.gain.exponentialRampToValueAtTime(.0001, t + .035);
  source.connect(band).connect(gain).connect(master);
  source.start(t);
  source.stop(t + .05);
}

/** The soft landing when the hinge reaches either end. */
function thud(frequency) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, t);
  osc.frequency.exponentialRampToValueAtTime(frequency * .55, t + .14);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(.075, t + .006);
  gain.gain.exponentialRampToValueAtTime(.0001, t + .22);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + .24);
  click(.35, 1.4);
}

/**
 * Wire hinge audio to a range input. Sound only ever follows a direct gesture on
 * the control, so the automatic opening and the fold cycle stay silent.
 */
export function attachFoldSound(slider, { detent = 6 } = {}) {
  let lastNotch = Math.round(Number(slider.value) / detent);
  let lastValue = Number(slider.value);
  let lastTime = 0;
  let engaged = false;
  let mode = 'pointer';

  const grab = () => { engaged = true; mode = 'pointer'; start(); click(.3, .8); };
  const release = () => { if (engaged) { engaged = false; click(.25, .7); } };

  slider.addEventListener('pointerdown', grab);
  slider.addEventListener('keydown', event => {
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') { engaged = true; mode = 'key'; start(); }
  });
  window.addEventListener('pointerup', release);
  slider.addEventListener('blur', () => { engaged = false; });

  slider.addEventListener('input', () => {
    if (!engaged) return;
    const value = Number(slider.value);
    const now = performance.now();
    // Drag speed in degrees per millisecond, normalised into a 0–1 strength.
    const speed = Math.abs(value - lastValue) / Math.max(now - lastTime, 8);
    const previous = lastValue;
    lastValue = value;
    lastTime = now;

    const notch = Math.round(value / detent);
    // Keyboard steps are a tenth of a degree, far finer than a detent, so they click per press.
    if (notch !== lastNotch || mode === 'key') {
      lastNotch = notch;
      // Pitch rises as the hinge opens, so the scrub reads as travel, not repetition.
      click(Math.min(1, .3 + speed * 4), .9 + value / 180 * .35);
    }
    if (value <= 0 && previous > 0) thud(96);
    if (value >= 180 && previous < 180) thud(132);
  });
}

/** A short confirmation click for control presses outside the slider. */
export function uiTick() {
  start();
  click(.4, 1.15);
}
