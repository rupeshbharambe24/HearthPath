import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type DiscoveryMode = 'friendship_first' | 'slow_burn' | 'serious_only' | 'same_campus';
type PaceStyle = 'gentle' | 'steady' | 'deepening';
type CommStyle = 'thoughtful' | 'balanced' | 'expressive';

const MODE_LABELS: Record<DiscoveryMode, { title: string; help: string }> = {
  friendship_first: { title: 'Friendship first', help: 'Prioritize matches looking for friendship.' },
  slow_burn: { title: 'Slow burn', help: 'Open to friendship and romance, building gradually.' },
  serious_only: { title: 'Serious relationship', help: 'Match only with intent for committed relationships.' },
  same_campus: { title: 'Same campus', help: 'Restrict to your own college campus.' },
};

export default function DiscoveryPreferencesCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<DiscoveryMode | ''>('');
  const [paceStyle, setPaceStyle] = useState<PaceStyle | ''>('');
  const [commStyle, setCommStyle] = useState<CommStyle | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('discovery_mode, pace_style, communication_style')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setMode((data?.discovery_mode as DiscoveryMode) ?? '');
      setPaceStyle((data?.pace_style as PaceStyle) ?? '');
      setCommStyle((data?.communication_style as CommStyle) ?? '');
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function save(field: 'discovery_mode' | 'pace_style' | 'communication_style', value: string) {
    if (!user?.id) return;
    const { error } = await supabase.from('users').update({ [field]: value }).eq('id', user.id);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    }
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discovery preferences</CardTitle>
        <CardDescription>
          Set how HeartPath surfaces matches for you. Changes save automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Discovery mode</Label>
          <Select value={mode} onValueChange={(v) => { setMode(v as DiscoveryMode); void save('discovery_mode', v); }}>
            <SelectTrigger><SelectValue placeholder="Choose a mode" /></SelectTrigger>
            <SelectContent>
              {(Object.entries(MODE_LABELS) as [DiscoveryMode, { title: string; help: string }][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  <div className="flex flex-col">
                    <span className="font-medium">{v.title}</span>
                    <span className="text-xs text-muted-foreground">{v.help}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pace</Label>
          <Select value={paceStyle} onValueChange={(v) => { setPaceStyle(v as PaceStyle); void save('pace_style', v); }}>
            <SelectTrigger><SelectValue placeholder="Choose a pace" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gentle">Gentle — small steps, lots of patience</SelectItem>
              <SelectItem value="steady">Steady — measured progression</SelectItem>
              <SelectItem value="deepening">Deepening — open to going further faster</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Communication style</Label>
          <Select value={commStyle} onValueChange={(v) => { setCommStyle(v as CommStyle); void save('communication_style', v); }}>
            <SelectTrigger><SelectValue placeholder="Choose a style" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="thoughtful">Thoughtful — reflective, in-depth</SelectItem>
              <SelectItem value="balanced">Balanced — mix of light and deep</SelectItem>
              <SelectItem value="expressive">Expressive — open and vivid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
