import React, { useState, useEffect, useMemo } from 'react';
import Tag from './Tag';

const EditPersonModal = ({ person, onUpdate, onCancel, existingTags, onSaveAndCreateTags }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (person && existingTags) {
      setFirstname(person.firstname);
      setLastname(person.lastname);
      const initialTags = existingTags.filter(tagObject => person.tags?.includes(tagObject.name));
      setPersonTags(initialTags);
    }
  }, [person?.id, existingTags]);

  useEffect(() => {
    if (person && existingTags) {
       const updatedTags = existingTags.filter(tagObject => person.tags?.includes(tagObject.name));
       setPersonTags(updatedTags);
    }
  }, [person?.tags, existingTags]);

  if (!person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = { 
      ...person, 
      firstname: firstname.trim(), 
      lastname: lastname.trim(), 
      tags: personTags.map(t => t.name)
    };
    onUpdate(updatedPerson);
  };

  const handleSaveAndCreate = () => {
    const newTagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (newTagNames.length > 0 && onSaveAndCreateTags) {
      const personWithCurrentState = { 
          ...person, 
          firstname: firstname.trim(), 
          lastname: lastname.trim(), 
          tags: personTags.map(t => t.name)
      };
      onSaveAndCreateTags(personWithCurrentState, newTagNames);
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

  const [priorityTags, otherTags] = useMemo(() => {
      const assignedTagNames = new Set(personTags.map(t => t.name));
      const priority = existingTags.filter(t => t.is_priority && !assignedTagNames.has(t.name));
      const other = existingTags.filter(t => !t.is_priority && !assignedTagNames.has(t.name));
      return [priority, other];
  }, [existingTags, personTags]);

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={onCancel}>&times;</span>
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
          {priorityTags.length > 0 && (
            <div className="form-group">
              <label>Tags prioritaires</label>
              <div className="tags-container">
                {priorityTags.map(tag => (
                  <Tag key={tag.name} onClick={() => handleToggleTag(tag)} isPriority={tag.is_priority}>{tag.name}</Tag>
                ))}
              </div>
            </div>
          )}
          {otherTags.length > 0 && (
            <div className="form-group">
              <label>Autres tags</label>
              <div className="tags-container">
                {otherTags.map(tag => (
                  <Tag key={tag.name} onClick={() => handleToggleTag(tag)} isPriority={tag.is_priority}>{tag.name}</Tag>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="modal-new-tag">Ou créer, sauvegarder et assigner</label>
            <div className="input-group">
              <input
                type="text"
                id="modal-new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nouveaux tags (séparés par une virgule)..."
              />
              <button type="button" onClick={handleSaveAndCreate} className="button">Créer & Sauvegarder</button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="button">Enregistrer & Fermer</button>
            <button type="button" className="button secondary" onClick={onCancel}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal; 