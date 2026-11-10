# Tests

Tests unitaires et d'intégration pour l'API Kanban.

## Structure

- `setup.ts` - Configuration de la base de données de test (connexion, nettoyage)
- `helpers.ts` - Fonctions utilitaires pour créer des données de test
- `auth.test.ts` - Tests des routes d'authentification
- `columns.test.ts` - Tests des routes des colonnes
- `ofs.test.ts` - Tests des routes des OFs
- `app.test.ts` - Tests de l'application (health check)
- `security.test.ts` - Tests des mesures de sécurité (helmet, rate limiting, 401)

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm test -- --watch

# Exécuter les tests avec couverture de code
npm run test:coverage

# Exécuter un fichier de test spécifique
npm test -- tests/auth.test.ts
```

## Configuration

Les tests utilisent **MongoDB Memory Server**, une instance MongoDB en mémoire qui se crée et se détruit automatiquement pour chaque suite de tests.

**Avantages** :
- ✅ Pas besoin d'installer ou de démarrer MongoDB localement
- ✅ Isolation complète entre les tests
- ✅ Exécution plus rapide (en mémoire)
- ✅ Pas de risque de pollution de données entre les tests

Le serveur MongoDB en mémoire démarre automatiquement avant les tests et s'arrête après. Aucune configuration supplémentaire n'est nécessaire.

## Helpers disponibles

Le fichier `helpers.ts` fournit des fonctions utilitaires pour faciliter l'écriture des tests :

- `createTestUser(email, password)` - Crée un utilisateur de test
- `getAuthToken(user)` - Génère un token JWT pour un utilisateur
- `createTestColumn(name, position)` - Crée une colonne de test
- `createTestOF(columnId, title, description, position)` - Crée un OF de test

## Exemple d'utilisation

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createTestUser, getAuthToken } from './helpers.js';
import './setup.js';

const app = createApp();

describe('My Feature', () => {
  it('should do something', async () => {
    const user = await createTestUser();
    const token = getAuthToken(user);

    const response = await request(app)
      .get('/api/some-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

## Nettoyage automatique

La base de données est automatiquement nettoyée après chaque test grâce au fichier `setup.ts`. Tous les documents des collections User, Column et OF sont supprimés entre les tests pour garantir l'isolation.

