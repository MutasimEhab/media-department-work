let audioContext: AudioContext | null = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const Context = window.AudioContext;
  if (!Context) return null;
  audioContext ||= new Context();
  return audioContext;
}

export function unlockNotificationAudio() {
  const context = getContext();
  if (context?.state === 'suspended') void context.resume().catch(() => undefined);
}

export function playNotificationSound(sound: string = 'soft-bell') {
  if (sound === 'silent') return;
  const context = getContext();
  if (!context || context.state !== 'running') return;
  const notes = sound === 'clear-chime' ? [880, 1174, 1480]
    : sound === 'gentle-pop' ? [660, 880]
      : [784, 988];
  const now = context.currentTime;
  notes.forEach((frequency, index) => {
    const start = now + index * (sound === 'clear-chime' ? 0.12 : 0.08);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = sound === 'gentle-pop' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (sound === 'gentle-pop' ? 0.16 : 0.32));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.35);
  });
}
