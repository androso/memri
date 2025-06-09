import { useEffect, useRef } from 'react';

export function useNotificationSound() {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  const playWarningSound = () => {
    if (!audioContext.current) return;

    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      // Create a gentle warning tone
      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.current.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.3);

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.3);
    } catch (error) {
      console.log('Audio notification not available:', error);
    }
  };

  return { playWarningSound };
}
