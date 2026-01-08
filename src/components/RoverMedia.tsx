import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface RoverMediaProps {
  imageUrl?: string;
  animationUrl?: string;
  name: string;
  className?: string;
  showFallback?: boolean;
}

export const RoverMedia: React.FC<RoverMediaProps> = ({
  imageUrl,
  animationUrl,
  name,
  className,
  showFallback = true
}) => {
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determine the media URL - prefer animation_url for MP4s
  const videoUrl = animationUrl || (imageUrl?.endsWith('.mp4') ? imageUrl : null);
  const fallbackImage = imageUrl?.endsWith('.mp4') ? null : imageUrl;

  // If we have a working video URL
  if (videoUrl && !videoError) {
    return (
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className={cn('w-full h-full object-cover', className)}
        onError={() => {
          console.warn(`Video failed to load for ${name}:`, videoUrl);
          setVideoError(true);
        }}
      />
    );
  }

  // Fallback to static image
  if (fallbackImage && !imageError) {
    return (
      <img
        src={fallbackImage}
        alt={name}
        className={cn('w-full h-full object-cover', className)}
        onError={() => {
          console.warn(`Image failed to load for ${name}:`, fallbackImage);
          setImageError(true);
        }}
      />
    );
  }

  // Final fallback
  if (showFallback) {
    return (
      <div className={cn(
        'w-full h-full flex items-center justify-center bg-muted/20 text-muted-foreground font-terminal text-xs',
        className
      )}>
        [NO MEDIA]
      </div>
    );
  }

  return null;
};
