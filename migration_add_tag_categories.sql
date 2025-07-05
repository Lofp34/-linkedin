-- Migration pour ajouter les catégories aux tags
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne category à la table tags
ALTER TABLE tags 
ADD COLUMN category VARCHAR(50);

-- Mettre à jour les tags existants avec une catégorie par défaut
-- (tu pourras les recatégoriser manuellement après)
UPDATE tags 
SET category = 'Non classée' 
WHERE category IS NULL;

-- Ajouter une contrainte NOT NULL après avoir mis à jour les données existantes
ALTER TABLE tags 
ALTER COLUMN category SET NOT NULL;

-- Optionnel : Ajouter une contrainte CHECK pour valider les catégories
ALTER TABLE tags 
ADD CONSTRAINT check_category 
CHECK (category IN (
    'Ville',
    'Secteur d''activité',
    'Poste', 
    'Entreprise',
    'Taille d''entreprise',
    'Type de relation',
    'Compétences',
    'Centre d''intérêt',
    'Statut',
    'Source',
    'Non classée'
));

-- Créer un index pour optimiser les requêtes par catégorie
CREATE INDEX idx_tags_category ON tags(category); 