// src/components/AITransparencyPanel.tsx
import { useMemo } from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SummaryKind = 'monthly_recap' | 'milestone_summary' | 'memory_search';

interface Props {
  kind: SummaryKind;
  scope: 'private' | 'shared';
  /** True when scope='shared' AND ai_shared_recap_access is granted to both. */
  sharedConsentReady: boolean;
  isGenerating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FIELDS_BY_KIND: Record<SummaryKind, string[]> = {
  monthly_recap: [
    'Memories from the last 30 days (text, type, mood, date)',
    'Weekly check-ins from the last 30 days (rating, note, gratitude)',
  ],
  milestone_summary: [
    'All memories where entry_type = milestone (text, mood, date)',
    'Current relationship stage number',
  ],
  memory_search: [
    'Your search query',
    'Up to 25 memories that match the query keywords (text, type, mood, date)',
  ],
};

const NEVER_SEEN = [
  'Your real name or your partner\'s real name',
  'Chat messages',
  'Profile photos',
  'Email, phone, or contact info',
  'Location data',
  'Memories or check-ins outside the window above',
];

export default function AITransparencyPanel({
  kind,
  scope,
  sharedConsentReady,
  isGenerating,
  onConfirm,
  onCancel,
}: Props) {
  const fields = useMemo(() => FIELDS_BY_KIND[kind], [kind]);
  const blocked = scope === 'shared' && !sharedConsentReady;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          What the AI will see
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Will be sent</div>
          <ul className="list-disc list-inside text-sm space-y-0.5">
            {fields.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Never sent</div>
          <ul className="list-disc list-inside text-sm space-y-0.5 opacity-80">
            {NEVER_SEEN.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        {scope === 'shared' && (
          <div className="text-xs text-muted-foreground border-l-2 pl-3 border-romantic-red/40">
            Shared mode also requires <code>ai_shared_recap_access</code> granted by both partners (stage 5+).
          </div>
        )}
        {blocked && (
          <div className="text-sm text-amber-600 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5" />
            Shared AI access is not yet granted by both partners. Switch to private, or grant the permission first.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={isGenerating}>Cancel</Button>
          <Button onClick={onConfirm} disabled={blocked || isGenerating}>
            {isGenerating ? 'Generating…' : 'Generate summary'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
