/** Voice alerts with the browser's built-in speech synthesis. Starts off on every page load. */
export type VoiceSettings = { on: boolean; voice: string; rate: number };
const KEY = 'cgm_voice';
let on = false;
const read = (): { voice: string; rate: number } => { try { return { voice: '', rate: 1, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { voice: '', rate: 1 }; } };
export const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
export function getVoice(): VoiceSettings { return { on, ...read() }; }
export function setVoice(p: Partial<VoiceSettings>) {
  if (p.on !== undefined) { on = p.on; if (!on && supported()) speechSynthesis.cancel(); }
  const { voice, rate } = { ...read(), ...p };
  try { localStorage.setItem(KEY, JSON.stringify({ voice, rate })); } catch {}
  window.dispatchEvent(new Event('cgm-voice'));
}
export function speak(text: string, force = false) {
  if (!supported() || (!on && !force)) return;
  const s = read(); const u = new SpeechSynthesisUtterance(text); u.rate = Math.min(2, Math.max(0.6, s.rate));
  const v = speechSynthesis.getVoices().find(x => x.name === s.voice); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
