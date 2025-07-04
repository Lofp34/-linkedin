import React, { useState, useMemo } from 'react';
import Tag from './Tag';

const FilteredResult = ({ people, existingTags, tagStates, onToggleTag, onCopy, onReset }) => {
    const textToCopy = useMemo(() => {
        return people.map(p => `@${p.firstname}${p.lastname}`).join(' ');
    }, [people]);

    return (
        <section className="filtered-result-container">
            <h2>Générer une liste de @</h2>
            <div className="tags-filter-container">
                <h3>Filtrer par tags</h3>
                <div className="tags-list">
                    {existingTags.map(tag => (
                        <Tag 
                            key={tag}
                            onClick={() => onToggleTag(tag)}
                            status={tagStates[tag]}
                        >
                            {tag}
                        </Tag>
                    ))}
                </div>
            </div>
            <div className="result-preview">
                <h3>Résultat ({people.length} personne(s))</h3>
                <div id="result-group">
                    <label htmlFor="result-textarea">Résultat du filtre</label>
                    <textarea 
                        id="result-textarea" 
                        rows="5" 
                        value={textToCopy} 
                        readOnly 
                    />
                    <button onClick={onCopy} className="button-copy">
                        Copier
                    </button>
                    <button onClick={onReset} className="button-reset button secondary">
                        Réinitialiser
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FilteredResult; 