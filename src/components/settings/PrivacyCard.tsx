import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function PrivacyCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discoverable, setDiscoverable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase.from('users').select('discoverable').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      setDiscoverable(data?.discoverable ?? true);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function toggle(checked: boolean) {
    setDiscoverable(checked);
    if (!user?.id) return;
    const { error } = await supabase.from('users').update({ discoverable: checked }).eq('id', user.id);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>Control how others find you on HeartPath.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="disc" className="block">Discoverable in Explore</Label>
            <p className="text-xs text-muted-foreground mt-1">
              When off, you won&apos;t appear in anyone&apos;s discovery feed.
              Active relationships are unaffected.
            </p>
          </div>
          <Switch id="disc" checked={discoverable} onCheckedChange={toggle} />
        </div>
      </CardContent>
    </Card>
  );
}
