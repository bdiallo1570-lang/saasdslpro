import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '@/config/env';
import { authRouter } from '@/modules/auth/auth.routes';
import { dashboardRouter } from '@/modules/users/dashboard.routes';
import { clientsRouter } from '@/modules/clients/clients.routes';
import { colisRouter } from '@/modules/colis/colis.routes';
import { lotsRouter } from '@/modules/lots/lots.routes';
import { warehousesRouter } from '@/modules/warehouses/warehouses.routes';
import { facturesRouter } from '@/modules/factures/factures.routes';
import { paiementsRouter } from '@/modules/paiements/paiements.routes';
import { caisseRouter } from '@/modules/caisse/caisse.routes';
import { creancesRouter } from '@/modules/creances/creances.routes';
import { exchangeRatesRouter } from '@/modules/exchangeRates/exchangeRates.routes';
import { auditRouter } from '@/modules/audit/audit.routes';
import { depenseLotRouter } from '@/modules/lots/depenses/depenseLot.routes';
import { alertesRouter } from '@/modules/alertes/alertes.routes';
import { parametresAlertesRouter } from '@/modules/parametres/parametresAlertes.routes';

export const app = express();

app.use(helmet());
// Autorise à la fois localhost (accès depuis le PC) et l'IP réseau (accès depuis un téléphone
// sur le même Wi-Fi) — FRONTEND_URL peut contenir plusieurs origines séparées par une virgule.
const allowedOrigins = env.FRONTEND_URL.split(',').map((origin) => origin.trim());
// Vercel génère une URL unique par déploiement (preview ou production) en plus de l'alias
// stable — ex. saasdslpro-abc123-dsl-cargo.vercel.app. On autorise tout sous-domaine
// *.vercel.app pour ne pas casser l'accès à chaque nouveau déploiement.
const isVercelPreviewOrigin = (origin: string) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreviewOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS refusé pour l'origine : ${origin}`);
        callback(new Error('Origine non autorisée par la politique CORS.'));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' }, error: null });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/clients', clientsRouter);
app.use('/api/v1/colis', colisRouter);
app.use('/api/v1/lots', lotsRouter);
app.use('/api/v1/warehouses', warehousesRouter);
app.use('/api/v1/factures', facturesRouter);
app.use('/api/v1/paiements', paiementsRouter);
app.use('/api/v1/caisse', caisseRouter);
app.use('/api/v1/creances', creancesRouter);
app.use('/api/v1/exchange-rates', exchangeRatesRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/depenses', depenseLotRouter);
app.use('/api/v1/alertes', alertesRouter);
app.use('/api/v1/parametres/alertes', parametresAlertesRouter);

// 404 par défaut
app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: 'Ressource introuvable.' });
});

// Middleware d'erreur global — filet de sécurité final. Capture toute erreur transmise via
// next(err) (notamment par asyncHandler) pour éviter qu'une erreur non gérée (ex. base de
// données injoignable) ne fasse planter tout le process Node.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({
    success: false,
    data: null,
    error: 'Erreur interne du serveur. Veuillez réessayer dans quelques instants.',
  });
});
