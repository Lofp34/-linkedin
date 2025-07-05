import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import { ContactsProvider, useContacts } from './contexts/ContactsContext';
import SettingsModal from './components/SettingsModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import GenerationPage from './pages/GenerationPage';

// This component will contain the shared layout
const AppLayout = ({ onLogout, onOpenSettings }) => (
  <div className="container">
    <header>
      <h1>LinkedIn @-Creator</h1>
      <div className="header-controls">
        <button onClick={onLogout} className="button secondary">Déconnexion</button>
        <button className="settings-button" onClick={onOpenSettings} title="Gérer les tags">⚙️</button>
      </div>
    </header>
    <nav>
      <Link to="/dashboard">Tableau de Bord</Link> | <Link to="/contacts">Contacts</Link> | <Link to="/generation">Génération @</Link>
    </nav>
    <main>
      <Outlet /> {/* Child routes will render here */}
    </main>
  </div>
);

// Composant interne qui a accès au contexte
const AppContent = () => {
  const { session, allUniqueTags, deleteTagFromSystem, toggleTagPriority, fetchAllTags } = useContacts();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenSettings = async () => {
    await fetchAllTags(); // Refresh tags before opening
    setIsSettingsModalOpen(true);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagToDelete}" partout dans l'application ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await deleteTagFromSystem(tagToDelete);
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleTogglePriority = async (tagName, newStatus) => {
    try {
      await toggleTagPriority(tagName, newStatus);
    } catch (error) {
      console.error("Error toggling tag priority:", error);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<AppLayout onLogout={handleLogout} onOpenSettings={handleOpenSettings} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="generation" element={<GenerationPage />} />
        </Route>
      </Routes>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tags={allUniqueTags}
        onDeleteTag={handleDeleteTag}
        onTogglePriority={handleTogglePriority}
      />
    </>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      {!session ? (
        <div className="auth-container">
          <h1>LinkedIn @-Creator</h1>
          <div className="auth-widget">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
              localization={{
                variables: {
                  sign_in: { email_label: 'Adresse e-mail', password_label: 'Mot de passe', button_label: 'Se connecter', social_provider_text: 'Se connecter avec {{provider}}', link_text: 'Vous avez déjà un compte ? Connectez-vous' },
                  sign_up: { email_label: 'Adresse e-mail', password_label: 'Mot de passe', button_label: 'S\'inscrire', social_provider_text: 'S\'inscrire avec {{provider}}', link_text: 'Vous n\'avez pas de compte ? Inscrivez-vous' },
                  forgotten_password: { email_label: 'Adresse e-mail', password_label: 'Mot de passe', button_label: 'Réinitialiser le mot de passe', link_text: 'Mot de passe oublié ?' }
                },
              }}
            />
          </div>
        </div>
      ) : (
        <ContactsProvider>
          <AppContent />
        </ContactsProvider>
      )}
    </>
  );
}

export default App; 