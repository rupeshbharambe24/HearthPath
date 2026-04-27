import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  relationshipId: string | null | undefined;
}

export default function BreakupReflectionModal({ open, onClose, relationshipId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hard, setHard] = useState('');
  const [learn, setLearn] = useState('');
  const [keep, setKeep] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user?.id || !relationshipId) {
      onClose();
      return;
    }
    const parts: string[] = [];
    if (hard.trim()) parts.push(`What was hard:\n${hard.trim()}`);
    if (learn.trim()) parts.push(`What I learned:\n${learn.trim()}`);
    if (keep.trim()) parts.push(`A memory I want to keep:\n${keep.trim()}`);
    if (parts.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('memories').insert({
        relationship_id: relationshipId,
        created_by: user.id,
        memo_text: parts.join('\n\n'),
        entry_type: 'reflection',
        visibility: 'private',
      });
      if (error) throw error;
      toast({ title: 'Reflection saved', description: 'Kept privately for you.' });
      setHard(''); setLearn(''); setKeep('');
      onClose();
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>A moment to reflect</DialogTitle>
          <DialogDescription>
            Endings are part of the path. Optional prompts you can keep
            privately for yourself.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="hard">What was hard?</Label>
            <Textarea id="hard" value={hard} onChange={(e) => setHard(e.target.value)} rows={2} />
          </div>
          <div>
            <Label htmlFor="learn">What did you learn?</Label>
            <Textarea id="learn" value={learn} onChange={(e) => setLearn(e.target.value)} rows={2} />
          </div>
          <div>
            <Label htmlFor="keep">One memory you&apos;ll keep.</Label>
            <Textarea id="keep" value={keep} onChange={(e) => setKeep(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Skip</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save reflection'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
