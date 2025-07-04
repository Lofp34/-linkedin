import React, { useState, useEffect } from 'react';
import Tag from './Tag';

const EditPersonModal = ({ person, onUpdate, onCancel, existingTags }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);

  useEffect(() => {
    if (person) {
      setFirstname(person.firstname);
      setLastname(person.lastname);
      setPersonTags(person.tags || []);
    }
  }, [person]);

  if (!person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = { ...person, firstname: firstname.trim(), lastname: lastname.trim(), tags: personTags };
    onUpdate(updatedPerson);
  };

  const handleToggleTag = (tag) => {
    setPersonTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

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
                  <Tag key={tag} isActive={true} onClick={() => handleToggleTag(tag)}>{tag}</Tag>
                ))
              ) : (
                <span style={{color: '#888'}}>Aucun tag assigné</span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Cliquer pour assigner un tag existant</label>
            <div className="tags-container">
              {existingTags.filter(t => !personTags.includes(t)).map(tag => (
                <Tag key={tag} isActive={false} onClick={() => handleToggleTag(tag)}>{tag}</Tag>
              ))}
            </div>
          </div>
          <button type="submit" className="button">Enregistrer</button>
          <button type="button" className="button secondary" onClick={onCancel} style={{ marginLeft: '10px' }}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal; 