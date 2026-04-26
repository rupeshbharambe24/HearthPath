import { Paperclip } from 'lucide-react';
import { useSignedMemoryAttachment } from '@/hooks/useSignedMemoryAttachment';

interface Props {
  memoryId: string;
  attachmentUrl: string | null;
  attachmentType: 'image' | 'audio' | 'pdf' | null;
}

export default function MemoryAttachment({ memoryId, attachmentUrl, attachmentType }: Props) {
  const { data, isLoading, error } = useSignedMemoryAttachment(
    memoryId,
    Boolean(attachmentUrl)
  );
  if (!attachmentUrl) return null;
  if (isLoading) return <div className="h-12 bg-muted/30 rounded animate-pulse" />;
  if (error || !data) {
    return (
      <div className="text-xs text-muted-foreground italic">
        (attachment unavailable)
      </div>
    );
  }

  const type = attachmentType ?? data.attachment_type;
  if (type === 'image') {
    return (
      <a href={data.url} target="_blank" rel="noreferrer">
        <img
          src={data.url}
          alt=""
          loading="lazy"
          className="rounded max-h-64 object-cover"
        />
      </a>
    );
  }
  if (type === 'audio') {
    return <audio controls src={data.url} className="w-full max-w-sm" />;
  }
  if (type === 'pdf') {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm underline"
      >
        <Paperclip className="h-3 w-3" /> PDF attachment
      </a>
    );
  }
  return null;
}
