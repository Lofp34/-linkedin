import React from 'react';

const FilteredResult = ({ 
    people, 
    textToCopy,
    onCopy,
}) => {
    return (
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
            </div>
        </div>
    );
};

export default FilteredResult; 