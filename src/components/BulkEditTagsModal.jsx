import React, { useState } from 'react';
import Tag from './Tag';

const BulkEditTagsModal = ({ 
  isOpen, 
  onClose, 
  // Ancienne API
  allUniqueTags, 
  onBulkAdd, 
  onBulkRemove, 
  selectedCount,
  onAddNewTagToSystem,
  // Nouvelle API
  availableTags,
  onUpdateTags,
  onAddNewTag
}) => {
  const [tagsToChange, setTagsToChange] = useState(new Set());
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  // Normaliser les données des tags pour les deux APIs
  const normalizedTags = (() => {
    if (allUniqueTags && Array.isArray(allUniqueTags)) {
      // Ancienne API : peut être array d'objets ou de strings
      return allUniqueTags.map(tag => 
        typeof tag === 'string' ? tag : tag.name
      );
    } else if (availableTags && Array.isArray(availableTags)) {
      // Nouvelle API : peut être array d'objets ou de strings
      return availableTags.map(tag => 
        typeof tag === 'string' ? tag : tag.name
      );
    }
    return [];
  })();

  // Fonction pour ajouter un nouveau tag
  const addNewTagFunction = onAddNewTag || onAddNewTagToSystem;

  const handleToggleTag = (tag) => {
    setTagsToChange(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const handleAddNewTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
        e.preventDefault();
        const trimmedTag = newTag.trim();
        if (trimmedTag && typeof addNewTagFunction === 'function') {
            addNewTagFunction(trimmedTag);
            if (!tagsToChange.has(trimmedTag)) {
              setTagsToChange(prev => new Set(prev).add(trimmedTag));
            }
            setNewTag('');
        }
    }
  };

  const handleAddSubmit = () => {
    if (tagsToChange.size > 0) {
      const tagsArray = Array.from(tagsToChange);
      
      if (onUpdateTags) {
        // Nouvelle API
        onUpdateTags(tagsArray, 'add');
      } else if (onBulkAdd) {
        // Ancienne API
        onBulkAdd(tagsArray);
      }
      resetState();
    }
  };
  
  const handleRemoveSubmit = () => {
    if (tagsToChange.size > 0) {
      const tagsArray = Array.from(tagsToChange);
      
      if (onUpdateTags) {
        // Nouvelle API
        onUpdateTags(tagsArray, 'remove');
      } else if (onBulkRemove) {
        // Ancienne API
        onBulkRemove(tagsArray);
      }
      resetState();
    }
  };
  
  const resetState = () => {
    setTagsToChange(new Set());
    setNewTag('');
    onClose();
  };

  return (
    <div className="modal" onClick={resetState}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-button" onClick={resetState}>&times;</span>
        <h2>Modifier les tags pour {selectedCount || 'plusieurs'} personne(s)</h2>
        
        <div className="form-group">
            <label>Gérer les tags</label>
            <small>Entrez un nouveau tag et appuyez sur Entrée, ou cliquez sur les tags existants pour les sélectionner.</small>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddNewTag}
                    placeholder="Ajouter ou créer un tag..."
                />
                <button type="button" onClick={handleAddNewTag}>Ajouter</button>
            </div>
        </div>

        <div className="form-group">
          <label>Tags à ajouter ou retirer :</label>
          <div className="tags-container" style={{ minHeight: '30px', border: '1px solid var(--border-color)', borderRadius: '5px', padding: '10px'}}>
            {tagsToChange.size === 0 ? (
                <span style={{color: '#888'}}>Aucun tag sélectionné</span>
            ) : (
                Array.from(tagsToChange).map(tag => (
                    <Tag 
                        key={tag}
                        isActive={true}
                        onClick={() => handleToggleTag(tag)}
                    >
                        {tag}
                    </Tag>
                ))
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Tags existants :</label>
          <div className="tags-container">
            {normalizedTags.filter(t => !tagsToChange.has(t)).map(tag => (
              <Tag 
                key={tag}
                isActive={false}
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleRemoveSubmit} className="danger" disabled={tagsToChange.size === 0}>
            Retirer des sélections
          </button>
          <button onClick={handleAddSubmit} className="success" disabled={tagsToChange.size === 0}>
            Ajouter aux sélections
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkEditTagsModal; 