let manifest = {};
let currentAudio = null;

export async function loadVoiceManifest() {
  const response = await fetch('./public/audio/voice-manifest.json');
  if (!response.ok) throw new Error('voice-manifest-unavailable');
  manifest = await response.json();
}

export function normalizeVoiceKey(text) {
  return String(text).normalize('NFKC').replace(/[\s、。！？?]/g, '').replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

export function playVoice(text, enabled = true, callback) {
  currentAudio?.pause();
  currentAudio = null;
  if (!enabled) {
    callback?.();
    return;
  }
  const item = manifest[normalizeVoiceKey(text)];
  if (!item) {
    console.warn(`Voice line not found: ${text}`);
    callback?.();
    return;
  }
  const audio = new Audio(item.file);
  currentAudio = audio;
  const finish = () => {
    if (currentAudio === audio) currentAudio = null;
    callback?.();
  };
  audio.addEventListener('ended', finish, { once: true });
  audio.addEventListener('error', finish, { once: true });
  audio.play().catch(finish);
}

