# Note de sécurité — Jaydee Kanban

## Risques identifiés

| Risque | Constat avant intervention | Mesure retenue |
|---|---|---|
| **Abus d'API et brute force** | Aucune limite de requêtes : mots de passe testables sans fin sur `/api/auth/login`, saturation possible de l'API | `express-rate-limit` |
| **En-têtes HTTP permissifs** | `X-Powered-By: Express` révèle la technologie ; pas de protection contre le MIME sniffing, le clickjacking ni d'en-tête HSTS ou CSP | `helmet` |

L'accès non autorisé est déjà couvert par le middleware JWT existant : toutes les routes `columns` et `ofs` renvoient **401** sans token ou avec un token invalide.

## Mesures mises en place

- **`helmet()`**, premier middleware de `src/app.ts` : supprime `X-Powered-By` et ajoute notamment `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` et `X-Frame-Options: SAMEORIGIN`.
- **`src/middlewares/rateLimit.middleware.ts`**, activé dans `src/app.ts` avant les routes :
  - `/api` : 300 requêtes par IP sur 15 minutes, au-delà réponse **429** ;
  - `/api/auth/login` : 10 échecs par IP sur 15 minutes (les connexions réussies ne sont pas décomptées) ;
  - en-têtes standard `RateLimit` et `RateLimit-Policy` pour informer le client.
- Les limiteurs sont créés à chaque appel de `createApp()` : chaque instance a son propre compteur, ce qui garde les tests indépendants.

## Vérifications

- `tests/security.test.ts` : en-têtes helmet présents, `X-Powered-By` absent, 401 sur une route protégée, en-têtes `RateLimit`, 429 à la 11ᵉ tentative de connexion échouée.
- `tests/columns.test.ts` : 401 sur `GET` et `POST /api/columns` sans token ou avec un token invalide, sans insertion en base.
- Contrôle manuel sur le conteneur Docker : mêmes en-têtes et même 429 obtenus avec `curl`.

## Autres bonnes pratiques appliquées

- Secrets hors du dépôt et de l'image (`.gitignore`, `.dockerignore`) ; `.env.example` sans valeur réelle.
- Conteneur exécuté avec l'utilisateur `node` (non root) ; MongoDB accessible uniquement depuis la machine hôte (`127.0.0.1`).
- Dépendances auditées (`npm audit` : 0 vulnérabilité) ; `CORS_ORIGIN` à restreindre à l'origine du front en production.

## Limites

- Compteurs stockés en mémoire : remis à zéro au redémarrage et non partagés entre plusieurs instances (un store Redis serait nécessaire).
- Derrière un reverse proxy ou un NAT, tous les clients partagent la même IP : il faut alors configurer `trust proxy` dans Express.
- HTTPS n'est pas géré par l'application : `Strict-Transport-Security` n'a d'effet que derrière un reverse proxy TLS.
- Pas de rôles et inscription ouverte : tout compte créé peut modifier toutes les données. Le token JWT est valable 7 jours, sans révocation.
- L'URI MongoDB est écrite en clair dans les logs au démarrage, et MongoDB n'a pas d'authentification dans le `docker-compose.yml` : à corriger si l'URI contient des identifiants ou si la base est exposée.
- `req.body` est transmis tel quel aux mises à jour Mongoose et un identifiant invalide renvoie 500 : à durcir dans les contrôleurs.
- Node 20 n'est plus supporté depuis avril 2026 : une migration vers une version LTS active est à planifier.
