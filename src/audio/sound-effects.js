let context;

function getContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  context ??= new AudioContextClass();
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone(frequency, start, duration, type = 'sine', volume = 0.08) {
  const audio = getContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime + start);
  gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(audio.currentTime + start);
  oscillator.stop(audio.currentTime + start + duration + 0.02);
}

export function playEffect(name, enabled = true) {
  if (!enabled) return;
  if (name === 'tap') tone(420, 0, 0.08, 'sine', 0.035);
  if (name === 'correct') {
    tone(523, 0, 0.13, 'sine');
    tone(659, 0.11, 0.15, 'sine');
  }
  if (name === 'try-again') {
    tone(392, 0, 0.1, 'triangle', 0.04);
    tone(349, 0.09, 0.14, 'triangle', 0.035);
  }
  if (name === 'hatch') {
    [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, index * 0.1, 0.2, 'sine', 0.07));
  }
}

