import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type EmailFrequency = 'off' | 'immediate' | 'daily' | 'weekly';

interface Preferences {
  email_frequency?: EmailFrequency;
  in_app_toasts?: boolean;
  quiet_hours?: { start: string; end: string } | null;
}

const DEFAULT: Required<Pick<Preferences, 'email_frequency' | 'in_app_toasts'>> & { quiet_hours: Preferences['quiet_hours'] } = {
  email_frequency: 'daily',
  in_app_toasts: true,
  quiet_hours: null,
};

export default function NotificationPreferencesCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<typeof DEFAULT>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const stored = (data?.notification_preferences ?? {}) as Preferences;
      setPrefs({ ...DEFAULT, ...stored });
      setQuietEnabled(Boolean(stored.quiet_hours));
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function persist(next: typeof DEFAULT) {
    if (!user?.id) return;
    setPrefs(next);
    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: next })
      .eq('id', user.id);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Control how HeartPath reaches you. Email digests are not yet active —
          your preference is stored and will be honoured when the worker ships.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Email frequency</Label>
          <RadioGroup
            value={prefs.email_frequency}
            onValueChange={(v) => void persist({ ...prefs, email_frequency: v as EmailFrequency })}
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="immediate" id="ef-imm" /><Label htmlFor="ef-imm" className="cursor-pointer">Immediate — every event</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="daily" id="ef-daily" /><Label htmlFor="ef-daily" className="cursor-pointer">Daily digest</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="weekly" id="ef-weekly" /><Label htmlFor="ef-weekly" className="cursor-pointer">Weekly digest</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="off" id="ef-off" /><Label htmlFor="ef-off" className="cursor-pointer">Off</Label></div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="iat" className="block">In-app toasts</Label>
            <p className="text-xs text-muted-foreground">Pop-up confirmations when something happens in the app.</p>
          </div>
          <Switch
            id="iat"
            checked={prefs.in_app_toasts ?? true}
            onCheckedChange={(checked) => void persist({ ...prefs, in_app_toasts: checked })}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="qh" className="block">Quiet hours</Label>
              <p className="text-xs text-muted-foreground">No emails or push during this window (in-app behaviour unchanged).</p>
            </div>
            <Switch
              id="qh"
              checked={quietEnabled}
              onCheckedChange={(checked) => {
                setQuietEnabled(checked);
                void persist({
                  ...prefs,
                  quiet_hours: checked ? (prefs.quiet_hours ?? { start: '22:00', end: '07:00' }) : null,
                });
              }}
            />
          </div>
          {quietEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qhs" className="text-xs">Start</Label>
                <Input id="qhs" type="time" value={prefs.quiet_hours?.start ?? '22:00'}
                  onChange={(e) => void persist({ ...prefs, quiet_hours: { start: e.target.value, end: prefs.quiet_hours?.end ?? '07:00' } })}
                />
              </div>
              <div>
                <Label htmlFor="qhe" className="text-xs">End</Label>
                <Input id="qhe" type="time" value={prefs.quiet_hours?.end ?? '07:00'}
                  onChange={(e) => void persist({ ...prefs, quiet_hours: { start: prefs.quiet_hours?.start ?? '22:00', end: e.target.value } })}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
