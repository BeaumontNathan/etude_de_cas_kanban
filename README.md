# Jaydee Kanban — API

**Version** 1.0.0 · **Auteur** Nathan Beaumont · **Dépôt** [github.com/BeaumontNathan/etude_de_cas_kanban](https://github.com/BeaumontNathan/etude_de_cas_kanban)

## Présentation

Jaydee fabrique des pièces plastiques par injection. Son application interne **Jaydee Kanban** suit les ordres de fabrication (OF) dans un tableau Kanban organisé en colonnes. Elle repose sur une API REST **Node.js / Express 5 / TypeScript** connectée à **MongoDB** via Mongoose.

Ce dépôt prépare la mise en production de l'API : tests d'intégration, conteneurisation Docker, stratégie CI/CD et sécurisation.

| Document | Contenu |
|---|---|
| [ANALYSE_EXISTANT.md](ANALYSE_EXISTANT.md) | Structure du projet, risques constatés, priorités |
| [CI_CD_STRATEGIE.md](CI_CD_STRATEGIE.md) | Pipeline GitHub Actions, secrets, validations avant production |
| [NOTE_SECURITE.md](NOTE_SECURITE.md) | Risques traités, middlewares de sécurité, limites |
| [tests/README.md](tests/README.md) | Organisation des tests |

## Prérequis

- **Node.js 20** et npm
- **Docker** avec Docker Compose v2 (Docker Desktop sous Windows et macOS)
- **Git**
- MongoDB 7 est fourni par `docker-compose.yml` : aucune installation locale nécessaire.

### Variables d'environnement

Copier `.env.example` en `.env`, puis renseigner les valeurs. Le fichier `.env` ne doit jamais être versionné.

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `MONGODB_URI` | oui | — | URI MongoDB (`mongodb://localhost:27017/visiplus` en local) |
| `JWT_SECRET` | oui | — | Secret de signature des tokens, 32 caractères minimum |
| `NODE_ENV` | non | `development` | `development`, `production` ou `test` |
| `PORT` | non | `3000` | Port d'écoute de l'API |
| `JWT_EXPIRES_IN` | non | `7d` | Durée de validité des tokens |
| `CORS_ORIGIN` | non | `*` | Origine autorisée, à restreindre en production |

Générer un secret : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Installation et exécution en local

```bash
git clone https://github.com/BeaumontNathan/etude_de_cas_kanban.git
cd etude_de_cas_kanban
npm install                   # installe aussi le binaire MongoDB utilisé par les tests
cp .env.example .env          # PowerShell : Copy-Item .env.example .env
docker compose up -d mongo    # démarre uniquement MongoDB, sur 127.0.0.1:27017
npm run dev                   # API sur http://localhost:3000, rechargement automatique
```

Vérification : `http://localhost:3000/health` répond `{"status":"ok", ...}`. Arrêt : `Ctrl+C`, puis `docker compose stop mongo`.

Sans Docker pour l'API : `npm run build` puis `npm start` (compile vers `dist/` et lance `node dist/main.js`).

## Exécution avec Docker

```bash
docker compose up -d --build  # construit l'image et démarre l'API et MongoDB
docker compose ps             # état des conteneurs
docker compose logs -f api    # logs de l'API
docker compose down           # arrêt (ajouter -v pour supprimer les données)
```

- **Dockerfile** en deux étapes sur `node:20-alpine` : la première installe les dépendances et compile le TypeScript ; la seconde ne contient que les dépendances de production et `dist/`, s'exécute avec l'utilisateur `node` et lance `npm start`.
- **docker-compose.yml** : l'API attend que MongoDB soit prêt (healthcheck). Elle lit `JWT_SECRET` (obligatoire), `JWT_EXPIRES_IN` et `CORS_ORIGIN` depuis `.env`. `NODE_ENV=production` et `MONGODB_URI=mongodb://mongo:27017/visiplus` sont fixés par le compose. Les données sont conservées dans le volume `mongo-data`.
- Construire l'image seule : `docker build -t jaydee-kanban .`

## Tests

```bash
npm test                            # exécute toutes les suites une fois
npm test -- tests/columns.test.ts   # une seule suite
npm test -- --watch                 # mode watch
npm run test:coverage               # couverture de code
```

Les tests d'intégration utilisent Vitest, Supertest et MongoDB Memory Server : aucune base externe n'est nécessaire. `MONGODB_URI` et `JWT_SECRET` doivent toutefois être définies (`.env` ou variables d'environnement), car elles sont validées au chargement de l'application.

## Mise à jour

```bash
git pull                      # ou git checkout vX.Y.Z pour une version précise
npm install && npm test       # met à jour les dépendances et contrôle avant déploiement
docker compose up -d --build  # reconstruit et redémarre l'API
```

Vérifier ensuite `GET /health` et `docker compose logs api`. En cas de problème, revenir à la version précédente (`git checkout <tag précédent>`) et relancer `docker compose up -d --build`. Les données MongoDB sont conservées.

Pour les dépendances : `npm audit fix`, puis `npm test` et `docker compose build`. L'image utilise le npm de Node 20 : un `npm ci` qui échoue dans l'image signale un `package-lock.json` incohérent.

## API

Les routes `columns` et `ofs` exigent l'en-tête `Authorization: Bearer <token>`, obtenu via `register` ou `login`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | État du serveur |
| POST | `/api/auth/register` | Création de compte |
| POST | `/api/auth/login` | Connexion |
| GET, POST | `/api/columns` | Liste, création de colonne |
| GET, PUT, DELETE | `/api/columns/:id` | Lecture, modification, suppression |
| GET, POST | `/api/ofs` | Liste (filtre `?columnId=`), création d'OF |
| GET, PUT, DELETE | `/api/ofs/:id` | Lecture, modification, suppression |
| PATCH | `/api/ofs/:id/move` | Déplacement d'un OF |

## Structure du projet

```
├── src/
│   ├── main.ts, app.ts, server.ts   # entrée, application Express, démarrage
│   ├── config/                      # env (Zod), db (Mongoose), logger (Pino)
│   ├── models/                      # Column, OF, User
│   ├── routes/ et controllers/      # auth, columns, ofs
│   └── middlewares/                 # auth (JWT), validate (Zod), error, rateLimit
├── tests/                           # setup, helpers, app, auth, columns, ofs, security
├── Dockerfile, .dockerignore, docker-compose.yml
├── .env.example
└── ANALYSE_EXISTANT.md, CI_CD_STRATEGIE.md, NOTE_SECURITE.md
```

## Choix techniques

- **Tests** : Vitest et Supertest sur une base MongoDB en mémoire, pour des tests isolés et exécutables en CI sans service externe. `npm test` lance `vitest run` afin de se terminer.
- **Docker** : image multi-étapes légère, sans dépendances de développement ni secret, exécutée sans privilèges root. MongoDB n'est joignable que depuis la machine hôte.
- **CI/CD** : GitHub Actions avec tests, audit, build de l'image, puis déploiement sur release après approbation.
- **Corrections apportées** : compilation (`tsconfig.json` n'inclut plus `tests/`), configuration de MongoDB Memory Server dans `tests/setup.ts`, cohérence du `package-lock.json`.

## Sécurité

- **helmet** : en-têtes HTTP de sécurité, suppression de `X-Powered-By`.
- **express-rate-limit** : 300 requêtes par IP sur 15 minutes sur `/api`, et 10 échecs de connexion par IP sur 15 minutes sur `/api/auth/login` (réponse 429 au-delà).
- **JWT** : routes métier protégées (401 sans token valide), mots de passe hachés avec bcrypt.
- **Secrets** : `.env` exclu du dépôt et de l'image, `JWT_SECRET` validé au démarrage.

Le détail et les limites sont décrits dans [NOTE_SECURITE.md](NOTE_SECURITE.md).

## Dépannage

| Symptôme | Solution |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` au `npm run dev` | MongoDB n'est pas démarré : `docker compose up -d mongo` |
| `Invalid environment variables` | `.env` absent ou incomplet : le créer depuis `.env.example` |
| `JWT_SECRET must be set in .env` au `docker compose up` | Renseigner `JWT_SECRET` dans `.env` |
| `spawn EFTYPE` pendant `npm test` (Windows) | Binaire MongoDB des tests tronqué : supprimer `mongod-*.exe` dans `node_modules/.cache/mongodb-memory-server` puis relancer `npm test`, deux fois si la première exécution échoue sur un verrou |
