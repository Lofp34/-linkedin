import React from 'react';
import PersonItem from './PersonItem';

const PersonList = ({ people, onDelete, onStartEdit, selectedIds, onToggleSelect, showActions }) => {
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
              onStartEdit={onStartEdit}
              isSelected={selectedIds.includes(person.id)}
              onToggleSelect={onToggleSelect}
              showActions={showActions}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default PersonList; 