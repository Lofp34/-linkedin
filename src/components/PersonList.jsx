import React from 'react';
import PersonItem from './PersonItem';

const PersonList = ({ 
  people, 
  onDelete, 
  onEdit,
  onStartEdit,
  selectedIds,
  selectedPeople,
  onToggleSelect,
  onSelect,
  showActions 
}) => {
  const isPersonSelected = (personId) => {
    if (selectedPeople && selectedPeople.has) {
      return selectedPeople.has(personId);
    }
    if (selectedIds && selectedIds.includes) {
      return selectedIds.includes(personId);
    }
    return false;
  };

  const handleSelect = (personId) => {
    if (onSelect) {
      onSelect(personId);
    } else if (onToggleSelect) {
      onToggleSelect(personId);
    }
  };

  const handleEdit = (person) => {
    if (onEdit) {
      onEdit(person);
    } else if (onStartEdit) {
      onStartEdit(person);
    }
  };

  return (
    <section>
      <h2>Personnes enregistrées ({people.length})</h2>
      {people.length === 0 ? (
        <p>Aucune personne enregistrée pour le moment.</p>
      ) : (
        <ul id="person-list">
          {people.map(person => (
            <PersonItem 
              key={person.id} 
              person={person}
              onDelete={onDelete}
              onStartEdit={handleEdit}
              isSelected={isPersonSelected(person.id)}
              onToggleSelect={handleSelect}
              showActions={showActions}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default PersonList; 