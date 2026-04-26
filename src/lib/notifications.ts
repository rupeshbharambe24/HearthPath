import type { Notification } from '@/hooks/useNotifications';

type Renderer = {
  icon: 'heart' | 'check' | 'pause' | 'lock' | 'message' | 'mail' | 'shield' | 'arrow';
  title: string;
  body: string;
  href?: string;
};

export function renderNotification(n: Notification): Renderer {
  const payload = (n.payload ?? {}) as Record<string, unknown>;
  const relId =
    (payload.relationship_id as string | undefined) ?? n.related_id ?? undefined;
  const interactiveHref = relId ? `/interactive?rel=${relId}` : '/interactive';
  switch (n.kind) {
    case 'stage_requested':
      return {
        icon: 'arrow',
        title: 'New stage request',
        body: `Your partner wants to move to stage ${payload.requested_stage ?? '—'}.`,
        href: interactiveHref,
      };
    case 'stage_accepted':
      return {
        icon: 'check',
        title: 'Stage advance accepted',
        body: `You're now at stage ${payload.new_stage ?? '—'}.`,
        href: interactiveHref,
      };
    case 'stage_declined':
      return {
        icon: 'pause',
        title: 'Stage request declined',
        body: 'Your partner needs more time. Cooldown is 7 days.',
        href: interactiveHref,
      };
    case 'stage_deferred':
      return {
        icon: 'pause',
        title: 'Stage request deferred',
        body: 'Your partner asked to revisit this later.',
        href: interactiveHref,
      };
    case 'permission_granted':
      return {
        icon: 'lock',
        title: 'New permission granted',
        body: `You now have access to ${humanPerm(
          payload.permission as string | undefined
        )}.`,
        href: interactiveHref,
      };
    case 'permission_revoked':
      return {
        icon: 'lock',
        title: 'Permission revoked',
        body: `${humanPerm(
          payload.permission as string | undefined
        )} access has ended.`,
        href: interactiveHref,
      };
    case 'heart_received':
      return {
        icon: 'heart',
        title: 'Heart received',
        body: 'Your partner sent you a heart.',
        href: interactiveHref,
      };
    case 'message_received':
      return {
        icon: 'message',
        title: 'New message',
        body: String(payload.preview ?? 'A new message is waiting.'),
        href: '/chat',
      };
    case 'invitation_received':
      return {
        icon: 'mail',
        title: 'Invitation received',
        body: 'Someone sent you a HeartPath invitation.',
        href: interactiveHref,
      };
    case 'invitation_accepted':
      return {
        icon: 'check',
        title: 'Invitation accepted',
        body: 'Your invitation was accepted. Stage 1 is now open.',
        href: interactiveHref,
      };
    case 'invitation_declined':
      return {
        icon: 'pause',
        title: 'Invitation declined',
        body: 'Your invitation was declined.',
      };
    case 'breakup_initiated':
      return {
        icon: 'shield',
        title: 'Relationship ended',
        body: 'Your partner ended the relationship. A 7-day cooldown is active.',
        href: '/settings',
      };
    default:
      return {
        icon: 'mail',
        title: 'Notification',
        body: 'You have a new notification.',
      };
  }
}

function humanPerm(key: string | undefined): string {
  switch (key) {
    case 'voice_notes':
      return 'voice notes';
    case 'deeper_profile_details':
      return 'deeper profile details';
    case 'private_photo_gallery':
      return 'the private photo gallery';
    case 'shared_memory_vault':
      return 'the shared memory vault';
    case 'full_face_photo':
      return 'the full-face photo';
    case 'ai_shared_recap_access':
      return 'shared AI recaps';
    default:
      return 'a permission';
  }
}
