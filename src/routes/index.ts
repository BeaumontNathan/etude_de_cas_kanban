import { Router } from 'express';
import authRoutes from './auth.routes.js';
import ofsRoutes from './ofs.routes.js';
import columnsRoutes from './columns.routes.js';

const router = Router();

/**
 * Main routes aggregator.
 * 
 * Registers all API routes and assigns base paths.
 * All routes are prefixed with /api in app.ts.
 * 
 * @example
 * ```typescript
 * import routes from './routes';
 * app.use('/api', routes);
 * ```
 */
router.use('/auth', authRoutes);
router.use('/ofs', ofsRoutes);
router.use('/columns', columnsRoutes);

export default router;

