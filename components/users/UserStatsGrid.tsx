import React from 'react';
import SummaryCard from '../SummaryCard';
import {
  BuildingLibraryIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserGroupIcon
} from '../Icons';

interface UserStatsGridProps {
  totalAssignedMunicipalities: number;
  totalUsers: number;
}

const UserStatsGrid: React.FC<UserStatsGridProps> = ({
  totalAssignedMunicipalities,
  totalUsers
}) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
    <SummaryCard
      icon={<UserGroupIcon className="h-8 w-8" />}
      title="Utenti Attivi"
      value={totalUsers.toString()}
    />
    <SummaryCard
      icon={<MapPinIcon className="h-8 w-8" />}
      title="Comuni Assegnati"
      value={totalAssignedMunicipalities.toString()}
    />
    <SummaryCard
      icon={<GlobeAltIcon className="h-8 w-8" />}
      title="Copertura Italia"
      value="0%"
    />
    <SummaryCard
      icon={<BuildingLibraryIcon className="h-8 w-8" />}
      title="Province Coperte"
      value="0"
    />
  </div>
);

export default UserStatsGrid;
