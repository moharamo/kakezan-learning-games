export function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function recognizeOnce({ lang = 'ja-JP', timeoutMs = 7000 } = {}) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return Promise.reject(new Error('not-supported'));

  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    let settled = false;
    const timer = window.setTimeout(() => {
      recognition.abort();
      finish(reject, new Error('timeout'));
    }, timeoutMs);

    function finish(callback, value) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      callback(value);
    }

    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0], (result) => result.transcript);
      finish(resolve, alternatives);
    };
    recognition.onerror = (event) => finish(reject, new Error(event.error || 'recognition-error'));
    recognition.onend = () => finish(reject, new Error('no-speech'));
    recognition.start();
  });
}

