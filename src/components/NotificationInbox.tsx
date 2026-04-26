import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  Check,
  Pause,
  Lock,
  MessageSquare,
  Mail,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  type Notification,
} from '@/hooks/useNotifications';
import { renderNotification } from '@/lib/notifications';

const ICONS = {
  heart: Heart,
  check: Check,
  pause: Pause,
  lock: Lock,
  message: MessageSquare,
  mail: Mail,
  shield: Shield,
  arrow: ArrowUpRight,
} as const;

export default function NotificationInbox() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="font-medium">Notifications</div>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => markAllRead()}>
            Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-[420px]">
        {isLoading && (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">
            You're all caught up.
          </div>
        )}
        {notifications.map((n) => (
          <Row key={n.id} n={n} markRead={markRead} dismiss={dismiss} />
        ))}
      </ScrollArea>
    </div>
  );
}

function Row({
  n,
  markRead,
  dismiss,
}: {
  n: Notification;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}) {
  const r = renderNotification(n);
  const Icon = ICONS[r.icon];
  const body = (
    <div
      className={`px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition cursor-pointer ${
        n.read_at ? 'opacity-70' : ''
      }`}
      onClick={() => {
        if (!n.read_at) markRead(n.id);
      }}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-sm font-medium">{r.title}</div>
          <div className="text-xs text-muted-foreground">{r.body}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            dismiss(n.id);
          }}
          aria-label="Dismiss"
        >
          ×
        </Button>
      </div>
    </div>
  );
  return r.href ? <Link to={r.href}>{body}</Link> : body;
}
