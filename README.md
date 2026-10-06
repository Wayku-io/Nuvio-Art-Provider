# 🎨 Nuvio Art Provider (Top 10 Badges)

Art Provider Serverless pour Stremio, Nuvio et AIO Metadata.
Génère à la volée des affiches enrichies avec des badges **Glassmorphism Style 2** indiquant le classement (`#1` à `#10`) et la plateforme de streaming officielle (Netflix, Prime Video, Disney+, Apple TV+, HBO Max, Paramount+).

## 🚀 Déploiement sur Vercel

1. Pousser ce projet sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "feat: initial art provider setup"
   git remote add origin https://github.com/Wayku-io/TON-REPO.git
   git branch -M main
   git push -u origin main
   ```
2. Importer le projet sur [Vercel](https://vercel.com) et cliquer sur **Deploy**.

## ⚙️ Configuration dans AIO Metadata

1. Ouvre la page de configuration de ton instance **AIO Metadata**.
2. Va dans l'onglet **Art Providers** (ou Providers).
3. Sélectionne **Custom Art URLs** (ou Custom Poster Provider).
4. Renseigne dans le champ **Poster URL Pattern** :
   ```text
   https://TON-PROJET.vercel.app/api/poster?id={id}
   ```
   *(ou `https://TON-PROJET.vercel.app/poster/{id}.jpg`)*
5. Dans la liste de tes catalogues, assure-toi que l'icône étoile ⭐ (**Rating Posters**) est bien activée sur tes 12 catalogues Top 10 FlixPatrol.
6. Clique sur **Save Configuration** puis **Install** pour mettre à jour Stremio / Nuvio.

## ⚡ Performances & Cache

- **Génération instantanée** : Traitement d'image ultra-rapide avec `sharp`.
- **Edge Caching** : En-têtes `Cache-Control` configurés pour mise en cache globale sur le CDN Vercel.
- **Synchronisation temps réel** : Les classements sont synchronisés directement depuis ton manifest AIO Metadata.
