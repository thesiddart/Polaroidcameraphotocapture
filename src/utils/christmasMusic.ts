// Christmas background music player using Pixabay audio
export class ChristmasMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {
    this.audio = new Audio();
    // Pixabay Christmas Holiday music
    this.audio.src = 'https://cdn.pixabay.com/download/audio/2024/11/05/audio_48c8be8c5b.mp3?filename=christmas-holidays-background-music-christmas-holidays-happy-holidays-170701.mp3';
    this.audio.loop = true;
    this.audio.volume = 0.3; // 30% volume for background music
    
    // Preload the audio
    this.audio.load();
  }

  async start() {
    if (this.isPlaying || !this.audio) return;
    
    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (error) {
      console.log('Audio playback failed (browser autoplay policy):', error);
      
      // Add click listener to start on first user interaction
      const playOnInteraction = async () => {
        if (!this.audio || this.isPlaying) return;
        
        try {
          await this.audio.play();
          this.isPlaying = true;
          // Remove listener after successful play
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        } catch (e) {
          console.log('Audio play retry failed:', e);
        }
      };
      
      document.addEventListener('click', playOnInteraction, { once: true });
      document.addEventListener('touchstart', playOnInteraction, { once: true });
    }
  }

  stop() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}
