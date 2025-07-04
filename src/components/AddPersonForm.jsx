import React, { useState } from 'react';
import Tag from './Tag';

const AddPersonForm = ({ onAddPerson, existingTags }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstname || !lastname) return;

    const newPerson = {
      id: Date.now(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      tags: personTags
    };
    onAddPerson(newPerson);

    // Reset form
    setFirstname('');
    setLastname('');
    setPersonTags([]);
  };

  const handleToggleTag = (tag) => {
    setPersonTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

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

        <button type="submit">Enregistrer la personne</button>
      </form>
    </section>
  );
};

export default AddPersonForm; 