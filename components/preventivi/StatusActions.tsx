import React from 'react';
import { CheckCircle2, Send, XCircle, Clock } from 'lucide-react';
import { PreventivoDetailed, PreventiveStatus } from '../../types/listino';

interface StatusActionsProps {
  preventivo: PreventivoDetailed;
  onChange: (id: string, status: PreventiveStatus) => Promise<void>;
}

/**
 * Cambia lo stato del preventivo.
 * Le transizioni sono lineari da bozza: dopo l'invio non si torna a bozza,
 * perché l'iter commerciale non si riapre da solo.
 */
export const StatusActions: React.FC<StatusActionsProps> = ({ preventivo, onChange }) => {
  const [busy, setBusy] = React.useState(false);

  const run = async (status: PreventiveStatus) => {
    setBusy(true);
    try {
      await onChange(preventivo.id, status);
    } finally {
      setBusy(false);
    }
  };

  const btn = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {preventivo.status === PreventiveStatus.BOZZA && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(PreventiveStatus.INVIATO)}
            className={`${btn} bg-roloil-purple text-white hover:bg-purple-700`}
          >
            <Send className="h-4 w-4" /> Invia
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(PreventiveStatus.SCADUTO)}
            className={`${btn} bg-gray-200 text-black hover:bg-gray-300`}
          >
            <Clock className="h-4 w-4" /> Scaduto
          </button>
        </>
      )}

      {preventivo.status === PreventiveStatus.INVIATO && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(PreventiveStatus.ACCETTATO)}
            className={`${btn} bg-green-600 text-white hover:bg-green-700`}
          >
            <CheckCircle2 className="h-4 w-4" /> Accettato
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(PreventiveStatus.RIFIUTATO)}
            className={`${btn} bg-red-600 text-white hover:bg-red-700`}
          >
            <XCircle className="h-4 w-4" /> Rifiutato
          </button>
        </>
      )}

      {(preventivo.status === PreventiveStatus.ACCETTATO ||
        preventivo.status === PreventiveStatus.RIFIUTATO ||
        preventivo.status === PreventiveStatus.SCADUTO) && (
        <span className="text-sm text-black">Iter concluso</span>
      )}
    </div>
  );
};

export default StatusActions;