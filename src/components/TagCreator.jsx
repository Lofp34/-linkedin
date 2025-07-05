import React, { useState } from 'react';
import { TAG_CATEGORIES } from '../contexts/ContactsContext';

const TagCreator = ({ 
  onAddNewTag,
  onAddTag,
  existingTags = [],
  showCreateButton = true,
  autoFocus = false,
  onCancel = null,
  size = 'normal'
}) => {
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Non classée');

  const handleCreateTag = (e) => {
    e.preventDefault();
    const tagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    if (tagNames.length > 0) {
      // Utiliser la fonction disponible selon l'API
      const addTagFunction = onAddTag || onAddNewTag;
      
      if (typeof addTagFunction === 'function') {
        tagNames.forEach(tagName => {
          // Passer la catégorie si la fonction la supporte (nouvelle API)
          if (onAddTag) {
            addTagFunction(tagName, selectedCategory);
          } else {
            // Ancienne API sans catégorie
            addTagFunction(tagName);
          }
        });
        setNewTag('');
        if (onCancel) onCancel();
      } else {
        console.error('No valid callback function provided to TagCreator');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateTag(e);
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <section className="tag-creator-section">
      <h2>Créer un nouveau tag</h2>
      <form onSubmit={handleCreateTag} className="tag-creator-form">
        <div className="form-group">
          <label htmlFor="tag-category">Catégorie</label>
          <select
            id="tag-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {TAG_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="global-new-tag">Nom du tag</label>
          <div className="input-group">
            <input
              type="text"
              id="global-new-tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nouveaux tags (séparés par une virgule)..."
            />
            {showCreateButton && (
              <button type="submit" className="button">Créer</button>
            )}
            {onCancel && (
              <button type="button" onClick={onCancel} className="button secondary">
                Annuler
              </button>
            )}
          </div>
          <small>Les tags créés ici seront disponibles pour toutes les personnes dans la catégorie "{selectedCategory}".</small>
        </div>
      </form>
    </section>
  );
};

export default TagCreator; 