# Analyse de l'existant — Jaydee Kanban

## Structure du projet

API REST Node.js / Express 5 en TypeScript (ES modules), connectée à MongoDB via Mongoose. Architecture en couches : `routes` → `controllers` → `models`.

| Élément | Contenu |
|---|---|
| Fichiers clés | `src/main.ts` (point d'entrée), `src/app.ts` (application Express, réutilisée par les tests), `src/server.ts` (connexion MongoDB, écoute, arrêt), `src/config/env.ts` (validation Zod des variables) |
| Ressources | `auth` (inscription, connexion), `columns` (CRUD), `ofs` (CRUD + déplacement), `GET /health` |
| Middlewares | `auth` (JWT Bearer), `validate` (Zod), `error` (gestion globale des erreurs) |
| Dépendances | express 5, mongoose 8, jsonwebtoken, bcryptjs, zod 4, cors, dotenv, pino ; helmet et express-rate-limit installés mais non utilisés |
| Outillage | TypeScript 5.9, tsx, Vitest 4, Supertest 7, mongodb-memory-server 10 |
| Variables | `MONGODB_URI` (obligatoire, et non `MONGO_URI`), `JWT_SECRET` (obligatoire, 32 caractères min.), `PORT` (3000), `NODE_ENV`, `JWT_EXPIRES_IN` (7d), `CORS_ORIGIN` (`*`) |
| Tests existants | `app`, `auth`, `ofs` : 35 cas, tous valides (MongoDB en mémoire) ; `columns.test.ts` vide |

## Risques et anomalies constatés

| # | Constat | Impact |
|---|---|---|
| 1 | `npm run build` échoue (TS6059) : `tsconfig.json` inclut `tests/` alors que `rootDir` vaut `src` | `npm start` et image de production impossibles |
| 2 | `setup.ts` impose MongoDB 7.0.0 alors que `npm install` fournit la 7.0.14 : second téléchargement (593 Mo sous Windows) qui dépasse le délai de 10 s du `beforeAll` au premier lancement ; option `skipMD5` obsolète ; `npm test` reste en mode watch ; routes colonnes non testées | Premier lancement en échec sur un poste neuf ou en CI |
| 3 | Ni en-têtes de sécurité ni limitation de débit, CORS ouvert à `*` | Brute force sur `/api/auth/login`, abus d'API |
| 4 | Inscription libre et aucun rôle : tout compte créé peut modifier ou supprimer toutes les données | Accès non autorisé |
| 5 | `.env` contenant le secret JWT réel, sans `.gitignore` ni `.env.example` ; `MONGODB_URI` écrite en clair dans les logs | Fuite de secrets |
| 6 | `npm audit` : 22 vulnérabilités (3 critiques, 14 hautes), dont mongoose, jws, zod et des dépendances d'Express | Failles connues exploitables |
| 7 | Identifiant invalide renvoyé en 500 ; `req.body` brut transmis à `findByIdAndUpdate` ; OF orphelins après suppression d'une colonne ; SIGINT/SIGTERM gérés deux fois (`server.ts`, `db.ts`) | Erreurs mal qualifiées, données incohérentes, arrêt brutal |
| 8 | README incohérent (`GET /api/columns` et `GET /api/ofs` annoncés publics mais protégés, Node 18 annoncé) ; Node 20 hors support depuis avril 2026 | Documentation trompeuse, runtime à faire évoluer |

## Priorités avant mise en production

1. Corriger la compilation (`tsconfig.json`) pour rendre `npm start` et Docker possibles.
2. Fiabiliser les tests (`setup.ts`, `vitest run`) et couvrir `GET` / `POST /api/columns`.
3. Activer `helmet` et `express-rate-limit`, restreindre `CORS_ORIGIN` en production.
4. Sortir les secrets du dépôt (`.gitignore`, `.env.example`).
5. Conteneuriser (Dockerfile, docker-compose avec MongoDB) et corriger les dépendances vulnérables.
6. Mettre à jour le README et formaliser la stratégie CI/CD.
