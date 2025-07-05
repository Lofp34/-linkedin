import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import AddPersonForm from './components/AddPersonForm';
import PersonList from './components/PersonList';
import FilteredResult from './components/FilteredResult';
import ManualSelection from './components/ManualSelection';
import EditPersonModal from './components/EditPersonModal';
import ImportCSV from './components/ImportCSV';
import SettingsModal from './components/SettingsModal';
import BulkActionsBar from './components/BulkActionsBar';
import BulkEditTagsModal from './components/BulkEditTagsModal';
import TagCreator from './components/TagCreator';

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

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // This state now holds objects { name: string, is_priority: boolean }
  const [allUniqueTags, setAllUniqueTags] = useState([]);

  const fetchAllTags = useCallback(async () => {
    if (!session) return;
    try {
      // Try to fetch with the new 'is_priority' column
      let { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('name, is_priority');

      // If it fails, fall back to the old query
      if (tagsError) {
        console.warn("Could not fetch 'is_priority'. Please run the migration. Falling back to names only.");
        const { data: fallbackData, error: fallbackError } = await supabase.from('tags').select('name');
        
        if (fallbackError) throw fallbackError;

        // Map the old data structure to the new one
        tagsData = fallbackData.map(tag => ({ name: tag.name, is_priority: false }));
      }
      
      setAllUniqueTags(tagsData || []);

    } catch (error) {
      console.error("Error fetching tags:", error);
      setAllUniqueTags([]); // On critical error, ensure it's an empty array
    }
  }, [session]);

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

  // Fetch tags when the modal is opened for the first time or session changes
  useEffect(() => {
    if (session) {
      fetchAllTags();
    }
  }, [session, fetchAllTags]);

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
      // We need the ID to delete it, Supabase doesn't support delete by name directly on referenced tables
      const { data: tagData, error: tagError } = await supabase.from('tags').select('id').eq('name', tagToDelete).single();
      if (tagError) throw tagError;

      const tagId = tagData.id;

      // 1. Delete all associations in person_tags
      const { error: assocError } = await supabase.from('person_tags').delete().eq('tag_id', tagId);
      if (assocError) throw assocError;

      // 2. Delete the tag itself
      const { error: deleteError } = await supabase.from('tags').delete().eq('id', tagId);
      if (deleteError) throw deleteError;

      // 3. Refresh the tags list
      await fetchAllTags();
      // We might need a way to tell the child pages to refetch their data too.
      // For now, navigating away and back will fix it.

    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleTogglePriority = async (tagName, newStatus) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ is_priority: newStatus })
        .eq('name', tagName);
      
      if (error) throw error;

      // Optimistically update the UI to feel instant
      setAllUniqueTags(prevTags =>
        prevTags.map(tag =>
          tag.name === tagName ? { ...tag, is_priority: newStatus } : tag
        )
      );
    } catch (error) {
      console.error("Error toggling tag priority:", error);
    }
  };

  // The rest of the logic (data fetching, handlers) will be moved
  // to the relevant pages or a shared context later.
  // For now, let's just set up the routes.

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
        <Routes>
          <Route path="/" element={<AppLayout onLogout={handleLogout} onOpenSettings={handleOpenSettings} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="generation" element={<GenerationPage />} />
          </Route>
        </Routes>
      )}

      {/* Modals will need to be handled globally or moved */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tags={allUniqueTags}
        onDeleteTag={handleDeleteTag}
        onTogglePriority={handleTogglePriority}
      />
    </>
  );
}

export default App; 