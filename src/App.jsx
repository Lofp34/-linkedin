import React, { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import AddPersonForm from './components/AddPersonForm';
import PersonList from './components/PersonList';
import FilteredResult from './components/FilteredResult';
import ManualSelection from './components/ManualSelection';
import EditPersonModal from './components/EditPersonModal';
import ImportCSV from './components/ImportCSV';

function App() {
  const [people, setPeople] = useLocalStorage('linkedin_people_tagger', []);
  const [manuallySelected, setManuallySelected] = useState([]);
  const [editingPerson, setEditingPerson] = useState(null);

  const existingTags = useMemo(() => {
    const allTags = people.flatMap(p => p.tags);
    return [...new Set(allTags)].sort();
  }, [people]);

  const handleAddPerson = (newPerson) => {
    setPeople([...people, newPerson]);
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

  const handleDeletePerson = (personId) => {
    setPeople(people.filter(p => p.id !== personId));
  };

  const handleUpdatePerson = (updatedPerson) => {
    setPeople(people.map(p => p.id === updatedPerson.id ? updatedPerson : p));
    setEditingPerson(null); // Close modal on update
  };

  const handleAddToSelection = (person) => {
    // Avoid adding duplicates to the manual selection
    if (!manuallySelected.find(p => p.id === person.id)) {
      setManuallySelected([...manuallySelected, person]);
    }
  };

  const handleClearSelection = () => {
    setManuallySelected([]);
  };

  return (
    <div className="container">
      <h1>LinkedIn Tag Manager</h1>
      
      <AddPersonForm onAddPerson={handleAddPerson} existingTags={existingTags} />
      
      <ImportCSV onImport={handleImport} />

      <FilteredResult people={people} existingTags={existingTags} />

      <ManualSelection selectedPeople={manuallySelected} onClear={handleClearSelection} />
      
      <PersonList 
        people={people} 
        onDeletePerson={handleDeletePerson}
        onAddToSelection={handleAddToSelection}
        onStartEdit={setEditingPerson}
      />

      {editingPerson && (
        <EditPersonModal 
            person={editingPerson}
            onUpdate={handleUpdatePerson}
            onCancel={() => setEditingPerson(null)}
            existingTags={existingTags}
        />
      )}

    </div>
  );
}

export default App; 