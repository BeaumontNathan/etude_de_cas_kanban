# Stratégie CI/CD — Jaydee Kanban

Application interne maintenue par une petite équipe, code hébergé sur GitHub : **GitHub Actions** est retenu, car il est intégré au dépôt et n'impose aucun serveur CI à maintenir.

## Objectifs

- **Automatisation** : chaque modification est installée, testée et construite sans action manuelle.
- **Fiabilité** : l'image Docker validée par la CI est celle qui est déployée ; un test en échec bloque la livraison.
- **Qualité** : tests d'intégration (Vitest + Supertest), compilation TypeScript, audit des dépendances, relecture de code.

## Déclencheurs

| Événement | Pipeline | Effet |
|---|---|---|
| `push` sur `main` | CI | Vérifie l'état de la branche principale |
| `pull_request` vers `main` | CI | Fusion bloquée tant que la CI échoue |
| `release` publiée (tag `vX.Y.Z`) | CI puis CD | Image versionnée publiée puis déployée |

## Étapes du pipeline

1. **Installation** : `npm ci` sous Node 20, à partir du `package-lock.json` (versions figées, cache npm).
2. **Tests** : `npm test` (MongoDB en mémoire, aucune base externe) et `npm audit --omit=dev --audit-level=high`.
3. **Build** : `docker build` de l'image de production, qui compile le TypeScript. Sur une release, l'image est taguée `vX.Y.Z` et poussée vers le registre GitHub (GHCR).
4. **Déploiement** : sur le serveur interne, `docker compose pull` puis `docker compose up -d` avec la nouvelle version, suivi d'un contrôle `GET /health`. En cas d'échec, le tag précédent est redéployé.

## Extrait YAML (`.github/workflows/ci.yml`)

```yaml
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  ci:
    runs-on: ubuntu-latest
    env: { MONGODB_URI: "mongodb://localhost:27017/ci", JWT_SECRET: "${{ secrets.JWT_SECRET_CI }}" }
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm audit --omit=dev --audit-level=high
      - run: docker build -t jaydee-kanban .
```

`MONGODB_URI` et `JWT_SECRET` sont exigées par `src/config/env.ts` au chargement de l'application, y compris pendant les tests.

## Gestion des secrets

- Aucun secret dans le dépôt ni dans l'image : `.env` est exclu par `.gitignore` et `.dockerignore`, `.env.example` liste les variables sans valeur réelle.
- En CI : secrets GitHub Actions (`JWT_SECRET_CI`, accès au registre, clé SSH de déploiement), masqués dans les logs et distincts par environnement.
- En production : `JWT_SECRET` aléatoire d'au moins 32 caractères, stocké uniquement dans le `.env` du serveur (lecture réservée au compte de service) et renouvelé en cas de fuite.

## Validations avant mise en production

- Branche `main` protégée : pull request obligatoire, CI verte et relecture approuvée.
- Déploiement uniquement depuis une release de `main` numérotée (SemVer) avec notes de version.
- Environnement GitHub `production` soumis à une approbation manuelle avant le déploiement.
- Après déploiement : `GET /health` doit répondre 200 et les logs ne doivent pas contenir d'erreur, sinon retour à la version précédente.
