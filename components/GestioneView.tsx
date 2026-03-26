import React, { useState, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import { 
  FileText, 
  BarChart3,
  Settings
} from 'lucide-react';

// Import lazy dei componenti tab
const PreventiviTab = React.lazy(() => import('./preventivi/PreventiviTab'));
const StatisticheTab = React.lazy(() => import('./statistiche/StatisticheTab'));

type TabType = 'preventivi' | 'statistiche';

const GestioneView: React.FC = () => {
  const { profile } = useAuth();
  
  // Stato per il tab attivo
  const [activeTab, setActiveTab] = useState<TabType>('preventivi');

  // Configurazione dei tabs
  const tabs = [
    {
      id: 'preventivi' as TabType,
      label: 'Preventivi',
      icon: FileText,
      component: PreventiviTab
    },
    {
      id: 'statistiche' as TabType,
      label: 'Statistiche',
      icon: BarChart3,
      component: StatisticheTab
    }
  ];

  // Componente di loading per Suspense
  const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
      <p className="text-gray-400">Caricamento...</p>
    </div>
  );

  // Render del componente attivo
  const renderActiveTab = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (!activeTabConfig) return null;

    const Component = activeTabConfig.component;
    
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-roloil-purple" />
          <div>
            <h1 className="text-3xl font-bold text-white">Gestione</h1>
            <p className="text-gray-400 mt-1">
              Preventivi e statistiche del sistema RolListino
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-roloil-gray rounded-lg p-1">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-roloil-purple text-white'
                    : 'text-gray-400 hover:text-white hover:bg-roloil-dark'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default GestioneView;