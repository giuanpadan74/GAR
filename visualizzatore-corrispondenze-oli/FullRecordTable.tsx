import React from 'react';
import type { CorrespondenceRecord } from '../src/types/corrispondenze-new';

interface FullRecordTableProps {
  records: CorrespondenceRecord[];
  loading: boolean;
}

const FullRecordTable: React.FC<FullRecordTableProps> = ({ loading }) => {
  if (loading) {
    return <div className="text-black">Caricamento…</div>;
  }

  return <div className="text-black">Tabella non disponibile</div>;
};

export default FullRecordTable;
