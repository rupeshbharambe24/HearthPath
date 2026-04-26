// src/components/SelfieCapture.tsx
import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Phase = 'idle' | 'streaming' | 'preview';

interface Props {
  onSubmit: (blob: Blob, mimeType: string) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function SelfieCapture({ onSubmit, onCancel, isSubmitting }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    blobRef.current = null;
  }

  useEffect(() => {
    return () => {
      cleanupStream();
      clearPreview();
    };
  }, []);

  async function start() {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('streaming');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Camera access denied');
    }
  }

  async function snapshot() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      c.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
    );
    if (!blob) return;
    blobRef.current = blob;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    cleanupStream();
    setPhase('preview');
  }

  function retake() {
    clearPreview();
    setPhase('idle');
    void start();
  }

  function cancel() {
    cleanupStream();
    clearPreview();
    setPhase('idle');
    onCancel?.();
  }

  async function send() {
    if (!blobRef.current) return;
    await onSubmit(blobRef.current, blobRef.current.type || 'image/jpeg');
    clearPreview();
    setPhase('idle');
  }

  if (phase === 'idle') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          We'll capture a quick selfie. An admin will compare it to your student ID
          to confirm it's really you. Your face is never shared with other users.
        </p>
        <Button onClick={start}>
          <Camera className="h-4 w-4 mr-2" /> Start camera
        </Button>
        {errorMessage && <p className="text-xs text-amber-600">{errorMessage}</p>}
      </div>
    );
  }

  if (phase === 'streaming') {
    return (
      <div className="space-y-3">
        <video
          ref={videoRef}
          className="rounded-md w-full max-w-md mx-auto bg-black"
          playsInline
          muted
          autoPlay
        />
        <div className="flex justify-center gap-2">
          <Button onClick={snapshot}>
            <Square className="h-4 w-4 mr-2" /> Capture
          </Button>
          <Button variant="ghost" onClick={cancel}>Cancel</Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // preview
  return (
    <div className="space-y-3">
      {previewUrl && (
        <img src={previewUrl} alt="Selfie preview" className="rounded-md w-full max-w-md mx-auto" />
      )}
      <div className="flex justify-center gap-2">
        <Button variant="ghost" onClick={retake} disabled={isSubmitting}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retake
        </Button>
        <Button onClick={() => { void send(); }} disabled={isSubmitting}>
          <Send className="h-4 w-4 mr-2" /> {isSubmitting ? 'Submitting…' : 'Submit'}
        </Button>
        <Button variant="ghost" onClick={cancel} disabled={isSubmitting}>Cancel</Button>
      </div>
    </div>
  );
}
