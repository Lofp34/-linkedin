import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// Components for this page
import FilteredResult from '../components/FilteredResult';
import PersonList from '../components/PersonList';
import BulkActionsBar from '../components/BulkActionsBar';
import BulkEditTagsModal from '../components/BulkEditTagsModal';

const GenerationPage = () => {
    // Data states
    const [people, setPeople] = useState([]);
    const [allUniqueTags, setAllUniqueTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    // Interaction states
    const [tagStates, setTagStates] = useState({}); // neutral, 'include', 'exclude'
    const [selectedPeople, setSelectedPeople] = useState(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    const fetchAllData = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            // We now fetch solicitation data as well
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

            const { data: tagsData, error: tagsError } = await supabase.from('tags').select('name');
            if (tagsError) throw tagsError;
            setAllUniqueTags(tagsData.map(t => t.name).sort());

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [session, fetchAllData]);

    const filteredPeople = useMemo(() => {
        const includedTags = Object.keys(tagStates).filter(tag => tagStates[tag] === 'include');
        const excludedTags = Object.keys(tagStates).filter(tag => tagStates[tag] === 'exclude');

        // If no tags are included, the generation list is empty.
        if (includedTags.length === 0) {
            return [];
        }

        return people.filter(person => {
            const hasIncludedTag = includedTags.some(tag => person.tags.includes(tag));
            const hasExcludedTag = excludedTags.some(tag => person.tags.includes(tag));
            
            return hasIncludedTag && !hasExcludedTag;
        });
    }, [people, tagStates]);

    const handleToggleFilterTag = (tag) => {
        setTagStates(prevStates => {
            const newStates = { ...prevStates };
            const currentState = newStates[tag];

            if (currentState === 'include') {
                newStates[tag] = 'exclude'; // From include to exclude
            } else if (currentState === 'exclude') {
                delete newStates[tag]; // From exclude to neutral
            } else {
                newStates[tag] = 'include'; // From neutral to include
            }
            
            // When filter changes, we should clear the current selection
            setSelectedPeople(new Set());
            return newStates;
        });
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

    const handleBulkAddTags = async (tagsToAdd) => {
        try {
            setLoading(true);
            const { data: tagsData, error: tagsError } = await supabase.from('tags').select('id, name').in('name', tagsToAdd);
            if (tagsError) throw tagsError;

            const associations = Array.from(selectedPeople).flatMap(personId =>
                tagsData.map(tag => ({ person_id: personId, tag_id: tag.id }))
            );

            if (associations.length > 0) {
                await supabase.from('person_tags').upsert(associations, { onConflict: 'person_id, tag_id' });
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
            const { data: tagsData, error: tagsError } = await supabase.from('tags').select('id').in('name', tagsToRemove);
            if (tagsError) throw tagsError;
            const tagIdsToRemove = tagsData.map(t => t.id);

            if (tagIdsToRemove.length > 0 && selectedPeople.size > 0) {
                await supabase.from('person_tags').delete().in('person_id', Array.from(selectedPeople)).in('tag_id', tagIdsToRemove);
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
    
    const handleAddNewTagToSystem = async (newTagName) => {
        const { data, error } = await supabase.from('tags').insert([{ name: newTagName.trim() }]).select();
        if (error && error.code !== '23505') { 
            console.error("Error adding tag:", error);
        }
        if (data) {
            await fetchAllData();
        }
    };

    const handleCopyToClipboard = async () => {
        const textToCopy = filteredPeople
            .map(p => `@${p.firstname}${p.lastname}`)
            .join(' ');
        
        if (!textToCopy) {
            alert("Aucune personne à copier.");
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            alert('Liste copiée dans le presse-papiers !');

            // Now, let's update the solicitation count in the database
            const personIdsToUpdate = filteredPeople.map(p => p.id);
            if (personIdsToUpdate.length > 0) {
                const { error } = await supabase.rpc('increment_solicitation', { person_ids: personIdsToUpdate });
                if (error) {
                    console.error("Error updating solicitation count:", error);
                } else {
                    // Refresh data to show updated counts
                    await fetchAllData();
                }
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Erreur lors de la copie.');
        }
    };

    if (loading) {
        return <div>Chargement...</div>;
    }

    return (
        <>
            <FilteredResult 
                people={filteredPeople} 
                existingTags={allUniqueTags}
                tagStates={tagStates}
                onToggleTag={handleToggleFilterTag}
                onCopy={handleCopyToClipboard}
            />
            
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
                    onDelete={() => {}}
                    onStartEdit={() => {}}
                    selectedIds={Array.from(selectedPeople)}
                    onToggleSelect={handleSelectPerson}
                    showActions={false}
                />
            </section>

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
        </>
    );
};

export default GenerationPage; 