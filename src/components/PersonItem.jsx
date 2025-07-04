import React from 'react';
import Tag from './Tag';

const PersonItem = ({ person, onDelete, onStartEdit, onToggleSelect, isSelected, showActions }) => {
    
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <li className={isSelected ? 'selected' : ''}>
            <input 
                type="checkbox" 
                className="person-item-checkbox" 
                checked={isSelected}
                onChange={() => onToggleSelect(person.id)}
            />
            <div className="person-info">
                <strong>{person.firstname} {person.lastname}</strong>
                <div className="tags-container">
                    {person.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                </div>
                <div className="solicitation-info">
                    <span>Sollicitations : {person.solicitation_count || 0}</span>
                    {person.last_solicitation_date && (
                        <span>Dernière : {formatDate(person.last_solicitation_date)}</span>
                    )}
                </div>
            </div>
            {showActions && (
                <div className="person-list-actions">
                    <button onClick={() => onStartEdit(person)} className="button secondary">Modifier</button>
                    <button onClick={() => onDelete(person.id)} className="button danger">Supprimer</button>
                </div>
            )}
        </li>
    );
};

export default PersonItem; 