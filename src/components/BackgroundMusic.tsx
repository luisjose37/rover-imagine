import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const BackgroundMusic = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/audio/ambient-suspense.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15;

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      })
      .catch(() => {
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
      className="win95-button !p-1 !min-w-0 flex items-center gap-1 text-[11px]"
      title={isMuted ? 'Enable music' : 'Mute music'}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-foreground" />
      ) : (
        <Volume2 className="w-4 h-4 text-foreground" />
      )}
      <span className="hidden sm:inline">Sound</span>
    </button>
  );
};
