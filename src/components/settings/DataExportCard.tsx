import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function DataExportCard() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
        ?? import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/export-user-data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heartpath-export-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export downloaded', description: 'Your data is in your downloads folder.' });
    } catch (err) {
      toast({ title: 'Export failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data export</CardTitle>
        <CardDescription>
          Download a JSON copy of everything HeartPath has on you — your
          profile, memories, check-ins, messages, notifications, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={download} disabled={downloading}>
          <Download className="h-4 w-4 mr-2" /> {downloading ? 'Preparing…' : 'Download my data'}
        </Button>
      </CardContent>
    </Card>
  );
}
