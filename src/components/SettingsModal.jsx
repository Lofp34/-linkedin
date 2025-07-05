import React from 'react';

const SettingsModal = ({ isOpen, onClose, tags, onDeleteTag, onTogglePriority }) => {
  if (!isOpen) return null;

  const handleDelete = (tagName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagName}" ? Il sera retiré de toutes les fiches de contact.`)) {
      onDeleteTag(tagName);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Gestion des Tags</h2>
        <p>Cliquez sur l'étoile pour marquer un tag comme prioritaire. Cliquez sur un tag pour le supprimer.</p>
        
        {tags.length > 0 ? (
          <ul className="tags-list">
            {tags.sort((a, b) => b.is_priority - a.is_priority).map(tag => (
              <li key={tag.name}>
                <button 
                  className={`priority-toggle ${tag.is_priority ? 'active' : ''}`}
                  onClick={() => onTogglePriority(tag.name, !tag.is_priority)}
                  title={tag.is_priority ? "Retirer la priorité" : "Marquer comme prioritaire"}
                >
                  &#9733;
                </button>
                <span>{tag.name}</span>
                <button className="button danger" onClick={() => handleDelete(tag.name)}>Supprimer</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun tag à gérer.</p>
        )}
        
        <style jsx>{`
          .tags-list {
            list-style: none;
            padding: 0;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
          }
          .tags-list li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-radius: 5px;
          }
          .tags-list li:nth-child(odd) {
            background-color: var(--secondary-color);
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
            color: #ffc107; /* Or gold */
          }
        `}</style>

      </div>
    </div>
  );
};

export default SettingsModal; 