// src/components/VoiceRecorder.tsx
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Send, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  /** Called when the user confirms send. Parent handles the upload. */
  onSend: (blob: Blob, mimeType: string, durationMs: number) => Promise<void>;
  /** Called when the user cancels — parent should clear any "sending" state. */
  onCancel?: () => void;
  /** External "is uploading" flag from parent so we disable controls. */
  isSending?: boolean;
}

const MAX_MS = 60 * 1000;

type Phase = 'idle' | 'recording' | 'preview';

export default function VoiceRecorder({ onSend, onCancel, isSending }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      cleanupStream();
    };
  }, []);

  async function start() {
    setErrorMessage(null);
    chunksRef.current = [];
    blobRef.current = null;
    setElapsedMs(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        blobRef.current = blob;
        cleanupStream();
        setPhase('preview');
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setPhase('recording');
      tickRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (elapsed >= MAX_MS) stop();
      }, 200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Microphone access denied');
      setPhase('idle');
    }
  }

  function stop() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }

  function discard() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    cleanupStream();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    chunksRef.current = [];
    blobRef.current = null;
    setElapsedMs(0);
    setPhase('idle');
    onCancel?.();
  }

  async function send() {
    if (!blobRef.current) return;
    await onSend(blobRef.current, blobRef.current.type || 'audio/webm', elapsedMs);
    chunksRef.current = [];
    blobRef.current = null;
    setElapsedMs(0);
    setPhase('idle');
  }

  if (phase === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={start} aria-label="Record voice note">
          <Mic className="h-4 w-4" />
        </Button>
        {errorMessage && (
          <span className="text-xs text-amber-600">{errorMessage}</span>
        )}
      </div>
    );
  }

  if (phase === 'recording') {
    const remaining = Math.max(0, Math.ceil((MAX_MS - elapsedMs) / 1000));
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          {formatDuration(elapsedMs)}
        </span>
        <span className="text-[10px] text-muted-foreground">{remaining}s left</span>
        <Button variant="ghost" size="icon" onClick={stop} aria-label="Stop recording">
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={discard} aria-label="Discard recording">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // preview
  return (
    <div className="flex items-center gap-2">
      {blobRef.current && <PreviewPlayer blob={blobRef.current} />}
      <span className="text-xs text-muted-foreground">{formatDuration(elapsedMs)}</span>
      <Button variant="ghost" size="icon" onClick={discard} disabled={isSending} aria-label="Discard">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button variant="default" size="icon" onClick={() => { void send(); }} disabled={isSending} aria-label="Send voice note">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PreviewPlayer({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return (
    <>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (!audioRef.current) return;
          if (playing) {
            audioRef.current.pause();
            setPlaying(false);
          } else {
            void audioRef.current.play();
            setPlaying(true);
          }
        }}
        aria-label={playing ? 'Pause preview' : 'Play preview'}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </>
  );
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
