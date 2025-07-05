import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import useDebounce from '../hooks/useDebounce';
import { useSessionStorage } from '../hooks/useSessionStorage';

// Components for this page
import FilteredResult from '../components/FilteredResult';
import PersonList from '../components/PersonList';
import BulkActionsBar from '../components/BulkActionsBar';
import BulkEditTagsModal from '../components/BulkEditTagsModal';

const GenerationPage = () => {
    // Data states
    const [filteredPeople, setFilteredPeople] = useState([]);
    const [allUniqueTags, setAllUniqueTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    // Filter states are now persisted in sessionStorage
    const [tagStates, setTagStates] = useSessionStorage('generation_tagStates', {});
    const [maxSolicitations, setMaxSolicitations] = useSessionStorage('generation_maxSolicitations', '');
    const [solicitedBefore, setSolicitedBefore] = useSessionStorage('generation_solicitedBefore', null);

    // Debounced values
    const debouncedMaxSolicitations = useDebounce(maxSolicitations, 500);
    const debouncedSolicitedBefore = useDebounce(solicitedBefore, 500);

    // Selection states
    const [selectedPeople, setSelectedPeople] = useState(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // This is now the single source of truth for the text to be copied
    const textToCopy = useMemo(() => {
        return filteredPeople
            .map(p => `@${p.firstname} ${p.lastname}`) // Corrected format with space
            .join(' ');
    }, [filteredPeople]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Initial data fetch (all tags for the filter UI)
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!session) return;
            setLoading(true);
            try {
                const { data: tagsData, error: tagsError } = await supabase.from('tags').select('name');
                if (tagsError) throw tagsError;
                setAllUniqueTags(tagsData.map(t => t.name).sort());
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        };
        if (session) {
            fetchInitialData();
        }
    }, [session]);

    // Dynamic filtering effect
    useEffect(() => {
        const fetchFilteredData = async () => {
            if (!session) return;
            
            const includedTags = Object.keys(tagStates).filter(tag => tagStates[tag] === 'include');
            if (includedTags.length === 0) {
                setFilteredPeople([]);
                return;
            }

            setLoading(true);
            const excludedTags = Object.keys(tagStates).filter(tag => tagStates[tag] === 'exclude');
            let excludedPersonIds = [];

            // Step 1: Get IDs of people who have excluded tags
            if (excludedTags.length > 0) {
                const { data: excludedData, error: excludedError } = await supabase
                    .from('person_tags')
                    .select('person_id')
                    .in('tag_id', (await supabase.from('tags').select('id').in('name', excludedTags)).data.map(t => t.id));
                
                if (excludedData) {
                    excludedPersonIds = excludedData.map(item => item.person_id);
                }
            }

            // Step 2: Build the main query
            let query = supabase
                .from('people')
                .select(`id, firstname, lastname, solicitation_count, last_solicitation_date, tags!inner(name)`)
                .in('tags.name', includedTags);

            if (excludedPersonIds.length > 0) {
                query = query.not('id', 'in', `(${excludedPersonIds.join(',')})`);
            }
            if (debouncedMaxSolicitations) {
                query = query.lte('solicitation_count', parseInt(debouncedMaxSolicitations, 10));
            }
            if (debouncedSolicitedBefore) {
                // The value is already a string, we just need to format it for the query
                const formattedDate = debouncedSolicitedBefore.split('T')[0];
                query = query.or(`last_solicitation_date.is.null,last_solicitation_date.lte.${formattedDate}`);
            }

            try {
                const { data, error } = await query;
                if (error) throw error;
                const transformed = data.map(p => ({ ...p, tags: p.tags.map(t => t.name) }));
                setFilteredPeople(transformed);
            } catch (error) {
                console.error("Error fetching filtered data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredData();
    }, [session, tagStates, debouncedMaxSolicitations, debouncedSolicitedBefore, refreshTrigger]);

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

    const handleResetFilters = () => {
        setTagStates({});
        setMaxSolicitations('');
        setSolicitedBefore(null);
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
            setRefreshTrigger(t => t + 1); // Trigger a refresh
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
            setRefreshTrigger(t => t + 1); // Trigger a refresh
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
            setRefreshTrigger(t => t + 1); // Trigger a refresh
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
            setRefreshTrigger(t => t + 1); // Trigger a refresh
        }
    };

    const handleCopyToClipboard = async () => {
        if (!textToCopy) {
            alert("Aucune personne à copier.");
            return;
        }
        try {
            await navigator.clipboard.writeText(textToCopy);
            alert('Liste copiée dans le presse-papiers !');
            setRefreshTrigger(t => t + 1);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Erreur lors de la copie.');
        }
    };

    // This function receives a Date object from the picker and stores its string representation
    const handleDateChange = (date) => {
        setSolicitedBefore(date ? date.toISOString() : null);
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
                onReset={handleResetFilters}
                maxSolicitations={maxSolicitations}
                onMaxSolicitationsChange={setMaxSolicitations}
                solicitedBefore={solicitedBefore ? new Date(solicitedBefore) : null}
                onSolicitedBeforeChange={handleDateChange}
                textToCopy={textToCopy}
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