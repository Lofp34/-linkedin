import React from 'react';

const FilteredResult = ({ 
    people, 
    textToCopy,
    onCopy,
    extraButton
}) => {
    return (
        <div className="result-preview">
            <div id="result-group">
                <label htmlFor="result-textarea">Résultat du filtre</label>
                <textarea 
                    id="result-textarea" 
                    rows="5" 
                    value={textToCopy} 
                    readOnly 
                />
                <div className="result-actions">
                    <button onClick={onCopy} className="button-copy">
                        Copier
                    </button>
                    {extraButton}
                </div>
            </div>
        </div>
    );
};

export default FilteredResult; 