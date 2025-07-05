import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Components for this page
import AddPersonForm from '../components/AddPersonForm';
import PersonList from '../components/PersonList';
import ImportCSV from '../components/ImportCSV';
import TagCreator from '../components/TagCreator';
import BulkActionsBar from '../components/BulkActionsBar';
import BulkEditTagsModal from '../components/BulkEditTagsModal';
import CollapsibleSection from '../components/CollapsibleSection';
import EditPersonModal from '../components/EditPersonModal';

const ContactsPage = () => {
    const [people, setPeople] = useState([]);
    const [allUniqueTags, setAllUniqueTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    // State for group selection & modal
    const [selectedPeople, setSelectedPeople] = useState(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [openSections, setOpenSections] = useState({
        // Let's keep the contact list open by default for better UX
        contactList: true, 
    });

    useEffect(() => {
        // We need to get the session to make sure we're authenticated before fetching
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });
    
        // Listen for auth changes to stay in sync
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
    
        return () => subscription.unsubscribe();
    }, []);

    const fetchAllData = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const { data: peopleData, error: peopleError } = await supabase
                .from('people')
                .select(`id, firstname, lastname, solicitation_count, last_solicitation_date, tags ( id, name )`)
                .order('created_at', { ascending: false });

            if (peopleError) throw peopleError;

            const transformedPeople = peopleData.map(p => ({
                ...p,
                tags: p.tags.map(t => t.name)
            }));
            setPeople(transformedPeople);

            // Robust tags fetching
            let { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('name, is_priority');

            if (tagsError) {
                console.warn("Could not fetch 'is_priority' in ContactsPage. Falling back.");
                const { data: fallbackData, error: fallbackError } = await supabase.from('tags').select('name');
                if (fallbackError) throw fallbackError;
                tagsData = fallbackData.map(tag => ({ name: tag.name, is_priority: false }));
            }
            
            setAllUniqueTags(tagsData || []);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        // Only fetch data if we have a session
        if (session) {
            fetchAllData();
        } else {
            // If there's no session, we're not loading data, so set loading to false
            setLoading(false);
        }
    }, [session, fetchAllData]);

    const handleAddPerson = async ({ firstname, lastname, tags: tagNames }) => {
        try {
            setLoading(true);
            const { data: personData, error: personError } = await supabase
                .from('people')
                .insert([{ firstname, lastname }])
                .select('id')
                .single();
            if (personError) throw personError;
            const personId = personData.id;

            if (tagNames && tagNames.length > 0) {
                const { data: tagsData, error: tagsError } = await supabase.from('tags').select('id, name').in('name', tagNames);
                if (tagsError) throw tagsError;
                const associations = tagsData.map(tag => ({ person_id: personId, tag_id: tag.id }));
                const { error: assocError } = await supabase.from('person_tags').insert(associations);
                if (assocError) throw assocError;
            }
            await fetchAllData();
        } catch (error) {
            console.error("Error adding person:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPeople.size} personne(s) ?`)) {
            return;
        }
        try {
            setLoading(true);
            const { error } = await supabase.from('people').delete().in('id', Array.from(selectedPeople));
            if (error) throw error;
            
            setSelectedPeople(new Set()); // Clear selection
            await fetchAllData(); // Refresh data
        } catch (error) {
            console.error("Error deleting selected people:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpdateTags = async (tags, action) => {
        const personIds = Array.from(selectedPeople);
        if (personIds.length === 0) return;
        
        setLoading(true);
        try {
            const { data: tagsData, error: tagsError } = await supabase.from('tags').select('id, name').in('name', tags);
            if (tagsError) throw tagsError;

            if (action === 'add') {
                const associations = personIds.flatMap(personId =>
                    tagsData.map(tag => ({ person_id: personId, tag_id: tag.id }))
                );
                if (associations.length > 0) {
                    await supabase.from('person_tags').upsert(associations, { onConflict: 'person_id, tag_id' });
                }
            } else if (action === 'remove') {
                const tagIdsToRemove = tagsData.map(t => t.id);
                if (tagIdsToRemove.length > 0) {
                    await supabase.from('person_tags').delete().in('person_id', personIds).in('tag_id', tagIdsToRemove);
                }
            }
            await fetchAllData();
        } catch (error) {
            console.error(`Error bulk ${action}ing tags:`, error);
        } finally {
            setLoading(false);
            setIsBulkEditModalOpen(false);
            setSelectedPeople(new Set());
        }
    };
    
    // Selection handlers inspired by GenerationPage
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
        setSelectedPeople(new Set(people.map(p => p.id)));
    };

    const handleDeselectAll = () => {
        setSelectedPeople(new Set());
    };

    const handleAddNewTagToSystem = async (newTagName) => {
        const { data, error } = await supabase.from('tags').insert([{ name: newTagName.trim() }]).select();
        if (error && error.code !== '23505') { 
            console.error("Error adding tag:", error);
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
                .map(p => ({ ...p, firstname: p.firstname.trim(), lastname: p.lastname.trim() }))
                .filter(p => !existingNames.has(`${p.firstname.toLowerCase()},${p.lastname.toLowerCase()}`));
            const duplicateCount = importedPeople.length - peopleToInsert.length;
            if (peopleToInsert.length > 0) {
                const { error } = await supabase.from('people').insert(peopleToInsert.map(({ firstname, lastname }) => ({ firstname, lastname })));
                if (error) throw error;
            }
            await fetchAllData();
            alert(`Import terminé !\n- ${peopleToInsert.length} personne(s) ajoutée(s)\n- ${duplicateCount} doublon(s) ignoré(s)`);
        } catch (error) {
            console.error("Error importing people:", error);
            alert("Une erreur est survenue lors de l'importation.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePerson = async (updatedPerson, closeModal = true) => {
        setLoading(true);
        try {
            await supabase.from('people').update({ firstname: updatedPerson.firstname, lastname: updatedPerson.lastname }).eq('id', updatedPerson.id);
            const { data: tagsData } = await supabase.from('tags').select('id, name').in('name', updatedPerson.tags);
            await supabase.from('person_tags').delete().eq('person_id', updatedPerson.id);
            const newAssociations = tagsData.map(tag => ({ person_id: updatedPerson.id, tag_id: tag.id }));
            if (newAssociations.length > 0) {
                await supabase.from('person_tags').insert(newAssociations);
            }
            
            // Optimistic UI update instead of full refetch
            setPeople(prevPeople => prevPeople.map(p => p.id === updatedPerson.id ? updatedPerson : p));

            if (closeModal) {
                setEditingPerson(null);
            }
            return updatedPerson; // Return updated person for chaining
        } catch (error) {
            console.error("Error updating person:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndCreateTags = async (personWithLocalChanges, newTagNames) => {
        setLoading(true);
        try {
            // Step 1: Determine the final state by combining existing and new tags.
            const finalTagList = [...new Set([...personWithLocalChanges.tags, ...newTagNames])];
            const personToSave = { ...personWithLocalChanges, tags: finalTagList };

            // Step 2: Create the new tags in the database. Supabase handles duplicates gracefully.
            const newTagsToInsert = newTagNames.map(name => ({ name }));
            const { data: createdTags, error: createError } = await supabase.from('tags').insert(newTagsToInsert).select();
            if (createError && createError.code !== '23505') { // Ignore duplicate errors
                throw createError;
            }

            // Step 3: Update the person with the complete and final list of tags.
            // handleUpdatePerson already updates the 'people' state optimistically.
            await handleUpdatePerson(personToSave, false); // false = don't close modal

            // Step 4: Optimistically update the global list of all available tags with the new objects.
            if (createdTags) {
                const newTagObjects = createdTags.map(t => ({ name: t.name, is_priority: t.is_priority || false }));
                setAllUniqueTags(prev => {
                    const existingNames = new Set(prev.map(t => t.name));
                    const trulyNewTags = newTagObjects.filter(t => !existingNames.has(t.name));
                    return [...prev, ...trulyNewTags];
                });
            }
            
            // Step 5: Update the person object in the modal to keep it perfectly in sync.
            setEditingPerson(personToSave);

        } catch (error) {
            console.error("Error in save and create:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePerson = async (personId) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cette personne ?`)) return;
        setLoading(true);
        try {
            await supabase.from('people').delete().eq('id', personId);
            await fetchAllData();
        } catch (error) {
            console.error("Error deleting person:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (sectionName) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    if (loading) {
        return <div>Chargement de vos contacts...</div>
    }

    return (
        <>
            <CollapsibleSection 
                title="Ajouter une personne"
                isOpen={openSections.addPerson}
                onToggle={() => toggleSection('addPerson')}
            >
                <AddPersonForm onAddPerson={handleAddPerson} existingTags={allUniqueTags} />
            </CollapsibleSection>
            
            <CollapsibleSection 
                title="Créer des tags"
                isOpen={openSections.createTag}
                onToggle={() => toggleSection('createTag')}
            >
                <TagCreator onAddNewTag={handleAddNewTagToSystem} />
            </CollapsibleSection>

            <CollapsibleSection 
                title="Importer un CSV"
                isOpen={openSections.importCsv}
                onToggle={() => toggleSection('importCsv')}
            >
                <ImportCSV onImport={handleImport} />
            </CollapsibleSection>

            <CollapsibleSection 
                title="Votre Liste de Contacts"
                isOpen={openSections.contactList}
                onToggle={() => toggleSection('contactList')}
            >
                <BulkActionsBar 
                    selectedCount={selectedPeople.size}
                    totalCount={people.length}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onDeleteSelected={handleDeleteSelected}
                    onEditTags={() => setIsBulkEditModalOpen(true)}
                />
                <PersonList 
                    people={people} 
                    selectedIds={Array.from(selectedPeople)}
                    onToggleSelect={handleSelectPerson}
                    showActions={true}
                    onStartEdit={setEditingPerson}
                    onDelete={handleDeletePerson}
                />
            </CollapsibleSection>
            
            {editingPerson && (
                <EditPersonModal
                    person={editingPerson}
                    onUpdate={handleUpdatePerson}
                    onCancel={() => setEditingPerson(null)}
                    existingTags={allUniqueTags}
                    onSaveAndCreateTags={handleSaveAndCreateTags}
                />
            )}

            {isBulkEditModalOpen && (
                <BulkEditTagsModal
                    isOpen={isBulkEditModalOpen}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    allUniqueTags={allUniqueTags}
                    onBulkAdd={(tags) => handleBulkUpdateTags(tags, 'add')}
                    onBulkRemove={(tags) => handleBulkUpdateTags(tags, 'remove')}
                    selectedCount={selectedPeople.size}
                    onAddNewTagToSystem={handleAddNewTagToSystem}
                />
            )}
        </>
    );
};

export default ContactsPage; 