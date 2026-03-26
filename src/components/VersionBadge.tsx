import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const VersionBadge: React.FC = () => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('version_history')
          .select('version_number')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (mounted) setVersion((data as any)?.version_number || '');
      } catch {
        if (mounted) setVersion('');
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (!version) return null;

  return (
    <span className="px-2 py-0.5 bg-roloil-light-gray text-white rounded">{version}</span>
  );
};

export default VersionBadge;
