import { useState, useRef, useEffect } from 'react';
import { Camera, Download, X, SwitchCamera, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import cameraImage from './assets/camera.png';
import backgroundMusic from './assets/christmas-holiday-438466.mp3';
import { playCameraShutterSound, playSlideSound, playCountdownBeep } from './utils/soundEffects';
import { Snowfall } from './components/Snowfall';
import { projectId, publicAnonKey } from './utils/supabase/info';

type AppState = 'idle' | 'camera' | 'captured';
type FacingMode = 'user' | 'environment';

// 100 cool random texts for Polaroid cards
const polaroidTexts = [
  "Captured Moment",
  "Today's Mood",
  "Flash of Reality",
  "Instant Memory",
  "Little Snapshot",
  "Polaroid Vibes",
  "Frame of the Day",
  "Caught on Camera",
  "Spontaneous Moment",
  "Frozen Second",
  "This Happened",
  "Unplanned Beauty",
  "Look What Happened",
  "Instant Classic",
  "Smile… it's today",
  "Proof I was here",
  "A tiny miracle",
  "Hey, that's me!",
  "A moment worth keeping",
  "Sunlight & feelings",
  "Soft memories",
  "The world paused here",
  "Caught in 4:5",
  "Not AI, I swear",
  "Looking good, probably",
  "Main character moment",
  "This is my face today",
  "Blink and it's ruined",
  "Accidentally iconic",
  "Just vibing",
  "Raw & unfiltered",
  "No caption needed",
  "Pure existence",
  "Candid energy",
  "Unscripted life",
  "Living proof",
  "Snapshot therapy",
  "Moment of zen",
  "Vintage me",
  "Retro feels",
  "Time capsule",
  "Memory unlocked",
  "Core memory",
  "Flash fiction",
  "Picture perfect chaos",
  "Beautifully random",
  "Perfectly imperfect",
  "Caught slacking",
  "Evidence of joy",
  "Proof of concept",
  "Reality check",
  "Vibe check passed",
  "Golden hour soul",
  "Midnight thoughts",
  "Morning person energy",
  "Weekend mood",
  "Monday vibes",
  "Living my best life",
  "Thriving actually",
  "Existing beautifully",
  "Spontaneous selfie",
  "Unposed & proud",
  "Natural habitat",
  "In my element",
  "Peak performance",
  "Chaotic good",
  "Soft launch",
  "Hard launch",
  "Plot twist",
  "Character development",
  "Lore drop",
  "Canon event",
  "Side quest complete",
  "Achievement unlocked",
  "Level up",
  "New skin unlocked",
  "Rare footage",
  "Behind the scenes",
  "Director's cut",
  "Deleted scene",
  "Bonus content",
  "Limited edition me",
  "One of one",
  "Collector's item",
  "Vintage original",
  "Timeless classic",
  "Forever mood",
  "Eternal vibe",
  "Infinite energy",
  "Cosmic alignment",
  "Universal truth",
  "Existential proof",
  "Philosophy in pixels",
  "Art in motion",
  "Poetry in pause",
  "Beauty in bytes",
  "Digital nostalgia",
  "Analog heart"
];

// Function to get random text
const getRandomPolaroidText = () => {
  return polaroidTexts[Math.floor(Math.random() * polaroidTexts.length)];
};

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [userName, setUserName] = useState('Your Name');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const [showAnimation, setShowAnimation] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const polaroidRef = useRef<HTMLDivElement>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const captureAudioRef = useRef<HTMLAudioElement | null>(null);
  const slideAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Play background music on mount
  useEffect(() => {
    const audio = new Audio(backgroundMusic);
    audio.volume = 0.03; // 3% volume
    audio.loop = true; // Loop the music
    bgMusicRef.current = audio;

    // Auto-play with error handling
    audio.play().catch(err => {
      console.log('Background music autoplay blocked:', err);
      // Attempt to play on first user interaction
      const playOnInteraction = () => {
        audio.play().catch(e => console.error('Error playing background music:', e));
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('touchstart', playOnInteraction);
      };
      document.addEventListener('click', playOnInteraction);
      document.addEventListener('touchstart', playOnInteraction);
    });

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Fetch global capture count on mount
  useEffect(() => {
    const fetchCaptureCount = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f4b89a46/capture-count`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        if (data.count !== undefined) {
          setCaptureCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching capture count:', error);
      }
    };

    fetchCaptureCount();
  }, []);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle input focus for mobile keyboard
  const handleNameFocus = () => {
    // Small delay to ensure keyboard is shown
    setTimeout(() => {
      nameInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'top'
      });
    }, 300);
  };

  // Handle name input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  // Start camera
  const startCamera = async (mode: FacingMode = facingMode) => {
    setPermissionDenied(false);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      setState('camera');
      setFacingMode(mode);

      // Wait a bit for state to update and component to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure video element is ready
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
          // Try again after a short delay
          setTimeout(async () => {
            try {
              await videoRef.current?.play();
            } catch (e) {
              console.error('Retry play failed:', e);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setPermissionDenied(true);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found on this device.');
        } else if (error.name === 'NotReadableError') {
          alert('Camera is already in use by another application.');
        } else {
          alert('Unable to access camera: ' + error.message);
        }
      }
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';

    // Stop current stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Wait a bit to ensure old stream is fully stopped
    await new Promise(resolve => setTimeout(resolve, 200));

    // Start new camera
    await startCamera(newMode);
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setState('idle');
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Only mirror front camera (user-facing), back camera should show real view
    context.save();
    if (facingMode === 'user') {
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    context.restore();

    // Get image data
    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);

    // Set random Polaroid text
    setUserName(getRandomPolaroidText());

    // Play camera shutter sound and show flash simultaneously
    playCameraShutterSound();
    setShowFlash(true);

    // Hide flash after animation
    setTimeout(() => {
      setShowFlash(false);
    }, 400);

    // Play slide sound after delay (when card starts sliding)
    setTimeout(() => {
      playSlideSound();
    }, 300);

    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setState('captured');
    setShowAnimation(true);

    // Increment global capture count via API
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f4b89a46/capture-count/increment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data.count !== undefined) {
        setCaptureCount(data.count);
      }
    } catch (error) {
      console.error('Error incrementing capture count:', error);
      // Fallback to local increment if API fails
      setCaptureCount(prevCount => prevCount + 1);
    }
  };

  // Start countdown and then capture
  const startCountdownAndCapture = async () => {
    // Start countdown from 3
    setCountdown(3);
    playCountdownBeep();

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(2);
    playCountdownBeep();

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(1);
    playCountdownBeep();

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(null);

    // Capture the photo
    await capturePhoto();
  };

  // Download Polaroid
  const downloadPolaroid = () => {
    if (!capturedImage) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    // Card specifications
    const width = 1750;
    const height = 2188;
    const padding = 145;
    const spacing = 58;
    const borderRadius = 16;
    const fontSize = 136;

    canvas.width = width;
    canvas.height = height;

    // White background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // Load paper texture
    const paperTexture = new Image();
    paperTexture.crossOrigin = 'anonymous';
    paperTexture.onload = () => {
      // Draw paper texture
      context.globalAlpha = 0.3;
      context.drawImage(paperTexture, 0, 0, width, height);
      context.globalAlpha = 1.0;

      // Load and draw captured image
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions
        const imageWidth = width - (padding * 2);
        const textAreaHeight = fontSize + spacing; // spacing above text
        const imageHeight = height - padding - textAreaHeight - padding;

        // Draw image container background with rounded corners
        context.save();
        context.beginPath();
        context.roundRect(padding, padding, imageWidth, imageHeight, borderRadius);
        context.clip();
        context.fillStyle = '#f3f4f6'; // gray-100 background
        context.fillRect(padding, padding, imageWidth, imageHeight);

        // Calculate aspect ratio to fill the container
        const imgAspect = img.width / img.height;
        const containerAspect = imageWidth / imageHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > containerAspect) {
          // Image is wider - fit to height and crop sides
          drawHeight = imageHeight;
          drawWidth = imageHeight * imgAspect;
          drawX = padding + (imageWidth - drawWidth) / 2;
          drawY = padding;
        } else {
          // Image is taller - fit to width and crop top/bottom
          drawWidth = imageWidth;
          drawHeight = imageWidth / imgAspect;
          drawX = padding;
          drawY = padding + (imageHeight - drawHeight) / 2;
        }

        // Draw the image
        context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        context.restore();

        // Draw name text at bottom with Caveat font
        context.fillStyle = '#333333';
        context.font = `${fontSize}px Caveat, cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const textY = height - padding - (fontSize / 2);
        context.fillText(userName, width / 2, textY);

        // Download
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `polaroid-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
      };
      img.src = capturedImage;
    };
    paperTexture.src = 'https://images.unsplash.com/photo-1719563015025-83946fb49e49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBwYXBlciUyMHRleHR1cmV8ZW58MXx8fHwxNzY1MjYzNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
  };

  // Share to Instagram Story
  const shareToInstagram = async () => {
    if (!capturedImage) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    // Card specifications
    const width = 1750;
    const height = 2188;
    const padding = 145;
    const spacing = 58;
    const borderRadius = 16;
    const fontSize = 136;

    canvas.width = width;
    canvas.height = height;

    // White background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // Load paper texture
    const paperTexture = new Image();
    paperTexture.crossOrigin = 'anonymous';
    paperTexture.onload = () => {
      // Draw paper texture
      context.globalAlpha = 0.3;
      context.drawImage(paperTexture, 0, 0, width, height);
      context.globalAlpha = 1.0;

      // Load and draw captured image
      const img = new Image();
      img.onload = async () => {
        // Calculate dimensions
        const imageWidth = width - (padding * 2);
        const textAreaHeight = fontSize + spacing;
        const imageHeight = height - padding - textAreaHeight - padding;

        // Draw image container background with rounded corners
        context.save();
        context.beginPath();
        context.roundRect(padding, padding, imageWidth, imageHeight, borderRadius);
        context.clip();
        context.fillStyle = '#f3f4f6';
        context.fillRect(padding, padding, imageWidth, imageHeight);

        // Calculate aspect ratio to fill the container
        const imgAspect = img.width / img.height;
        const containerAspect = imageWidth / imageHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > containerAspect) {
          drawHeight = imageHeight;
          drawWidth = imageHeight * imgAspect;
          drawX = padding + (imageWidth - drawWidth) / 2;
          drawY = padding;
        } else {
          drawWidth = imageWidth;
          drawHeight = imageWidth / imgAspect;
          drawX = padding;
          drawY = padding + (imageHeight - drawHeight) / 2;
        }

        // Draw the image
        context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        context.restore();

        // Draw name text at bottom with Caveat font
        context.fillStyle = '#333333';
        context.font = `${fontSize}px Caveat, cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const textY = height - padding - (fontSize / 2);
        context.fillText(userName, width / 2, textY);

        // Convert to blob and share
        canvas.toBlob(async (blob) => {
          if (!blob) return;

          const file = new File([blob], `polaroid-${Date.now()}.png`, { type: 'image/png' });

          // Try Web Share API first (works great on mobile with Instagram app)
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'My Polaroid Memory',
                text: 'Check out my instant memory! 📸'
              });
              return; // Successfully opened share sheet
            } catch (error: any) {
              // User cancelled or error occurred
              if (error.name === 'AbortError') {
                return; // User cancelled, do nothing
              }
              console.log('Share failed:', error);
            }
          }

          // Fallback for browsers without Web Share API or on desktop
          // Download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `polaroid-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
      };
      img.src = capturedImage;
    };
    paperTexture.src = 'https://images.unsplash.com/photo-1719563015025-83946fb49e49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBwYXBlciUyMHRleHR1cmV8ZW58MXx8fHwxNzY1MjYzNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
  };

  // Reset
  const reset = () => {
    setCapturedImage(null);
    setState('idle');
    setShowAnimation(false);
    setShowFlash(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Effect to handle video stream updates
  useEffect(() => {
    if (stream && videoRef.current && state === 'camera') {
      videoRef.current.srcObject = stream;

      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (error) {
          console.error('Error auto-playing video:', error);
        }
      };

      playVideo();
    }
  }, [stream, state]);

  return (
    <div className={`min-h-screen ${state === 'idle' ? 'overflow-hidden' : 'overflow-auto'} bg-gradient-to-br from-red-50 via-green-50 to-red-100 relative flex flex-col`} style={{ paddingTop: '10vh' }}>
      {/* Snowfall Effect */}
      <Snowfall />

      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Content Container - Centered and Hug Contents */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`container mx-auto px-4 ${state === 'camera' || state === 'captured' ? 'py-12 md:py-16' : ''} flex flex-col items-center`}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 md:mb-8"
          >
            <div className="inline-block rounded-full bg-purple-100 border-2 border-purple-300 px-3 py-1 mb-3">
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '12px', color: '#000000' }}>
                🎄 Merry Christmas &amp; Happy New Year 2026 🎅
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl mb-1 text-gray-800" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700 }}>
              Instant Memory Maker
            </h1>
            <p className="text-gray-600 text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 300 }}>
              Capture your festive moment &amp; download or share instantly
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="flex flex-col items-center gap-8">
            {/* Camera Section */}
            {state === 'idle' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="relative cursor-pointer" onClick={() => startCamera()}>
                  <img
                    src={cameraImage}
                    alt="Polaroid Camera"
                    className="w-72 md:w-88 drop-shadow-2xl hover:scale-103 transition-transform"
                  />
                </div>

                {/* Instruction text */}
                <p
                  className="mt-3 text-gray-500"
                  style={{
                    fontFamily: 'Bricolage Grotesque, sans-serif',
                    fontWeight: 300,
                    fontSize: '12px'
                  }}
                >
                  tap on camera to capture
                </p>

                {permissionDenied && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
                    <p className="text-red-700 text-sm text-center">
                      Camera access denied. Please check your browser settings and grant camera permission.
                    </p>
                  </div>
                )}


              </motion.div>
            )}

            {/* Camera Preview */}
            {state === 'camera' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
              >
                <div className="bg-white p-4 rounded-3xl shadow-2xl">
                  <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/5' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
                    />

                    {/* Countdown Overlay */}
                    <AnimatePresence>
                      {countdown !== null && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
                        >
                          <div
                            className="text-white"
                            style={{
                              fontFamily: 'Bricolage Grotesque, sans-serif',
                              fontWeight: 700,
                              fontSize: '120px',
                              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                          >
                            {countdown}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={stopCamera}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={startCountdownAndCapture}
                    disabled={countdown !== null}
                    className="w-full mt-4 px-6 py-4 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#5e35b1' }}
                  >
                    {countdown !== null ? `Capturing in ${countdown}...` : 'Capture Photo'}
                  </button>
                  {isMobile && (
                    <button
                      onClick={switchCamera}
                      className="w-full mt-2 px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <SwitchCamera className="w-5 h-5" />
                      Switch Camera
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Captured State with Animation */}
            {state === 'captured' && (
              <div className="flex flex-col items-center w-full max-w-md relative">
                {/* Camera (stays visible) - positioned relatively */}
                <div className="relative z-30">
                  <div className="relative">
                    <img
                      src={cameraImage}
                      alt="Polaroid Camera"
                      className="w-80 md:w-88 drop-shadow-2xl relative z-30"
                    />
                    {/* Flash overlay on camera */}
                    <AnimatePresence>
                      {showFlash && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, times: [0, 0.3, 1] }}
                          className="absolute top-12 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-yellow-200 rounded-full blur-xl"
                          style={{ zIndex: 35 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Polaroid Print Animation - slides downward */}
                  <AnimatePresence>
                    {capturedImage && (
                      <motion.div
                        initial={{ y: -200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          duration: 2,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.3
                        }}
                        className="w-52 md:w-64 relative mt-[-50px] z-10 mx-auto"
                      >
                        {/* Polaroid Card */}
                        <div
                          ref={polaroidRef}
                          className="bg-white rounded-lg shadow-2xl relative overflow-hidden"
                          style={{ aspectRatio: '4/5', padding: '20px' }}
                        >
                          {/* Paper Texture Background */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundImage: 'url(https://images.unsplash.com/photo-1719563015025-83946fb49e49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBwYXBlciUyMHRleHR1cmV8ZW58MXx8fHwxNzY1MjYzNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              opacity: 0.3,
                              borderRadius: '6px'
                            }}
                          />

                          {/* Photo */}
                          <div
                            className="relative w-full bg-gray-100 overflow-hidden z-10"
                            style={{
                              height: 'calc(100% - 36px)', // 24px font + 12px spacing
                              marginBottom: '12px',
                              borderRadius: '6px'
                            }}
                          >
                            <img
                              src={capturedImage}
                              alt="Captured"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Name Input at Bottom */}
                          <input
                            ref={nameInputRef as any}
                            type="text"
                            value={userName}
                            onChange={handleNameChange}
                            className="w-full text-center bg-transparent outline-none relative"
                            style={{
                              fontFamily: 'Caveat, cursive',
                              fontSize: '24px',
                              color: '#1f2937',
                              border: 'none',
                              lineHeight: '1.5',
                              padding: '0',
                              margin: '0',
                              zIndex: 20,
                              WebkitAppearance: 'none',
                              appearance: 'none'
                            }}
                            onFocus={handleNameFocus}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Download Buttons - appear after card animation, below camera */}
                <AnimatePresence>
                  {capturedImage && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 2.3
                        }}
                        className="flex gap-3 mt-6 w-full max-w-sm px-4"
                      >
                        <button
                          onClick={downloadPolaroid}
                          className="flex-1 px-4 py-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 text-sm"
                          style={{ backgroundColor: '#5e35b1' }}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={reset}
                          className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
                        >
                          New Photo
                        </button>
                      </motion.div>

                      {/* Instagram Share Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 2.5
                        }}
                        className="w-full max-w-sm px-4 mt-3"
                      >
                        <button
                          onClick={shareToInstagram}
                          className="w-full px-4 py-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 text-sm"
                          style={{
                            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                          }}
                        >
                          <Instagram className="w-4 h-4" />
                          Share on Story
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Polaroid Gallery Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-6xl mx-auto px-4 mt-20 mb-12"
          >
            {/* Mobile: Hidden on mobile with display none */}
            <div className="md:hidden" style={{ display: 'none' }}>
              {/* Polaroid 1 - Tilted -22deg */}
              <motion.div
                animate={{ rotate: -22 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer absolute"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1749700332038-640b00de758c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NTIxNjY1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Lovely vibes
                </p>
              </motion.div>

              {/* Polaroid 2 - Tilted +22deg */}
              <motion.div
                animate={{ rotate: 22 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer absolute"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1723942699847-4d5dbe3cec16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW1tZXIlMjB2YWNhdGlvbiUyMGJlYWNofGVufDF8fHx8MTc2NTMwMzQxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Summer Days
                </p>
              </motion.div>

              {/* Polaroid 3 - Tilted -15deg */}
              <motion.div
                animate={{ rotate: -15 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer absolute"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1571234018566-1d3cc5d2991a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXR1bW4lMjBwb3J0cmFpdCUyMHdvbWFufGVufDF8fHx8MTc2NTMwMzQxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 3"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Autumn vibes
                </p>
              </motion.div>

              {/* Polaroid 4 - Tilted +18deg */}
              <motion.div
                animate={{ rotate: 18 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer absolute"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1763655396188-82015c2dab72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBmcmllbmRzJTIwc21pbGluZ3xlbnwxfHx8fDE3NjUzMDM0MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 4"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Little Snapshot
                </p>
              </motion.div>

              {/* Polaroid 5 - Tilted -10deg */}
              <motion.div
                animate={{ rotate: -10 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer absolute"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1709287253135-865c92751871?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwbmF0dXJlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1MzAzNDExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 5"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Moment in time
                </p>
              </motion.div>
            </div>

            {/* Desktop: Horizontal Row */}
            <div className="hidden md:flex md:flex-nowrap justify-center items-center gap-6 md:gap-8">
              {/* Polaroid 1 - Tilted -22deg */}
              <motion.div
                animate={{ rotate: -22 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1749700332038-640b00de758c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NTIxNjY1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Lovely vibes
                </p>
              </motion.div>

              {/* Polaroid 2 - Tilted +22deg */}
              <motion.div
                animate={{ rotate: 22 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1723942699847-4d5dbe3cec16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW1tZXIlMjB2YWNhdGlvbiUyMGJlYWNofGVufDF8fHx8MTc2NTMwMzQxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Summer Days
                </p>
              </motion.div>

              {/* Polaroid 3 - Tilted -15deg */}
              <motion.div
                animate={{ rotate: -15 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1571234018566-1d3cc5d2991a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXR1bW4lMjBwb3J0cmFpdCUyMHdvbWFufGVufDF8fHx8MTc2NTMwMzQxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 3"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Autumn vibes
                </p>
              </motion.div>

              {/* Polaroid 4 - Tilted +18deg */}
              <motion.div
                animate={{ rotate: 18 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1763655396188-82015c2dab72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBmcmllbmRzJTIwc21pbGluZ3xlbnwxfHx8fDE3NjUzMDM0MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 4"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Little Snapshot
                </p>
              </motion.div>

              {/* Polaroid 5 - Tilted -10deg */}
              <motion.div
                animate={{ rotate: -10 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-3 rounded-lg shadow-xl cursor-pointer"
                style={{
                  width: '200px',
                  aspectRatio: '4/5'
                }}
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden rounded-md"
                  style={{ height: 'calc(100% - 36px)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1709287253135-865c92751871?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwbmF0dXJlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1MzAzNDExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Captured moment 5"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-center mt-2"
                  style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '18px',
                    color: '#1f2937'
                  }}
                >
                  Moment in time
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer - Bottom Aligned with 24px margin */}
          <footer className="text-center m-6 mt-20">
            <p className="text-gray-600 mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {captureCount} {captureCount === 1 ? 'moment' : 'moments'} captured
            </p>
            <p className="text-gray-600" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Designed with <span className="text-purple-600">💜</span> | By{' '}
              <a
                href="https://siddart.net"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-800 transition-colors underline"
              >
                siddart.net
              </a>
            </p>
          </footer>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

    </div>
  );
}