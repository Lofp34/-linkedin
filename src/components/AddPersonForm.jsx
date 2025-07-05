import React, { useState } from 'react';
import Tag from './Tag';
import { TAG_CATEGORIES } from '../contexts/ContactsContext';
import CollapsibleTagSection from './CollapsibleTagSection';

const AddPersonForm = ({ 
  onAddPerson, // Ancienne API
  onSubmit, // Nouvelle API
  existingTags, // Ancienne API (array d'objets)
  availableTags, // Nouvelle API (array de strings)
  onAddNewTag // Nouvelle API pour créer des tags
}) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Non classée');

  // Normaliser les tags pour les deux APIs
  const normalizedTags = (() => {
    if (existingTags && Array.isArray(existingTags)) {
      // Ancienne API : array d'objets avec { name, is_priority, category }
      return existingTags;
    } else if (availableTags && Array.isArray(availableTags)) {
      // Nouvelle API : array de strings ou objets
      return availableTags.map(tagName => ({
        name: typeof tagName === 'string' ? tagName : tagName.name,
        is_priority: typeof tagName === 'object' ? tagName.is_priority : false,
        category: typeof tagName === 'object' ? tagName.category || 'Non classée' : 'Non classée'
      }));
    }
    return [];
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstname || !lastname) return;

    const newPerson = {
      id: Date.now(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      tags: personTags.map(t => t.name)
    };

    // Appeler la fonction appropriée selon l'API
    if (onSubmit) {
      onSubmit(newPerson); // Nouvelle API
    } else if (onAddPerson) {
      onAddPerson(newPerson); // Ancienne API
    }

    // Reset form
    setFirstname('');
    setLastname('');
    setPersonTags([]);
    setNewTag('');
  };

  const handleToggleTag = (tag) => {
    setPersonTags(prevTags => {
        const isAlreadySelected = prevTags.some(pt => pt.name === tag.name);
        if (isAlreadySelected) {
            return prevTags.filter(pt => pt.name !== tag.name);
        } else {
            return [...prevTags, tag];
        }
    });
  };

  const handleCreateAndAssignTag = () => {
    const tagName = newTag.trim();
    if (tagName && onAddNewTag) {
      // Créer le tag dans la base de données avec la catégorie
      onAddNewTag(tagName, selectedCategory);
      
      // Ajouter immédiatement le tag aux tags assignés
      const newTagObject = { 
        name: tagName, 
        is_priority: false, 
        category: selectedCategory 
      };
      setPersonTags(prevTags => [...prevTags, newTagObject]);
      
      setNewTag('');
    }
  };

  // Grouper les tags par catégorie pour l'affichage
  const tagsByCategory = normalizedTags.reduce((acc, tag) => {
    const category = tag.category || 'Non classée';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tag);
    return acc;
  }, {});

  return (
    <section>
      <h2>Ajouter une personne</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstname">Prénom</label>
          <input
            type="text"
            id="firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastname">Nom</label>
          <input
            type="text"
            id="lastname"
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
                        <Tag key={tag.name} isActive={true} onClick={() => handleToggleTag(tag)} isPriority={tag.is_priority}>
                            {tag.name}
                        </Tag>
                    ))
                ) : (
                    <span style={{color: '#888'}}>Aucun tag assigné</span>
                )}
            </div>
        </div>

        {/* Affichage des tags existants par catégorie */}
        {Object.keys(tagsByCategory).length > 0 && (
          <div className="form-group">
            <label>Cliquer pour assigner un tag existant</label>
            {TAG_CATEGORIES.map(category => {
              const categoryTags = tagsByCategory[category] || [];
              const availableCategoryTags = categoryTags.filter(tag => 
                !personTags.some(pt => pt.name === tag.name)
              );
              
              if (availableCategoryTags.length === 0) return null;
              
              return (
                <CollapsibleTagSection
                  key={category}
                  title={category}
                  itemCount={availableCategoryTags.length}
                  isOpenByDefault={false}
                >
                  <div className="tags-container">
                    {availableCategoryTags.map(tag => (
                      <Tag key={tag.name} isActive={false} onClick={() => handleToggleTag(tag)} isPriority={tag.is_priority}>
                        {tag.name}
                      </Tag>
                    ))}
                  </div>
                </CollapsibleTagSection>
              );
            })}
          </div>
        )}

        {/* Création de nouveau tag avec catégorie */}
        <div className="form-group">
          <label>Créer et assigner un nouveau tag</label>
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
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nom du nouveau tag..."
                className="new-tag-input"
              />
              <button type="button" onClick={handleCreateAndAssignTag} className="button">
                Créer & Assigner
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="button">Ajouter la personne</button>
      </form>
    </section>
  );
};

export default AddPersonForm; 