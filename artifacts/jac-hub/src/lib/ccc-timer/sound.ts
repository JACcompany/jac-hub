// Efectos sintetizados con Web Audio + loops ambiente.
// Sin dependencias externas. Solo funciona en navegador.
// Fuente original: CCC Timer — portado a JAC Hub sin modificaciones funcionales.

let ctx: AudioContext | null = null;
let ambientMaster: GainNode | null = null;
let ambientStop: (() => void) | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

let sfxEnabled = true;
export function setSfxEnabled(v: boolean) { sfxEnabled = v; }
export function isSfxEnabled() { return sfxEnabled; }

function envBeep(opts: { freq: number; dur?: number; type?: OscillatorType; vol?: number; slideTo?: number }) {
  if (!sfxEnabled) return;
  const c = getCtx();
  if (!c) return;
  const { freq, dur = 0.15, type = "sine", vol = 0.18, slideTo } = opts;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.05);
}

export const sfx = {
  click: () => envBeep({ freq: 720, dur: 0.05, type: "triangle", vol: 0.07 }),
  start: () => envBeep({ freq: 520, dur: 0.12, type: "sine", vol: 0.14, slideTo: 880 }),
  pause: () => envBeep({ freq: 440, dur: 0.1, type: "sine", vol: 0.1, slideTo: 220 }),
  coffee: () => {
    envBeep({ freq: 320, dur: 0.18, type: "sine", vol: 0.12, slideTo: 180 });
    setTimeout(() => envBeep({ freq: 240, dur: 0.12, type: "triangle", vol: 0.08 }), 90);
  },
  done: () => {
    [880, 1175, 1568].forEach((f, i) =>
      setTimeout(() => envBeep({ freq: f, dur: 0.18, type: "sine", vol: 0.16 }), i * 130),
    );
  },
};

function makeNoise(c: AudioContext, durationSec: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * durationSec), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function startRain(c: AudioContext, master: GainNode): () => void {
  const src = c.createBufferSource();
  src.buffer = makeNoise(c, 4);
  src.loop = true;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
  const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 250;
  const g = c.createGain(); g.gain.value = 0.35;
  src.connect(hp).connect(lp).connect(g).connect(master);
  src.start();
  return () => src.stop();
}

function startKeyboard(c: AudioContext, master: GainNode): () => void {
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = 1200 + Math.random() * 800;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.04);
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2200;
    o.connect(f).connect(g).connect(master);
    o.start(); o.stop(c.currentTime + 0.06);
    setTimeout(tick, 60 + Math.random() * 220);
  };
  tick();
  return () => { stopped = true; };
}

function startCafe(c: AudioContext, master: GainNode): () => void {
  const src = c.createBufferSource();
  src.buffer = makeNoise(c, 6); src.loop = true;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
  const g = c.createGain(); g.gain.value = 0.25;
  src.connect(lp).connect(g).connect(master); src.start();
  let stopped = false;
  const ping = () => {
    if (stopped) return;
    const o = c.createOscillator(); const og = c.createGain();
    o.type = "sine"; o.frequency.value = 1500 + Math.random() * 1500;
    og.gain.setValueAtTime(0, c.currentTime);
    og.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
    o.connect(og).connect(master); o.start(); o.stop(c.currentTime + 0.5);
    setTimeout(ping, 3000 + Math.random() * 6000);
  };
  setTimeout(ping, 2000);
  return () => { stopped = true; src.stop(); };
}

function startLofi(c: AudioContext, master: GainNode): () => void {
  const notes = [220, 277.18, 329.63, 415.3];
  const oscs: OscillatorNode[] = [];
  notes.forEach((f, i) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = i === 0 ? "triangle" : "sine"; o.frequency.value = f; g.gain.value = 0.06;
    const lfo = c.createOscillator(); const lfoG = c.createGain();
    lfo.frequency.value = 0.1 + i * 0.05; lfoG.gain.value = 0.03;
    lfo.connect(lfoG).connect(g.gain);
    o.connect(g).connect(master); o.start(); lfo.start();
    oscs.push(o, lfo);
  });
  const b = c.createOscillator(); const bg = c.createGain();
  b.type = "sine"; b.frequency.value = 110; bg.gain.value = 0.07;
  b.connect(bg).connect(master); b.start(); oscs.push(b);
  return () => oscs.forEach(o => o.stop());
}

export type AmbientId = "lofi" | "rain" | "keys" | "cafe" | null;

export function setAmbient(id: AmbientId) {
  if (ambientStop) { ambientStop(); ambientStop = null; }
  if (ambientMaster) { ambientMaster.disconnect(); ambientMaster = null; }
  if (!id) return;
  const c = getCtx(); if (!c) return;
  const master = c.createGain(); master.gain.value = 0.7; master.connect(c.destination);
  ambientMaster = master;
  switch (id) {
    case "rain":  ambientStop = startRain(c, master); break;
    case "keys":  ambientStop = startKeyboard(c, master); break;
    case "cafe":  ambientStop = startCafe(c, master); break;
    case "lofi":  ambientStop = startLofi(c, master); break;
  }
}

export function setAmbientVolume(v: number) {
  if (ambientMaster) ambientMaster.gain.value = Math.max(0, Math.min(1, v));
}
