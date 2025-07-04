import React from 'react';
import Tag from './Tag';

const PersonItem = ({ person, onDeletePerson, onAddToSelection, onStartEdit, onToggleSelect, isSelected }) => {
  return (
    <li className={isSelected ? 'selected' : ''}>
      <input 
        type="checkbox" 
        className="person-item-checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(person.id)}
      />
      <div className="person-info">
        <strong>@{person.firstname} {person.lastname}</strong>
        <div className="tags-container">
          {person.tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
      <div className="person-list-actions">
        <button 
          className="button secondary add-btn"
          onClick={() => onAddToSelection(person)}
        >
          Ajouter
        </button>
        <button 
          className="button edit-btn"
          onClick={() => onStartEdit(person)}
        >
          Modifier
        </button>
        <button 
          className="button danger delete-btn"
          onClick={() => onDeletePerson(person.id)}
        >
          Supprimer
        </button>
      </div>
    </li>
  );
};

export default PersonItem; 