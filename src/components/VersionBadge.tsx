import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const VersionBadge: React.FC = () => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Legge la versione marcata is_current, non "la piu' recente per data":
        // cosi' un retrodatato non sposta il badge. Il trigger
        // version_history_enforce_single_current garantisce che ce ne sia una sola.
        const { data, error } = await supabase
          .from('version_history')
          .select('version_number')
          .eq('is_current', true)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (mounted) setVersion(data?.version_number ?? '');
      } catch (error) {
        console.error('Errore nel caricamento della versione:', error);
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
