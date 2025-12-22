import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalInput } from './TerminalInput';
import { TerminalButton } from './TerminalButton';
import { ASCIILoader, ASCIIDivider } from './ASCIIElements';
import { cn } from '@/lib/utils';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Play, Pause, Download, Volume2, Music } from 'lucide-react';

interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  description?: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  opensea_url?: string;
}

interface MusicTrack {
  id: string;
  name: string;
  category: 'action' | 'suspense' | 'epic' | 'ambient';
  file: string;
  description: string;
}

const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'cinematic-action', name: 'Cinematic Action', category: 'action', file: '/audio/cinematic-action.mp3', description: 'Explosive orchestral hits' },
  { id: 'epic-battle', name: 'Epic Battle', category: 'epic', file: '/audio/epic-battle.mp3', description: 'Dramatic battle theme' },
  { id: 'dark-tension', name: 'Dark Tension', category: 'suspense', file: '/audio/dark-tension.mp3', description: 'Ominous atmospheric build' },
  { id: 'cyber-pulse', name: 'Cyber Pulse', category: 'action', file: '/audio/cyber-pulse.mp3', description: 'Electronic cyberpunk beats' },
  { id: 'dystopian-future', name: 'Dystopian Future', category: 'ambient', file: '/audio/dystopian-future.mp3', description: 'Post-apocalyptic ambience' },
  { id: 'dramatic-intro', name: 'Dramatic Intro', category: 'epic', file: '/audio/dramatic-intro.mp3', description: 'Powerful opening theme' },
  { id: 'intense-suspense', name: 'Intense Suspense', category: 'suspense', file: '/audio/intense-suspense.mp3', description: 'Heart-pounding tension' },
  { id: 'action-trailer', name: 'Action Trailer', category: 'action', file: '/audio/action-trailer.mp3', description: 'High-energy trailer music' },
  { id: 'war-drums', name: 'War Drums', category: 'epic', file: '/audio/war-drums.mp3', description: 'Tribal percussion power' },
  { id: 'heroic-rise', name: 'Heroic Rise', category: 'epic', file: '/audio/heroic-rise.mp3', description: 'Triumphant orchestral rise' },
  { id: 'sci-fi-ambience', name: 'Sci-Fi Ambience', category: 'ambient', file: '/audio/sci-fi-ambience.mp3', description: 'Futuristic atmospheric sounds' },
  { id: 'tension-build', name: 'Tension Build', category: 'suspense', file: '/audio/tension-build.mp3', description: 'Escalating suspense' },
];

