import React, { useState, useEffect, useMemo } from 'react';
import Tag from './Tag';
import { TAG_CATEGORIES } from '../contexts/ContactsContext';

const EditPersonModal = ({ 
  person, 
  onUpdate, 
  onSave,
  onCancel, 
  onClose,
  existingTags, 
  availableTags,
  onSaveAndCreateTags 
}) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Non classée');

  const normalizedTags = useMemo(() => {
    if (existingTags && Array.isArray(existingTags)) {
      return existingTags;
    } else if (availableTags && Array.isArray(availableTags)) {
      return availableTags.map(tag => 
        typeof tag === 'string' ? { 
          name: tag, 
          is_priority: false, 
          category: 'Non classée' 
        } : tag
      );
    }
    return [];
  }, [existingTags, availableTags]);

  useEffect(() => {
    if (person && normalizedTags.length > 0) {
      setFirstname(person.firstname);
      setLastname(person.lastname);
      const initialTags = normalizedTags.filter(tagObject => person.tags?.includes(tagObject.name));
      setPersonTags(initialTags);
    }
  }, [person?.id, normalizedTags]);

  useEffect(() => {
    if (person && normalizedTags.length > 0) {
       const updatedTags = normalizedTags.filter(tagObject => person.tags?.includes(tagObject.name));
       setPersonTags(updatedTags);
    }
  }, [person?.tags, normalizedTags]);

  if (!person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = { 
      ...person, 
      firstname: firstname.trim(), 
      lastname: lastname.trim(), 
      tags: personTags.map(t => t.name)
    };
    
    if (onUpdate) {
      onUpdate(updatedPerson);
    } else if (onSave) {
      onSave(updatedPerson);
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleSaveAndCreate = () => {
    const newTagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (newTagNames.length > 0 && onSaveAndCreateTags) {
      // Créer les objets tags pour les nouveaux tags avec catégorie
      const newTagObjects = newTagNames.map(name => ({ 
        name, 
        is_priority: false, 
        category: selectedCategory 
      }));
      
      // Ajouter automatiquement les nouveaux tags aux tags assignés
      setPersonTags(prevTags => [...prevTags, ...newTagObjects]);
      
      // Préparer la personne avec tous les tags (existants + nouveaux)
      const allTagNames = [...personTags.map(t => t.name), ...newTagNames];
      const personWithCurrentState = { 
          ...person, 
          firstname: firstname.trim(), 
          lastname: lastname.trim(), 
          tags: allTagNames
      };
      
      onSaveAndCreateTags(personWithCurrentState, newTagNames, selectedCategory);
      setNewTag('');
    }
  };

  const handleToggleTag = (tagObject) => {
    setPersonTags(prevTags =>
      prevTags.some(t => t.name === tagObject.name)
        ? prevTags.filter(t => t.name !== tagObject.name)
        : [...prevTags, tagObject]
    );
  };

  // Grouper les tags par catégorie pour l'affichage
  const tagsByCategory = useMemo(() => {
    if (!normalizedTags || !Array.isArray(normalizedTags)) {
      return {};
    }
    
    const assignedTagNames = new Set(personTags.map(t => t.name));
    const availableTagsByCategory = {};
    
    TAG_CATEGORIES.forEach(category => {
      availableTagsByCategory[category] = normalizedTags.filter(tag => 
        (tag.category === category || (!tag.category && category === 'Non classée')) && 
        !assignedTagNames.has(tag.name)
      );
    });
    
    return availableTagsByCategory;
  }, [normalizedTags, personTags]);

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={handleClose}>&times;</span>
        <h2>Modifier la personne</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-firstname">Prénom</label>
            <input
              type="text"
              id="edit-firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-lastname">Nom</label>
            <input
              type="text"
              id="edit-lastname"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Tags assignés</label>
            <div className="tags-container" style={{ minHeight: '30px', border: '1px solid var(--border-color)', borderRadius: '5px', padding: '10px', marginBottom: '10px' }}>
              {personTags.length > 0 ? (
                personTags.map(tag => (
                  <Tag 
                    key={tag.name} 
                    isActive={true} 
                    onClick={() => handleToggleTag(tag)} 
                    isPriority={tag.is_priority}
                  >
                    {tag.name}
                  </Tag>
                ))
              ) : (
                <span style={{color: '#888'}}>Aucun tag assigné</span>
              )}
            </div>
          </div>
          
          {/* Affichage des tags disponibles par catégorie */}
          {Object.keys(tagsByCategory).length > 0 && (
            <div className="form-group">
              <label>Tags disponibles par catégorie</label>
              {TAG_CATEGORIES.map(category => {
                const categoryTags = tagsByCategory[category] || [];
                
                if (categoryTags.length === 0) return null;
                
                return (
                  <div key={category} className="category-section">
                    <h4 className="category-title">{category}</h4>
                    <div className="tags-container">
                      {categoryTags.map(tag => (
                        <Tag 
                          key={tag.name} 
                          onClick={() => handleToggleTag(tag)} 
                          isPriority={tag.is_priority}
                        >
                          {tag.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="modal-new-tag">Créer et assigner un nouveau tag</label>
            <div className="create-tag-section">
              <div className="form-row">
                <select
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
                <input
                  type="text"
                  id="modal-new-tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nouveaux tags (séparés par une virgule)..."
                  className="new-tag-input"
                />
                <button type="button" onClick={handleSaveAndCreate} className="button">
                  Créer & Sauvegarder
                </button>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="button">Enregistrer & Fermer</button>
            <button type="button" className="button secondary" onClick={handleClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal; 