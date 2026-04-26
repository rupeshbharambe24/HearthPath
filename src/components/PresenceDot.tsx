type Props = { online: boolean };

export default function PresenceDot({ online }: Props) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        online ? 'bg-green-500' : 'bg-muted-foreground/40'
      }`}
      aria-label={online ? 'Online' : 'Offline'}
    />
  );
}
