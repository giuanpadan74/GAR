
import React from 'react';

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, title, value }) => {
  return (
    <div className="bg-roloil-gray p-6 rounded-lg shadow flex items-center">
      <div className="bg-roloil-light-gray p-3 rounded-full mr-4 text-roloil-purple">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
