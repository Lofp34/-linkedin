import React from 'react';
import { TAG_CATEGORIES } from '../contexts/ContactsContext';

const SettingsModal = ({ isOpen, onClose, tags, onDeleteTag, onTogglePriority }) => {
  if (!isOpen) return null;

  const handleDelete = (tagName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagName}" ? Il sera retiré de toutes les fiches de contact.`)) {
      onDeleteTag(tagName);
    }
  };

  // Grouper les tags par catégorie
  const tagsByCategory = tags.reduce((acc, tag) => {
    const category = tag.category || 'Non classée';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {});

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Gestion des Tags</h2>
        <p>Cliquez sur l'étoile pour marquer un tag comme prioritaire. Cliquez sur un tag pour le supprimer.</p>
        
        {tags.length > 0 ? (
          <div className="tags-management">
            {TAG_CATEGORIES.map(category => {
              const categoryTags = tagsByCategory[category] || [];
              
              if (categoryTags.length === 0) return null;
              
              return (
                <div key={category} className="category-section">
                  <h4 className="category-title">{category}</h4>
                  <ul className="tags-list">
                    {categoryTags.sort((a, b) => b.is_priority - a.is_priority).map(tag => (
                      <li key={tag.name}>
                        <button 
                          className={`priority-toggle ${tag.is_priority ? 'active' : ''}`}
                          onClick={() => onTogglePriority(tag.name, !tag.is_priority)}
                          title={tag.is_priority ? "Retirer la priorité" : "Marquer comme prioritaire"}
                        >
                          &#9733;
                        </button>
                        <span>{tag.name}</span>
                        <button className="button danger" onClick={() => handleDelete(tag.name)}>
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Aucun tag à gérer.</p>
        )}
        
        <style jsx>{`
          .tags-management {
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
          }
          .tags-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .tags-list li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-radius: 5px;
            background-color: white;
            margin-bottom: 5px;
            border: 1px solid #e0e0e0;
          }
          .tags-list li:nth-child(odd) {
            background-color: #f9f9f9;
          }
          .tags-list button {
            padding: 5px 10px;
            font-size: 0.9em;
          }
          .priority-toggle {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.5rem;
            color: #ccc;
            margin-right: 1rem;
          }
          .priority-toggle.active {
            color: #ffc107;
          }
          .category-section {
            margin-bottom: 2rem;
          }
        `}</style>

      </div>
    </div>
  );
};

export default SettingsModal; 