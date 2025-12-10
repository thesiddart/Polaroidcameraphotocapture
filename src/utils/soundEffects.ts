import cameraShutterSound from '../assets/camera-shutter-314056.mp3';
import paperSlideSound from '../assets/paper-slide-102746.mp3';

// Play real camera shutter sound from local assets
export const playCameraShutterSound = () => {
  const audio = new Audio(cameraShutterSound);
  audio.volume = 0.7;
  audio.play().catch(err => console.error('Error playing shutter sound:', err));
};

// Play paper slide sound from local assets
export const playSlideSound = () => {
  const audio = new Audio(paperSlideSound);
  audio.volume = 0.6;
  audio.play().catch(err => console.error('Error playing slide sound:', err));
};

// Generate countdown beep sound using Web Audio API
export const playCountdownBeep = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Create oscillator for the beep
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Pleasant "tung" beep sound
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.type = 'sine';

  // Quick beep with volume envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};