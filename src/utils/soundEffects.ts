// Play real camera shutter sound from Pixabay
export const playCameraShutterSound = () => {
  const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_4affbf5b9e.mp3?filename=camera-shutter-6305.mp3');
  audio.volume = 0.7;
  audio.play().catch(err => console.error('Error playing shutter sound:', err));
};

// Generate slide/print sound using Web Audio API
export const playSlideSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create noise for sliding/printing effect
  const bufferSize = audioContext.sampleRate * 1.5; // 1.5 seconds
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate filtered noise that sounds like paper sliding
  for (let i = 0; i < bufferSize; i++) {
    const envelope = Math.sin((i / bufferSize) * Math.PI); // Smooth fade in/out
    data[i] = (Math.random() * 2 - 1) * envelope * 0.35;
  }
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Add filtering to make it sound more mechanical
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, audioContext.currentTime);
  filter.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 1);
  
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1.5);
  
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  source.start(audioContext.currentTime);
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