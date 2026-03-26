
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContextSimple';
import { AuthModal } from './components/auth';
import Header from './components/Header';
import AgentsView from './components/AgentsView';
import MapTerritoriesView from './components/MapTerritoriesView';
import GeoView from './components/GeoView';
import ListinoView from './components/ListinoView';
import GestioneView from './components/GestioneView';
import ScaleView from './src/pages/ScaleView';
import CorrispondenzeView from './components/CorrispondenzeView';

enum View {
  Listino = 'Listino',
  Agents = 'Agenti di Commercio',
  Map = 'Mappa Territori',
  Corrispondenze = 'Corrispondenze',
  Gestione = 'Gestione',
  Geo = 'Gestione Geografica',
  Scale = 'Scale'
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.Listino);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case View.Listino:
        return <ListinoView />;
      case View.Agents:
        return <AgentsView />;
      case View.Map:
        return <MapTerritoriesView />;
      case View.Corrispondenze:
        return <CorrispondenzeView />;
      case View.Gestione:
        return <GestioneView />;
      case View.Geo:
        return <GeoView />;
      case View.Scale:
        return <ScaleView />;
      default:
        return <ListinoView />;
    }
  };

  // Mostra loading durante il caricamento iniziale
  if (loading) {
    return (
      <div className="min-h-screen bg-roloil-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple mx-auto"></div>
          <p className="mt-4 text-roloil-text">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra il modal di login
  if (!user) {
    return (
      <div className="min-h-screen bg-roloil-dark">
        <AuthModal 
          isOpen={true}
          onClose={() => {}} // Non permettere di chiudere se non autenticato
          initialMode="login"
        />
      </div>
    );
  }

  // Se l'utente è autenticato, mostra l'app normale
  return (
    <div className="min-h-screen bg-roloil-dark">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
      
      {/* Modal di autenticazione opzionale */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      )}
      
      {/* Toaster per le notifiche */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
        theme="dark"
      />
    </div>
  );
}