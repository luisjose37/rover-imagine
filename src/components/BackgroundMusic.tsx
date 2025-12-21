import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const BackgroundMusic = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/audio/ambient-suspense.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15; // Faint volume

    // Try to autoplay (will likely be blocked by browser)
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      })
      .catch(() => {
        // Autoplay blocked, user needs to interact
        setIsPlaying(false);
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted || !isPlaying) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(console.error);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-4 right-4 z-50 p-3 border border-primary/50 bg-background/80 backdrop-blur-sm hover:bg-primary/10 transition-colors group"
      title={isMuted ? 'Enable music' : 'Mute music'}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-primary/70 group-hover:text-primary" />
      ) : (
        <Volume2 className="w-5 h-5 text-primary animate-pulse" />
      )}
      <span className="sr-only">{isMuted ? 'Enable music' : 'Mute music'}</span>
    </button>
  );
};
