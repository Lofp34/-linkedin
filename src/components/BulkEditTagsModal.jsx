import React, { useState } from 'react';
import Tag from './Tag';

const BulkEditTagsModal = ({ isOpen, onClose, allUniqueTags, onBulkAdd, onBulkRemove, selectedCount, onAddNewTagToSystem }) => {
  const [tagsToChange, setTagsToChange] = useState(new Set());
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

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
        if (trimmedTag) {
            onAddNewTagToSystem(trimmedTag);
            if (!tagsToChange.has(trimmedTag)) {
              setTagsToChange(prev => new Set(prev).add(trimmedTag));
            }
            setNewTag('');
        }
    }
  };

  const handleAddSubmit = () => {
    if (tagsToChange.size > 0) {
      onBulkAdd(Array.from(tagsToChange));
      resetState();
    }
  };
  
  const handleRemoveSubmit = () => {
    if (tagsToChange.size > 0) {
      onBulkRemove(Array.from(tagsToChange));
      resetState();
    }
  };
  
  const resetState = () => {
    setTagsToChange(new Set());
    setNewTag('');
    onClose();
  }

  return (
    <div className="modal" onClick={resetState}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-button" onClick={resetState}>&times;</span>
        <h2>Modifier les tags pour {selectedCount} personne(s)</h2>
        
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
            {allUniqueTags.filter(t => !tagsToChange.has(t)).map(tag => (
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