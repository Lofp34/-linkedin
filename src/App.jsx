import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient'; 
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
  const [people, setPeople] = useState([]);
  const [allUniqueTags, setAllUniqueTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [manualSelection, setManualSelection] = useState([]);
  const [editingPerson, setEditingPerson] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
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
  }, []);

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
    console.log("Updating person:", personData);
    // TODO: Implement Supabase logic
    await fetchAllData();
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

  const handleImport = (importedPeople) => {
    let newPeople = [...people];
    let importedCount = 0;
    let duplicateCount = 0;

    const existingNames = new Set(people.map(p => `${p.firstname.trim().toLowerCase()},${p.lastname.trim().toLowerCase()}`));

    importedPeople.forEach(importedPerson => {
      const normalizedName = `${importedPerson.firstname.toLowerCase()},${importedPerson.lastname.toLowerCase()}`;
      if (existingNames.has(normalizedName)) {
        duplicateCount++;
      } else {
        const personWithId = { ...importedPerson, id: Date.now() + Math.random() };
        newPeople.push(personWithId);
        existingNames.add(normalizedName);
        importedCount++;
      }
    });

    setPeople(newPeople);
    alert(`Import terminé !\n- ${importedCount} personne(s) ajoutée(s)\n- ${duplicateCount} doublon(s) ignoré(s)`);
  };

  const handleBulkAddTags = (tagsToAdd) => {
    setPeople(prevPeople =>
        prevPeople.map(person => {
            if (selectedPeople.has(person.id)) {
                const updatedTags = new Set([...person.tags, ...tagsToAdd]);
                return { ...person, tags: Array.from(updatedTags).sort() };
            }
            return person;
        })
    );
    setIsBulkEditModalOpen(false);
  };

  const handleBulkRemoveTags = (tagsToRemove) => {
      setPeople(prevPeople =>
          prevPeople.map(person => {
              if (selectedPeople.has(person.id)) {
                  const updatedTags = person.tags.filter(tag => !tagsToRemove.includes(tag));
                  return { ...person, tags: updatedTags };
              }
              return person;
          })
      );
      setIsBulkEditModalOpen(false);
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

  if (loading) {
    return <div className="container"><h1>Chargement des données...</h1></div>;
  }

  return (
    <div className="container">
      <div className="title-container">
        <h1>LinkedIn Tag Manager</h1>
        <svg 
          onClick={() => setIsSettingsModalOpen(true)}
          className="settings-icon"
          xmlns="http://www.w3.org/2000/svg" 
          width="24" height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19.14,12.94c0.04,0.3,0.06,0.61,0.06,0.92c0,0.31-0.02,0.62-0.06,0.92l2.07,1.62c0.18,0.14,0.23,0.41,0.12,0.61 l-1.92,3.32c-0.12,0.2-0.37,0.26-0.59,0.18l-2.48-1c-0.52,0.4-1.08,0.73-1.69,0.98l-0.38,2.65c-0.03,0.24-0.24,0.42-0.48,0.42 h-3.84c-0.24,0-0.45-0.18-0.48-0.42l-0.38-2.65c-0.61-0.25-1.17-0.59-1.69-0.98l-2.48,1c-0.22,0.08-0.47,0.02-0.59-0.18 l-1.92-3.32c-0.12-0.2-0.07-0.47,0.12-0.61L4.8,13.86C4.76,13.56,4.74,13.26,4.74,12.96s0.02-0.6,0.06-0.89L2.69,10.43 c-0.18-0.14-0.23-0.41-0.12-0.61l1.92-3.32c0.12-0.2,0.37-0.26,0.59-0.18l2.48,1c0.52-0.4,1.08-0.73,1.69-0.98L9.6,3.62 C9.63,3.38,9.84,3.2,10.08,3.2h3.84c0.24,0,0.45,0.18,0.48,0.42l0.38,2.65c0.61,0.25,1.17,0.59,1.69,0.98l2.48-1 c0.22-0.08,0.47,0.02,0.59,0.18l1.92,3.32c0.12,0.2,0.07,0.47-0.12,0.61L19.14,12.94z"/>
          <circle cx="12" cy="12" r="3.5"/>
        </svg>
      </div>
      
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