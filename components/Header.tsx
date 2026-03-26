
import React, { useState, useEffect } from 'react';
import { BriefcaseIcon, ChartPieIcon, MapIcon, ClipboardListIcon, DatabaseIcon } from './Icons';
import { Settings, Scale, Menu, X, Search, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextSimple';
import VersionsModal from '../src/components/VersionsModal.tsx';
import VersionBadge from '../src/components/VersionBadge';

enum View {
  Listino = 'Listino',
  Agents = 'Agenti di Commercio',
  Map = 'Mappa Territori',
  Corrispondenze = 'Corrispondenze',
  Gestione = 'Gestione',
  Geo = 'Gestione Geografica',
  Scale = 'Scale'
}

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: View;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-roloil-purple text-white' : 'text-gray-300 hover:bg-roloil-light-gray'
    }`}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

// Mobile vertical nav item (keeps styles compact for drawer)
const MobileNavItem: React.FC<{
  icon: React.ReactNode;
  label: View;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center px-4 py-3 rounded-lg transition-colors duration-200 text-left ${
      isActive ? 'bg-roloil-purple text-white' : 'text-gray-200 hover:bg-roloil-light-gray'
    }`}
    role="menuitem"
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { user, signOut, refreshUser, isAdmin: isAdminFn } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
      } catch {}
    })();
  }, []);
  const isAdmin = isAdminFn() || String(user?.email || '').toLowerCase() === 'erosvesentini@live.it';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <header className="bg-roloil-gray shadow-md">
      <div className="container mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-10">
            <h1 className="text-2xl font-bold text-white">Gestione Agenti Roloil</h1>
            <div className="text-xs text-gray-300">
              <VersionBadge />
            </div>
          </div>
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavItem
              icon={<ClipboardListIcon className="w-5 h-5" />}
              label={View.Listino}
              isActive={currentView === View.Listino}
              onClick={() => onViewChange(View.Listino)}
            />
            <NavItem
              icon={<BriefcaseIcon className="w-5 h-5" />}
              label={View.Agents}
              isActive={currentView === View.Agents}
              onClick={() => onViewChange(View.Agents)}
            />
            <NavItem
              icon={<MapIcon className="w-5 h-5" />}
              label={View.Map}
              isActive={currentView === View.Map}
              onClick={() => onViewChange(View.Map)}
            />
            <NavItem
              icon={<Search className="w-5 h-5" />}
              label={View.Corrispondenze}
              isActive={currentView === View.Corrispondenze}
              onClick={() => onViewChange(View.Corrispondenze)}
            />
            {isAdmin && (
              <NavItem
                icon={<DatabaseIcon className="w-5 h-5" />}
                label={View.Geo}
                isActive={currentView === View.Geo}
                onClick={() => onViewChange(View.Geo)}
              />
            )}
            <NavItem
              icon={<Settings className="w-5 h-5" />}
              label={View.Gestione}
              isActive={currentView === View.Gestione}
              onClick={() => onViewChange(View.Gestione)}
            />
            {isAdmin && (
              <NavItem
                icon={<Scale className="w-5 h-5" />}
                label={View.Scale}
                isActive={currentView === View.Scale}
                onClick={() => onViewChange(View.Scale)}
              />
            )}
          </nav>
        </div>
        
        {/* Area utente e logout (desktop) */}
        {user && (
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors durata 200"
            >
              Logout
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowVersionsModal(true)}
                className="bg-roloil-purple hover:bg-roloil-purple/80 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center"
                title="Versioni"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            <div className="text-white">
              <span className="text-sm">Benvenuto, </span>
              <span className="font-semibold">
                {user?.full_name || user?.username || user?.email}
              </span>
              {user?.role && (
                <span className="ml-2 px-2 py-1 bg-roloil-purple text-xs rounded">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Apri menu"
          aria-controls="mobile-menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile slide-out menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50" id="mobile-menu" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-roloil-dark shadow-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Chiudi menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-2" role="menu" aria-orientation="vertical">
              <MobileNavItem
                icon={<ClipboardListIcon className="w-5 h-5" />}
                label={View.Listino}
                isActive={currentView === View.Listino}
                onClick={() => { onViewChange(View.Listino); setMobileMenuOpen(false); }}
              />
              
              <MobileNavItem
                icon={<BriefcaseIcon className="w-5 h-5" />}
                label={View.Agents}
                isActive={currentView === View.Agents}
                onClick={() => { onViewChange(View.Agents); setMobileMenuOpen(false); }}
              />
              
              <MobileNavItem
                icon={<MapIcon className="w-5 h-5" />}
                label={View.Map}
                isActive={currentView === View.Map}
                onClick={() => { onViewChange(View.Map); setMobileMenuOpen(false); }}
              />
              <MobileNavItem
                icon={<Search className="w-5 h-5" />}
                label={View.Corrispondenze}
                isActive={currentView === View.Corrispondenze}
                onClick={() => { onViewChange(View.Corrispondenze); setMobileMenuOpen(false); }}
              />
              {isAdmin && (
                <MobileNavItem
                  icon={<DatabaseIcon className="w-5 h-5" />}
                  label={View.Geo}
                  isActive={currentView === View.Geo}
                  onClick={() => { onViewChange(View.Geo); setMobileMenuOpen(false); }}
                />
              )}
              <MobileNavItem
                icon={<Settings className="w-5 h-5" />}
                label={View.Gestione}
                isActive={currentView === View.Gestione}
                onClick={() => { onViewChange(View.Gestione); setMobileMenuOpen(false); }}
              />
              {isAdmin && (
                <MobileNavItem
                  icon={<Scale className="w-5 h-5" />}
                  label={View.Scale}
                  isActive={currentView === View.Scale}
                  onClick={() => { onViewChange(View.Scale); setMobileMenuOpen(false); }}
                />
              )}
              {isAdmin && (
                <button
                  onClick={() => { setShowVersionsModal(true); }}
                  className="flex w-full items-center px-4 py-3 rounded-lg transition-colors duration-200 text-left text-gray-200 hover:bg-roloil-light-gray"
                  role="menuitem"
                  title="Versioni"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
            </nav>

            {/* User section in mobile menu */}
            {user && (
              <div className="mt-6 border-t border-roloil-light-gray pt-4">
                <div className="text-white mb-3">
                  <span className="text-sm">Benvenuto, </span>
                  <span className="font-semibold">
                    {user?.full_name || user?.username || user?.email}
                  </span>
                  {user?.role && (
                    <span className="ml-2 px-2 py-1 bg-roloil-purple text-xs rounded">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => { await handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      
      {isAdmin && (
        <VersionsModal
          isOpen={showVersionsModal}
          onClose={() => setShowVersionsModal(false)}
        />
      )}
    </header>
  );
};

export default Header;
