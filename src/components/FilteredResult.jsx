import React, { useState, useMemo } from 'react';
import Tag from './Tag';

const FilteredResult = ({ people, existingTags }) => {
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [copySuccess, setCopySuccess] = useState('');

  const handleTagClick = (tag) => {
    setSelectedFilterTags(prevTags => {
      if (prevTags.includes(tag)) {
        return prevTags.filter(t => t !== tag); // Remove tag
      } else {
        return [...prevTags, tag]; // Add tag
      }
    });
  };

  const filteredPeople = useMemo(() => {
    if (selectedFilterTags.length === 0) {
      return people;
    }
    return people.filter(person => 
      person.tags.some(personTag => selectedFilterTags.includes(personTag.toLowerCase()))
    );
  }, [people, selectedFilterTags]);

  const resultString = useMemo(() => {
    return filteredPeople.map(p => `@${p.firstname} ${p.lastname}`).join(' ');
  }, [filteredPeople]);

  const handleCopy = () => {
    if (!resultString) return;
    navigator.clipboard.writeText(resultString).then(() => {
        setCopySuccess('Copié !');
        setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
        setCopySuccess('Erreur');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <section>
      <h2>Générer la liste (par filtres)</h2>
      <div className="form-group">
        <label>Cliquer sur un ou plusieurs tags pour filtrer :</label>
        <div className="tags-container" style={{ marginTop: '10px' }}>
          {existingTags.length > 0 ? (
            existingTags.map(tag => (
              <Tag
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={selectedFilterTags.includes(tag) ? 'active' : ''}
              >
                {tag}
              </Tag>
            ))
          ) : (
            <small>Aucun tag n'a encore été créé.</small>
          )}
        </div>
      </div>
      <div className="form-group" id="result-group">
        <label htmlFor="result">Résultat du filtre à copier ({filteredPeople.length} personne(s))</label>
        <textarea id="result" value={resultString} readOnly />
        <button id="copy-button" onClick={handleCopy} className={`button secondary ${copySuccess && 'success'}`}>
          {copySuccess || 'Copier'}
        </button>
      </div>
    </section>
  );
};

export default FilteredResult; 