const CATEGORY_COLORS: Record<string, string> = {
  action: 'text-red-400 border-red-400/50',
  suspense: 'text-purple-400 border-purple-400/50',
  epic: 'text-yellow-400 border-yellow-400/50',
  ambient: 'text-cyan-400 border-cyan-400/50',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const MusicTool = () => {
  const { toast } = useToast();
  const [tokenId, setTokenId] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(Math.round(progress * 100));
      });

      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        toast({
          title: "FFMPEG ERROR",
          description: "Video export may not be available",
          variant: "destructive"
        });
      }
    };

    loadFFmpeg();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchNFT = async () => {
    if (!tokenId.trim()) {
      toast({ title: "INPUT REQUIRED", description: "Please enter a token ID", variant: "destructive" });
      return;
    }
    
    setIsLoadingNFT(true);
    setSelectedNFT(null);
    setSelectedTrack(null);
    stopPreview();
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId.trim() })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Check if it's a video
      if (!data.image_url?.endsWith('.mp4')) {
        toast({ 
          title: "NOT A VIDEO ROVER", 
          description: "This rover doesn't have an MP4 file. Only video rovers are supported.", 
          variant: "destructive" 
        });
        setIsLoadingNFT(false);
        return;
      }
      
      setSelectedNFT(data);
      toast({ title: "ROVER LOCATED", description: `${data.name} loaded - MP4 detected` });
    } catch (error) {
      toast({ title: "SCAN FAILED", description: error instanceof Error ? error.message : "Failed to locate rover", variant: "destructive" });
    } finally {
      setIsLoadingNFT(false);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const togglePreview = (track: MusicTrack) => {
    if (selectedTrack?.id === track.id && isPlaying) {
      stopPreview();
      return;
    }

    stopPreview();
    setSelectedTrack(track);
    
    const audio = new Audio(track.file);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.error('Audio play failed:', err);
        toast({ title: "AUDIO ERROR", description: "Failed to play preview", variant: "destructive" });
      });
  };

  const selectTrack = (track: MusicTrack) => {
    if (selectedTrack?.id !== track.id) {
      stopPreview();
    }
    setSelectedTrack(track);
  };

  const exportWithMusic = async () => {
    if (!selectedNFT || !selectedTrack || !ffmpegRef.current || !ffmpegLoaded) {
      toast({ title: "EXPORT ERROR", description: "Missing video, music, or FFmpeg not ready", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    stopPreview();

    try {
      const ffmpeg = ffmpegRef.current;

      // Fetch video and audio files
      toast({ title: "DOWNLOADING ASSETS", description: "Fetching video and audio files..." });
      
      const videoData = await fetchFile(selectedNFT.image_url);
      const audioData = await fetchFile(selectedTrack.file);

      // Write files to FFmpeg filesystem
      await ffmpeg.writeFile('input.mp4', videoData);
      await ffmpeg.writeFile('audio.mp3', audioData);

      toast({ title: "PROCESSING", description: "Merging video with audio..." });

      // Get video duration first, then loop audio to match
      // Merge video with audio (loop audio to match video length, replace original audio)
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'audio.mp3',
        '-filter_complex', '[1:a]aloop=loop=-1:size=2e+09[aout]',
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        '-y',
        'output.mp4'
      ]);

      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      // Convert to proper buffer for Blob
      const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
      const blob = new Blob([new Uint8Array(uint8Array)], { type: 'video/mp4' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedNFT.name.replace(/\s+/g, '-')}-${selectedTrack.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Cleanup FFmpeg filesystem
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('audio.mp3');
      await ffmpeg.deleteFile('output.mp4');

      toast({ title: "EXPORT COMPLETE", description: "Your rover video with music has been downloaded!" });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: "EXPORT FAILED", description: error instanceof Error ? error.message : "Unknown error occurred", variant: "destructive" });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const filteredTracks = categoryFilter 
    ? MUSIC_TRACKS.filter(t => t.category === categoryFilter)
    : MUSIC_TRACKS;

  const resetSearch = () => {
    setTokenId('');
    setSelectedNFT(null);
    setSelectedTrack(null);
    stopPreview();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Token ID Input */}
      <div className="max-w-2xl mx-auto">
        <div className="text-primary font-terminal text-base md:text-lg mb-4 text-glow text-center">
          {">"} ENTER ROVER TOKEN ID
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end justify-center">
          <TerminalInput 
            label="TOKEN ID" 
            value={tokenId} 
            onChange={setTokenId} 
            placeholder="e.g., 1234" 
            onSubmit={fetchNFT} 
            disabled={isLoadingNFT} 
          />
          <TerminalButton onClick={fetchNFT} disabled={isLoadingNFT || !tokenId.trim()} variant="primary" className="w-full sm:w-auto">
            {isLoadingNFT ? 'SCANNING...' : 'LOCATE ROVER'}
          </TerminalButton>
        </div>
        <div className="text-center text-muted-foreground font-terminal text-sm mt-4">
          Only rovers with MP4 video files are supported
        </div>
      </div>

      {isLoadingNFT && <ASCIILoader text="LOCATING ROVER" />}

      {selectedNFT && !isLoadingNFT && (
        <>
          <ASCIIDivider />
          
          {/* Rover Display */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Video Preview */}
            <div className="space-y-4">
              <div className="text-primary font-terminal text-sm text-glow">{">"} ROVER VIDEO</div>
              <div className="relative border border-primary overflow-hidden aspect-square">
                <video 
                  ref={videoRef}
                  src={selectedNFT.image_url} 
                  autoPlay 
                  loop 
                  muted={!isPlaying}
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {isPlaying && selectedTrack && (
                  <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm border border-primary/50 px-3 py-2">
                    <div className="flex items-center gap-2 text-primary font-terminal text-xs">
                      <Music className="w-3 h-3 animate-pulse" />
                      <span>NOW PLAYING: {selectedTrack.name}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-primary text-glow font-terminal text-lg">{selectedNFT.name}</div>
                <div className="text-muted-foreground font-terminal text-xs mt-1">TOKEN ID: {selectedNFT.identifier}</div>
              </div>
            </div>

            {/* Music Selection */}
            <div className="space-y-4">
              <div className="text-primary font-terminal text-sm text-glow">{">"} SELECT MUSIC</div>
              
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={cn(
                    "px-3 py-1 border font-terminal text-xs transition-all",
                    !categoryFilter 
                      ? "border-primary text-primary bg-primary/10" 
                      : "border-primary/30 text-muted-foreground hover:border-primary/50"
                  )}
                >
                  ALL
                </button>
                {['action', 'suspense', 'epic', 'ambient'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1 border font-terminal text-xs transition-all uppercase",
                      categoryFilter === cat 
                        ? `${CATEGORY_COLORS[cat]} bg-primary/10` 
                        : "border-primary/30 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Track List */}
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-primary/30">
                {filteredTracks.map(track => (
                  <div
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={cn(
                      "border p-3 cursor-pointer transition-all group",
                      selectedTrack?.id === track.id
                        ? "border-primary bg-primary/10"
                        : "border-primary/30 hover:border-primary/50 bg-background/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-terminal uppercase px-1.5 py-0.5 border", CATEGORY_COLORS[track.category])}>
                            {track.category}
                          </span>
                          <span className="text-primary font-terminal text-sm truncate">{track.name}</span>
                        </div>
                        <div className="text-muted-foreground font-terminal text-xs mt-1 truncate">
                          {track.description}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreview(track);
                        }}
                        className={cn(
                          "p-2 border transition-all flex-shrink-0",
                          selectedTrack?.id === track.id && isPlaying
                            ? "border-primary text-primary bg-primary/20"
                            : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
                        )}
                      >
                        {selectedTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ASCIIDivider />

          {/* Export Section */}
          <div className="text-center space-y-4">
            {selectedTrack && (
              <div className="inline-block border border-primary/50 bg-primary/5 px-4 py-2">
                <div className="text-muted-foreground font-terminal text-xs">SELECTED TRACK</div>
                <div className="text-primary font-terminal text-lg text-glow flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  {selectedTrack.name}
                </div>
              </div>
            )}

            {isExporting && (
              <div className="max-w-md mx-auto space-y-2">
                <div className="text-primary font-terminal text-sm animate-pulse">
                  PROCESSING VIDEO... {exportProgress}%
                </div>
                <div className="w-full h-2 border border-primary/50 bg-background">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <TerminalButton
                onClick={exportWithMusic}
                disabled={!selectedTrack || !ffmpegLoaded || isExporting}
                variant="primary"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'EXPORTING...' : 'EXPORT MP4 WITH MUSIC'}
              </TerminalButton>
              <TerminalButton onClick={stopPreview} disabled={!isPlaying} variant="secondary">
                STOP PREVIEW
              </TerminalButton>
              <TerminalButton onClick={resetSearch} variant="secondary" disabled={isExporting}>
                NEW SEARCH
              </TerminalButton>
            </div>

            {!ffmpegLoaded && (
              <div className="text-yellow-400 font-terminal text-xs">
                ⚠ FFmpeg is loading... Export will be available shortly.
              </div>
            )}
          </div>
        </>
      )}

      {!selectedNFT && !isLoadingNFT && (
        <div className="p-8 text-center">
          <div className="text-muted-foreground font-terminal">
            {">"} ENTER A TOKEN ID TO ADD MUSIC TO YOUR ROVER VIDEO...
          </div>
        </div>
      )}
    </div>
  );
};
