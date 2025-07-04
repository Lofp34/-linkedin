import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
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

function App() {
  const [session, setSession] = useState(null);
  const [people, setPeople] = useState([]);
  const [allUniqueTags, setAllUniqueTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [manualSelection, setManualSelection] = useState([]);
  const [editingPerson, setEditingPerson] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!session) return; // Don't fetch if no user is logged in
    setLoading(true);
    try {
      // Fetch people with their tags
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select(`
          id,
          firstname,
          lastname,
          tags ( id, name )
        `);

      if (peopleError) throw peopleError;

      // Transform data to match the frontend structure
      const transformedPeople = peopleData.map(p => ({
        ...p,
        tags: p.tags.map(t => t.name) 
      }));
      setPeople(transformedPeople);
      
      // Fetch all unique tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('name');

      if (tagsError) throw tagsError;

      setAllUniqueTags(tagsData.map(t => t.name).sort());

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddPerson = async ({ firstname, lastname, tags: tagNames }) => {
    try {
      setLoading(true);

      // 1. Insert the new person
      const { data: personData, error: personError } = await supabase
        .from('people')
        .insert([{ firstname, lastname }])
        .select('id')
        .single();
      
      if (personError) throw personError;
      const personId = personData.id;

      // 2. Get IDs of the selected tags
      if (tagNames && tagNames.length > 0) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tagNames);
        
        if (tagsError) throw tagsError;

        // 3. Create the associations in the join table
        const associations = tagsData.map(tag => ({
          person_id: personId,
          tag_id: tag.id
        }));

        const { error: assocError } = await supabase.from('person_tags').insert(associations);
        if (assocError) throw assocError;
      }
      
      // Refresh all data from the server
      await fetchAllData();

    } catch (error) {
      console.error("Error adding person:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePerson = async (personData) => {
    try {
      setLoading(true);
      const { id: personId, tags: tagNames } = personData;

      // 1. Delete existing tag associations for the person
      const { error: deleteError } = await supabase
        .from('person_tags')
        .delete()
        .eq('person_id', personId);

      if (deleteError) throw deleteError;

      // 2. Get IDs for the new tags
      if (tagNames && tagNames.length > 0) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tagNames);
      
        if (tagsError) throw tagsError;

        // 3. Create new associations in the join table
        const associations = tagsData.map(tag => ({
          person_id: personId,
          tag_id: tag.id
        }));

        if (associations.length > 0) {
          const { error: assocError } = await supabase.from('person_tags').insert(associations);
          if (assocError) throw assocError;
        }
      }

      // 4. Refresh all data from the server
      await fetchAllData();
      
    } catch (error) {
      console.error("Error updating person:", error);
    } finally {
      setLoading(false);
      setEditingPerson(null); // Close the modal on success
    }
  };

  const handleDeletePerson = async (personId) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('people').delete().eq('id', personId);
      if (error) throw error;
      
      // The person is deleted, now refresh the data
      // We also clear the selection to avoid any dangling references
      setSelectedPeople(prev => {
        const newSet = new Set(prev);
        newSet.delete(personId);
        return newSet;
      });
      await fetchAllData();

    } catch(error) {
      console.error("Error deleting person:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewTagToSystem = async (newTagName) => {
    console.log("Adding tag:", newTagName);
    const { data, error } = await supabase.from('tags').insert([{ name: newTagName.trim() }]).select();
    if (error) {
        if(error.code !== '23505') { // 23505 is unique_violation
            console.error("Error adding tag:", error);
        }
    }
    if (data) {
        await fetchAllData();
    }
  };

  const handleImport = async (importedPeople) => {
    setLoading(true);
    try {
      const existingNames = new Set(people.map(p => `${p.firstname.trim().toLowerCase()},${p.lastname.trim().toLowerCase()}`));
      
      const peopleToInsert = importedPeople
        .map(p => ({
          ...p,
          firstname: p.firstname.trim(),
          lastname: p.lastname.trim()
        }))
        .filter(p => {
          const normalizedName = `${p.firstname.toLowerCase()},${p.lastname.toLowerCase()}`;
          return !existingNames.has(normalizedName);
        });

      const duplicateCount = importedPeople.length - peopleToInsert.length;

      if (peopleToInsert.length > 0) {
        // We only need to insert firstname and lastname. Tags are empty by default.
        const { error } = await supabase
          .from('people')
          .insert(peopleToInsert.map(({ firstname, lastname }) => ({ firstname, lastname })));
        
        if (error) throw error;
      }
      
      // Refresh all data from the server
      await fetchAllData();
      
      alert(`Import terminé !\n- ${peopleToInsert.length} personne(s) ajoutée(s)\n- ${duplicateCount} doublon(s) ignoré(s)`);

    } catch(error) {
      console.error("Error importing people:", error);
      alert("Une erreur est survenue lors de l'importation.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAddTags = async (tagsToAdd) => {
    try {
      setLoading(true);

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tagsToAdd);

      if (tagsError) throw tagsError;
      const tagIds = tagsData.map(t => t.id);

      const associations = Array.from(selectedPeople).flatMap(personId =>
        tagIds.map(tagId => ({ person_id: personId, tag_id: tagId }))
      );

      if (associations.length > 0) {
        // Use upsert to add tags, ignoring any that would create a duplicate
        const { error: assocError } = await supabase
          .from('person_tags')
          .upsert(associations, { onConflict: 'person_id, tag_id' });
        if (assocError) throw assocError;
      }

      await fetchAllData();
    } catch (error) {
      console.error("Error bulk adding tags:", error);
    } finally {
      setLoading(false);
      setIsBulkEditModalOpen(false);
      setSelectedPeople(new Set());
    }
  };

  const handleBulkRemoveTags = async (tagsToRemove) => {
    try {
      setLoading(true);

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id')
        .in('name', tagsToRemove);

      if (tagsError) throw tagsError;
      const tagIdsToRemove = tagsData.map(t => t.id);

      if (tagIdsToRemove.length > 0 && selectedPeople.size > 0) {
        const { error: deleteError } = await supabase
          .from('person_tags')
          .delete()
          .in('person_id', Array.from(selectedPeople))
          .in('tag_id', tagIdsToRemove);
        
        if (deleteError) throw deleteError;
      }

      await fetchAllData();
    } catch (error) {
      console.error("Error bulk removing tags:", error);
    } finally {
      setLoading(false);
      setIsBulkEditModalOpen(false);
      setSelectedPeople(new Set());
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    const newPeople = people.map(p => ({
      ...p,
      tags: p.tags.filter(tag => tag !== tagToDelete)
    }));
    setPeople(newPeople);
    setAllUniqueTags(prevTags => prevTags.filter(t => t !== tagToDelete));
  };

  const handleAddToSelection = (person) => {
    if (!manualSelection.find(p => p.id === person.id)) {
      setManualSelection([...manualSelection, person]);
    }
  };

  const handleClearSelection = () => {
    setManualSelection([]);
  };

  const handleSelectPerson = (personId) => {
    setSelectedPeople((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(personId)) {
        newSelected.delete(personId);
      } else {
        newSelected.add(personId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    setSelectedPeople(new Set(filteredPeople.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPeople(new Set());
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPeople.size} personne(s) ?`)) {
      setPeople(people.filter(p => !selectedPeople.has(p.id)));
      setSelectedPeople(new Set());
    }
  };

  const handleToggleFilterTag = (tag) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      if (selectedTags.size === 0) return true;
      return p.tags.some(tag => selectedTags.has(tag));
    });
  }, [people, selectedTags]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      // Session will be set to null by onAuthStateChange listener
      // and we clear the local state
      setPeople([]);
      setAllUniqueTags([]);
      setSelectedTags(new Set());
      setManualSelection([]);
      setSelectedPeople(new Set());
    }
  };

  if (!session) {
    return (
      <div className="auth-container">
        <h1>LinkedIn Tag Manager</h1>
        <div className="auth-widget">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Adresse e-mail',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  social_provider_text: 'Se connecter avec {{provider}}',
                  link_text: 'Vous avez déjà un compte ? Connectez-vous',
                },
                sign_up: {
                  email_label: 'Adresse e-mail',
                  password_label: 'Mot de passe',
                  button_label: 'S\'inscrire',
                  social_provider_text: 'S\'inscrire avec {{provider}}',
                  link_text: 'Vous n\'avez pas de compte ? Inscrivez-vous',
                },
                forgotten_password: {
                  email_label: 'Adresse e-mail',
                  password_label: 'Mot de passe',
                  button_label: 'Réinitialiser le mot de passe',
                  link_text: 'Mot de passe oublié ?',
                }
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>LinkedIn Tag Manager</h1>
        <div className="header-controls">
          <button onClick={handleLogout} className="button secondary">Déconnexion</button>
          <button className="settings-button" onClick={() => setIsSettingsModalOpen(true)} title="Gérer les tags">⚙️</button>
        </div>
      </header>
      
      <AddPersonForm onAddPerson={handleAddPerson} existingTags={allUniqueTags} />
      
      <TagCreator onAddNewTag={handleAddNewTagToSystem} />
      
      <ImportCSV onImport={handleImport} />

      <FilteredResult 
        people={filteredPeople} 
        existingTags={allUniqueTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleFilterTag}
      />

      <ManualSelection selectedPeople={manualSelection} onClear={handleClearSelection} />
      
      <section>
        <BulkActionsBar 
          selectedCount={selectedPeople.size}
          totalCount={filteredPeople.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onDeleteSelected={handleDeleteSelected}
          onEditTags={() => setIsBulkEditModalOpen(true)}
        />
        <PersonList 
          people={filteredPeople} 
          onDeletePerson={handleDeletePerson}
          onAddToSelection={handleAddToSelection}
          onStartEdit={setEditingPerson}
          selectedIds={Array.from(selectedPeople)}
          onToggleSelect={handleSelectPerson}
        />
      </section>

      {editingPerson && (
        <EditPersonModal 
            person={editingPerson}
            onUpdate={handleUpdatePerson}
            onCancel={() => setEditingPerson(null)}
            existingTags={allUniqueTags}
        />
      )}
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tags={allUniqueTags}
        onDeleteTag={handleDeleteTag}
      />

      {isBulkEditModalOpen && (
        <BulkEditTagsModal
          isOpen={isBulkEditModalOpen}
          onClose={() => setIsBulkEditModalOpen(false)}
          allUniqueTags={allUniqueTags}
          onBulkAdd={handleBulkAddTags}
          onBulkRemove={handleBulkRemoveTags}
          selectedCount={selectedPeople.size}
          onAddNewTagToSystem={handleAddNewTagToSystem}
        />
      )}

    </div>
  );
}

export default App; 