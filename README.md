# 🚀 LinkedIn @-Creator : Votre Assistant de Ciblage Intelligent

Cette application web est conçue pour transformer la manière dont vous interagissez sur LinkedIn. Fini les listes de mentions génériques ! Avec **LinkedIn @-Creator**, vous pouvez gérer vos contacts, les segmenter avec une précision chirurgicale grâce à un système de tags avancé, et générer des listes de mentions `@` ultra-pertinentes pour maximiser l'impact de vos publications.

L'objectif ? Vous permettre d'atteindre les bonnes personnes, avec finesse et pertinence, pour chaque post.

## ✨ Fonctionnalités Principales

- **Authentification Sécurisée :** Créez votre compte et retrouvez vos données en toute sécurité depuis n'importe où.
- **Gestion de Contacts Simplifiée :** Ajoutez, modifiez et supprimez vos contacts intuitivement.
- **Taggage Stratégique :**
    - Créez une bibliothèque de tags personnalisés (`#React`, `#Marketing`, `#CEO`, `#Paris`, etc.).
    - Attribuez plusieurs tags à chaque contact pour une segmentation fine.
- **Import en Masse via CSV :** Importez votre liste de contacts existante en un clin d'œil. L'application détecte et écarte les doublons pour garder votre base de données propre.
- **Filtrage Dynamique :** Sélectionnez un ou plusieurs tags pour générer instantanément une liste de contacts correspondants.
- **Actions Groupées :**
    - Sélectionnez plusieurs contacts directement depuis la liste.
    - Ajoutez ou supprimez des tags en masse pour des mises à jour rapides.
    - Supprimez plusieurs contacts en une seule action.
- **Gestion Globale des Tags :** "Nettoyez" ou supprimez des tags de l'ensemble de votre base de données via un panneau de réglages dédié.
- **Backend Robuste avec Supabase :** Toutes vos données (comptes, contacts, tags) sont stockées de manière persistante et sécurisée dans une base de données cloud.

## 🛠️ Stack Technique

- **Frontend :** [React](https://react.dev/) (initialisé avec [Vite](https://vitejs.dev/))
- **Backend & Base de Données :** [Supabase](https://supabase.io/) (PostgreSQL)
- **Authentification :** Supabase Auth
- **Styling :** CSS pur pour une personnalisation simple et rapide.

## ⚙️ Installation et Configuration

Pour lancer ce projet en local, suivez ces étapes :

1.  **Clonez le dépôt :**
    ```bash
    git clone [URL_DE_VOTRE_DEPOT_GITHUB]
    cd [NOM_DU_DOSSIER]
    ```

2.  **Installez les dépendances :**
    (Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé)
    ```bash
    npm install
    ```

3.  **Configurez Supabase :**
    - Créez un projet sur [Supabase](https://supabase.io/).
    - Dans le dossier `src/`, créez un fichier `supabaseClient.js`.
    - Ajoutez-y vos clés d'accès Supabase :
      ```javascript
      import { createClient } from '@supabase/supabase-js';

      const supabaseUrl = 'VOTRE_URL_SUPABASE';
      const supabaseAnonKey = 'VOTRE_CLE_ANON_SUPABASE';

      export const supabase = createClient(supabaseUrl, supabaseAnonKey);
      ```
    - **Important :** N'oubliez pas d'exécuter les scripts SQL fournis pour créer les tables (`people`, `tags`, `person_tags`) et configurer les politiques de sécurité (Row-Level Security).

4.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```

5.  **Ouvrez l'application :**
    Rendez-vous à l'adresse indiquée dans votre terminal (généralement `http://localhost:5173`).

---
_Développé pour optimiser la pertinence des interactions sur LinkedIn._ 