let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx && typeof window !== 'undefined') {
    ctx = new AudioContext();
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.08) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(audio.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.stop(audio.currentTime + duration);
}

export const SOUNDS = {
  push: () => tone(440, 0.08, 'triangle', 0.05),
  teamBest: () => {
    tone(523, 0.1, 'sine', 0.06);
    setTimeout(() => tone(659, 0.12, 'sine', 0.06), 80);
  },
  globalBest: () => {
    tone(523, 0.1, 'sine', 0.07);
    setTimeout(() => tone(659, 0.1, 'sine', 0.07), 90);
    setTimeout(() => tone(784, 0.15, 'sine', 0.07), 180);
  },
};
