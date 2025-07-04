import React, { useState } from 'react';

const ImportCSV = ({ onImport }) => {
  const [file, setFile] = useState(null);
  // We use a key to reset the input field after successful import
  const [fileInputKey, setFileInputKey] = useState(Date.now()); 

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert('Veuillez sélectionner un fichier.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        alert('Le fichier CSV est vide ou mal formaté.');
        return;
      }

      const importedPeople = [];
      lines.forEach((line) => {
        const [firstnameRaw, lastnameRaw] = line.split(',');
        if (firstnameRaw && lastnameRaw) {
          const newPerson = {
            // A temporary ID will be replaced by a permanent one in App.jsx
            id: `import-${Math.random()}`, 
            firstname: firstnameRaw.trim(),
            lastname: lastnameRaw.trim(),
            tags: []
          };
          importedPeople.push(newPerson);
        }
      });
      
      onImport(importedPeople);

      // Reset the form and the file input
      setFile(null);
      setFileInputKey(Date.now());
    };

    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier.');
    };

    reader.readAsText(file);
  };

  return (
    <section>
      <h2>Importer depuis un CSV</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="csv-file-input">Fichier CSV</label>
          <input
            key={fileInputKey}
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileChange}
          />
          <small>Le fichier doit contenir 2 colonnes, sans en-tête : <strong>prénom,nom</strong>.</small>
        </div>
        <button type="submit">Importer</button>
      </form>
    </section>
  );
};

export default ImportCSV; 