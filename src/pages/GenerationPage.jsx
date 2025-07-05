import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useContacts, TAG_CATEGORIES } from '../contexts/ContactsContext';
import useDebounce from '../hooks/useDebounce';
import { useSessionStorage } from '../hooks/useSessionStorage';

// Components for this page
import FilteredResult from '../components/FilteredResult';
import PersonList from '../components/PersonList';
import BulkActionsBar from '../components/BulkActionsBar';
import BulkEditTagsModal from '../components/BulkEditTagsModal';
import CollapsibleTagSection from '../components/CollapsibleTagSection';

const GenerationPage = () => {
    // Utiliser le contexte pour les opérations de base
    const {
        session,
        allUniqueTags,
        deleteMultiplePeople,
        bulkAddTags,
        bulkRemoveTags,
        addTagToSystem,
        operationLoading
    } = useContacts();

    // États spécifiques à cette page
    const [filteredPeople, setFilteredPeople] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const [openCategory, setOpenCategory] = useState(null); // Pour le mode accordion

    // This is now the single source of truth for the text to be copied
    const textToCopy = useMemo(() => {
        return filteredPeople
            .map(p => `@${p.firstname} ${p.lastname}`)
            .join(' ');
    }, [filteredPeople]);

    // Noms des tags pour les filtres (seulement les noms)
    const tagNames = useMemo(() => {
        return allUniqueTags.map(tag => tag.name).sort();
    }, [allUniqueTags]);

    // Organiser les tags par catégorie pour les filtres
    const tagsByCategory = useMemo(() => {
        const grouped = {};
        
        TAG_CATEGORIES.forEach(category => {
            grouped[category] = allUniqueTags
                .filter(tag => (tag.category === category || (!tag.category && category === 'Non classée')))
                .map(tag => tag.name)
                .sort();
        });
        
        return grouped;
    }, [allUniqueTags]);

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
            await deleteMultiplePeople(Array.from(selectedPeople));
            setSelectedPeople(new Set()); // Clear selection
            setRefreshTrigger(t => t + 1); // Trigger a refresh
        } catch (error) {
            console.error("Error deleting selected people:", error);
        }
    };

    const handleBulkUpdateTags = async (tags, action) => {
        const personIds = Array.from(selectedPeople);
        if (personIds.length === 0) return;
        
        try {
            if (action === 'add') {
                await bulkAddTags(personIds, tags);
            } else if (action === 'remove') {
                await bulkRemoveTags(personIds, tags);
            }
            setIsBulkEditModalOpen(false);
            setSelectedPeople(new Set());
            setRefreshTrigger(t => t + 1); // Trigger a refresh
        } catch (error) {
            console.error(`Error bulk ${action}ing tags:`, error);
        }
    };

    const handleAddNewTagToSystem = async (newTagName) => {
        try {
            await addTagToSystem(newTagName);
        } catch (error) {
            console.error("Error adding tag:", error);
        }
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            alert("Texte copié dans le presse-papiers !");
        } catch (err) {
            console.error("Failed to copy text: ", err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert("Texte copié dans le presse-papiers !");
            } catch (fallbackErr) {
                console.error("Fallback copy failed: ", fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleDateChange = (date) => {
        setSolicitedBefore(date ? date.toISOString() : null);
    };

    const handleCategoryToggle = (categoryTitle) => {
        setOpenCategory(openCategory === categoryTitle ? null : categoryTitle);
    };

    return (
        <div className="generation-page">
            {/* Header avec résultats et infos */}
            <div className="results-header">
                <h3>Résultats ({filteredPeople.length})</h3>
                <div className="results-info">
                    <div className="info-item">
                        <span className="info-label">Nb max de sollicitations:</span>
                        <span className="info-value">{maxSolicitations || 'Pas de limite'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Dernière sollicitation avant:</span>
                        <span className="info-value">{solicitedBefore ? new Date(solicitedBefore).toLocaleDateString() : 'Pas de limite'}</span>
                    </div>
                </div>
            </div>

            {/* Résultats du filtre avec boutons */}
            {loading && <div>Chargement des résultats...</div>}
            
            {!loading && filteredPeople.length === 0 && (
                <div>Aucun résultat trouvé avec ces filtres.</div>
            )}
            
            {!loading && filteredPeople.length > 0 && (
                <FilteredResult
                    people={filteredPeople}
                    textToCopy={textToCopy}
                    onCopy={handleCopyToClipboard}
                    extraButton={
                        <button onClick={handleResetFilters} className="button secondary">
                            Réinitialiser les filtres
                        </button>
                    }
                />
            )}

            {/* Filtres */}
            <div className="filters-section">
                <h4>Tags (cliquez pour filtrer)</h4>
                <div className="tag-categories-container">
                    {TAG_CATEGORIES.map(category => {
                        const categoryTags = tagsByCategory[category] || [];
                        
                        if (categoryTags.length === 0) return null;
                        
                        return (
                            <CollapsibleTagSection
                                key={category}
                                title={category}
                                itemCount={categoryTags.length}
                                isAccordionMode={true}
                                isOpen={openCategory === category}
                                onToggle={handleCategoryToggle}
                            >
                                <div className="tag-filter-container">
                                    {categoryTags.map(tag => (
                                        <button
                                            key={tag}
                                            className={`tag-filter ${tagStates[tag] || 'neutral'}`}
                                            onClick={() => handleToggleFilterTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </CollapsibleTagSection>
                        );
                    })}
                </div>

                <div className="other-filters">
                    <div className="filter-group">
                        <label>
                            Nb max de sollicitations:
                            <input
                                type="number"
                                value={maxSolicitations}
                                onChange={(e) => setMaxSolicitations(e.target.value)}
                                min="0"
                                placeholder="Pas de limite"
                            />
                        </label>
                    </div>

                    <div className="filter-group">
                        <label>
                            Dernière sollicitation avant:
                            <input
                                type="date"
                                value={solicitedBefore ? solicitedBefore.split('T')[0] : ''}
                                onChange={(e) => handleDateChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Liste des personnes tout en bas */}
            {!loading && filteredPeople.length > 0 && (
                <div className="people-list-section">
                    <h4>Personnes enregistrées</h4>
                    
                    {selectedPeople.size > 0 && (
                        <BulkActionsBar
                            selectedCount={selectedPeople.size}
                            onSelectAll={handleSelectAll}
                            onDeselectAll={handleDeselectAll}
                            onBulkEdit={() => setIsBulkEditModalOpen(true)}
                            onBulkDelete={handleDeleteSelected}
                        />
                    )}
                    
                    <PersonList
                        people={filteredPeople}
                        onSelect={handleSelectPerson}
                        selectedPeople={selectedPeople}
                        showActions={false}
                    />
                </div>
            )}

            {/* Modals */}
            <BulkEditTagsModal
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                onUpdateTags={handleBulkUpdateTags}
                availableTags={tagNames}
                onAddNewTag={handleAddNewTagToSystem}
            />

            {/* Overlay de loading pour les opérations */}
            {operationLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">Opération en cours...</div>
                </div>
            )}
        </div>
    );
};

export default GenerationPage; 