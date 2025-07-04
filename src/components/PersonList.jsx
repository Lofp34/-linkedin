import React from 'react';
import PersonItem from './PersonItem';

const PersonList = ({ people, onDeletePerson, onAddToSelection, onStartEdit, selectedIds, onToggleSelect }) => {
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
              onDeletePerson={onDeletePerson}
              onAddToSelection={onAddToSelection}
              onStartEdit={onStartEdit}
              isSelected={selectedIds.includes(person.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default PersonList; 