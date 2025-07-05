import React, { useState } from 'react';
import { useContacts } from '../contexts/ContactsContext';

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
    // Utiliser le contexte au lieu de gérer l'état localement
    const {
        people,
        allUniqueTags,
        loading,
        operationLoading,
        addPerson,
        updatePerson,
        deletePerson,
        deleteMultiplePeople,
        bulkAddTags,
        bulkRemoveTags,
        addTagToSystem,
        updateTagCategory,
        importPeople
    } = useContacts();

    // États locaux pour l'UI seulement
    const [selectedPeople, setSelectedPeople] = useState(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [openSections, setOpenSections] = useState({
        contactList: true, 
    });

    // Handlers simplifiés grâce au contexte
    const handleAddPerson = async (personData) => {
        try {
            await addPerson(personData);
        } catch (error) {
            console.error("Error adding person:", error);
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPeople.size} personne(s) ?`)) {
            return;
        }
        try {
            await deleteMultiplePeople(Array.from(selectedPeople));
            setSelectedPeople(new Set()); // Clear selection
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
        } catch (error) {
            console.error(`Error bulk ${action}ing tags:`, error);
        }
    };
    
    // Selection handlers
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

    const handleAddNewTagToSystem = async (newTagName, category = 'Non classée') => {
        try {
            await addTagToSystem(newTagName, category);
        } catch (error) {
            console.error("Error adding tag:", error);
        }
    };

    const handleImport = async (importedPeople) => {
        try {
            const results = await importPeople(importedPeople);
            alert(`Import terminé ! ${results.added} contacts ajoutés, ${results.skipped} ignorés.`);
        } catch (error) {
            console.error("Error importing people:", error);
            alert("Erreur lors de l'import. Veuillez réessayer.");
        }
    };

    const handleUpdatePerson = async (updatedPerson, closeModal = true) => {
        try {
            await updatePerson(updatedPerson);
            if (closeModal) {
                setEditingPerson(null);
            }
        } catch (error) {
            console.error("Error updating person:", error);
        }
    };

    const handleSaveAndCreateTags = async (personWithLocalChanges, newTagNames, category = 'Non classée') => {
        try {
            // Créer les nouveaux tags d'abord
            for (const tagName of newTagNames) {
                await addTagToSystem(tagName, category);
            }
            
            // Ensuite mettre à jour la personne (qui contient déjà les nouveaux tags)
            await updatePerson(personWithLocalChanges);
            
            // Mettre à jour editingPerson avec les nouvelles données pour rafraîchir le modal
            setEditingPerson(personWithLocalChanges);
            
            // NE PAS fermer le modal - on garde l'ancien comportement
        } catch (error) {
            console.error("Error saving person and creating tags:", error);
        }
    };

    const handleUpdateTagCategory = async (tagName, newCategory) => {
        try {
            await updateTagCategory(tagName, newCategory);
        } catch (error) {
            console.error("Error updating tag category:", error);
        }
    };

    const handleDeletePerson = async (personId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette personne ?")) {
            return;
        }
        try {
            await deletePerson(personId);
        } catch (error) {
            console.error("Error deleting person:", error);
        }
    };

    const toggleSection = (sectionName) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    // Affichage du loading principal
    if (loading) {
        return <div>Chargement des contacts...</div>;
    }

    return (
        <div className="contacts-page">
            <h2>Gestion des Contacts</h2>
            
            <CollapsibleSection 
                title="Ajouter un Contact" 
                isOpen={openSections.addPerson}
                onToggle={() => toggleSection('addPerson')}
            >
                <AddPersonForm
                    onSubmit={handleAddPerson}
                    availableTags={allUniqueTags}
                    onAddNewTag={handleAddNewTagToSystem}
                />
            </CollapsibleSection>

            <CollapsibleSection 
                title="Import CSV" 
                isOpen={openSections.importCSV}
                onToggle={() => toggleSection('importCSV')}
            >
                <ImportCSV onImport={handleImport} />
            </CollapsibleSection>

            <CollapsibleSection 
                title="Créer des Tags" 
                isOpen={openSections.tagCreator}
                onToggle={() => toggleSection('tagCreator')}
            >
                <TagCreator
                    onAddTag={handleAddNewTagToSystem}
                    existingTags={allUniqueTags}
                />
            </CollapsibleSection>

            <CollapsibleSection 
                title={`Liste des Contacts (${people.length})`}
                isOpen={openSections.contactList}
                onToggle={() => toggleSection('contactList')}
            >
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
                    people={people}
                    onEdit={setEditingPerson}
                    onDelete={handleDeletePerson}
                    onSelect={handleSelectPerson}
                    selectedPeople={selectedPeople}
                    showActions={true}
                />
            </CollapsibleSection>

            {/* Modals */}
            <BulkEditTagsModal
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                onUpdateTags={handleBulkUpdateTags}
                availableTags={allUniqueTags}
                onAddNewTag={handleAddNewTagToSystem}
            />

            {editingPerson && (
                <EditPersonModal
                    person={editingPerson}
                    onClose={() => setEditingPerson(null)}
                    onSave={handleUpdatePerson}
                    onSaveAndCreateTags={handleSaveAndCreateTags}
                    availableTags={allUniqueTags}
                    onUpdateTagCategory={handleUpdateTagCategory}
                />
            )}

            {/* Overlay de loading pour les opérations */}
            {operationLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">Opération en cours...</div>
                </div>
            )}
        </div>
    );
};

export default ContactsPage; 