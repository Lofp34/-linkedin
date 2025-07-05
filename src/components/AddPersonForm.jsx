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
      tags: personTags.map(t => t.name)
    };
    onAddPerson(newPerson);

    // Reset form
    setFirstname('');
    setLastname('');
    setPersonTags([]);
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

        <div className="form-group">
            <label>Cliquer pour assigner un tag existant</label>
            <div className="tags-container">
                {existingTags
                    .filter(tag => !personTags.some(pt => pt.name === tag.name))
                    .map(tag => (
                        <Tag key={tag.name} isActive={false} onClick={() => handleToggleTag(tag)} isPriority={tag.is_priority}>
                           {tag.name}
                        </Tag>
                ))}
            </div>
        </div>

        <button type="submit">Enregistrer la personne</button>
      </form>
    </section>
  );
};

export default AddPersonForm; 