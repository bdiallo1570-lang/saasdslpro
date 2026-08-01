# DSL Air Cargo — SaaS de gestion de fret aérien Chine → Guinée

Phase 1 : Fondations — schéma de données, authentification (mot de passe + OTP), rôles (RBAC),
redirection par rôle, et contrôle d'accès aux vues financières.

Contexte métier complet et règles non négociables : voir [GEMINI.md](./GEMINI.md).

## Structure du projet

```
backend/    API Express + TypeScript + Prisma + PostgreSQL
frontend/   React + TypeScript + Tailwind CSS (Vite)
```

## Prérequis

- Node.js 20+
- PostgreSQL 14+ (local ou distant)

## 1. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env : renseigner DATABASE_URL et des secrets JWT forts

npm install
npm run prisma:migrate    # crée les tables en base
npm run seed               # rôles, tarifs par défaut, entrepôts, utilisateurs de démo
npm run dev                 # démarre l'API sur http://localhost:4000
```

### Comptes de démonstration (créés par le seed)

| Rôle          | Identifiant           | Mot de passe    |
|---------------|------------------------|-----------------|
| Admin         | `+224600000001` ou `admin@dslaircargo.com` | `ChangeMoi123!` |
| Agent Chine   | `+8613800000002` ou `agent.chine@dslaircargo.com` | `ChangeMoi123!` |
| Agent Guinée  | `+224600000003` ou `agent.guinee@dslaircargo.com` | `ChangeMoi123!` |

⚠️ À changer immédiatement en environnement réel.

### Endpoints d'authentification (`/api/v1/auth`)

- `POST /login` — connexion par téléphone/email + mot de passe
- `POST /otp/request` — envoi d'un code OTP (loggé en console en dev, intégration SMS/WhatsApp à brancher)
- `POST /otp/verify` — connexion par code OTP
- `POST /refresh` — renouvellement du jeton d'accès (rotation du refresh token)
- `POST /logout` — révocation du refresh token
- `POST /password/reset-request` / `POST /password/reset-confirm` — réinitialisation du mot de passe
- `GET /me` — profil de l'utilisateur connecté (nécessite un jeton d'accès valide)

Toutes les réponses suivent le format `{ success, data, error }` (voir GEMINI.md §6).

## 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

### Parcours utilisateur

1. Page d'accueil → bouton **« Se connecter à DSL Cargo »**
2. Connexion par mot de passe ou par code OTP WhatsApp/SMS
3. Redirection automatique selon le rôle :
   - Admin → `/dashboard/financier`
   - Agent Chine → `/reception`
   - Agent Guinée / Caissier → `/caisse`
   - Client → `/portail-client`

Chaque destination est protégée côté frontend (`ProtectedRoute`) **et** côté backend
(middleware `requireRole` / `requirePermission`).

## 3. Contrôle d'accès financier (équivalent RLS)

PostgreSQL est utilisé sans Row-Level Security native ; l'équivalent est appliqué au niveau
applicatif :

- `backend/src/middleware/auth.ts` → `requirePermission('finance:read_margins')` protège toute
  route exposant chiffre d'affaires, marges ou impayés.
- `backend/src/config/roles.ts` → seule la permission `finance:read_margins` du rôle **Admin**
  est activée par défaut (`DEFAULT_PERMISSIONS`).
- Le frontend renforce ceci en n'autorisant l'accès à `/dashboard/financier` qu'au rôle Admin
  (`ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN]}`), mais la vérification faisant foi est
  toujours côté serveur.

Si une isolation stricte au niveau base de données est requise plus tard (multi-tenant, accès
direct à la DB par des outils tiers), il faudra activer PostgreSQL RLS avec des policies basées
sur `current_setting('app.current_role')`, injecté par le backend à chaque connexion.

## 4. Modules logistiques (Phase 2)

### Réception Chine (`/reception`, rôle Agent Chine)

Formulaire mobile-first : recherche/création client, description, poids réel (kg), dimensions
(L×l×h en cm, optionnel), catégorie (Standard / Sensible / Personnalisé). Le poids volumétrique
et le poids taxable sont calculés en direct (règle 3.1 GEMINI.md) mais **la facturation reste au
poids réel**. À l'enregistrement : Tracking ID généré côté serveur au format `DSL-YYYY-XXXXX`
(numérotation séquentielle transactionnelle, `backend/src/lib/sequence.ts`) et étiquette QR
imprimable au format 100×150 mm (`Ctrl+P` déclenche une mise en page dédiée via `@media print`).

### Lots / Manifeste aérien (`/lots`, rôles Admin & Agent Chine)

Création de lots, assignation de colis en attente, saisie du numéro de vol + date d'embarquement
avec calcul automatique de l'ETA Conakry (durée de transit configurable, 30h par défaut), et
progression du statut (`En réception → Fermé → Envolé → Arrivé → En dédouanement → En entrepôt →
Clôturé`, règle §4 GEMINI.md). Le passage à « En entrepôt » marque automatiquement tous les colis
du lot comme disponibles pour le scan à Madina.

### Arrivée Madina / Scan (`/caisse`, rôles Agent Guinée & Caissier)

Scanner QR caméra (`html5-qrcode`) : identifie le colis par son Tracking ID et affiche l'état de
paiement du client (Payé / Impayé ou partiel) ainsi que le rappel de la règle de blocage de
livraison (§3.4 GEMINI.md). Le calcul de facture définitif arrive en Phase 3 ; pour l'instant le
statut s'appuie sur `Client.outstandingBalance`.

### Espace Client (`/portail-client`, rôle Client)

Calculateur de prix en direct (catégorie + poids → total estimé GNF) et modale « Adresse de
l'entrepôt en Chine » avec adresse en chinois et en français (l'anglais n'est pas utilisé — règle
GEMINI.md §8 : jamais d'interface en anglais), contacts d'urgence et bouton copier.

## 5. Finance, caisse & créances (Phase 3)

### Factures (prérequis ajouté cette phase)

GEMINI.md fait des Factures (`FAC-YYYY-XXXXX`, numérotation transactionnelle) le pivot de tout
le module financier — impayés, blocage livraison et créances sont tous définis par rapport à
une facture, pas au solde client. `POST /api/v1/factures` agrège des colis non facturés d'un même
client (même devise) en une facture ; `Client.outstandingBalance` est incrémenté à la création et
décrémenté à chaque paiement.

### Paiements (`/api/v1/paiements`)

Encaissement multi-devises (Espèces, Orange Money, Virement) ; chaque paiement fige le taux de
change vers GNF au moment de l'opération (règle 3.2 — jamais recalculé rétroactivement). Le statut
de la facture (`IMPAYE` / `PARTIEL` / `PAYE`) est recalculé à chaque paiement. Un reçu PDF est
téléchargeable par paiement (`GET /paiements/:id/recu-pdf`).

### Blocage de livraison (règle 3.4, renforcé cette phase)

`POST /api/v1/colis/:trackingId/livrer` refuse de marquer un colis livré si sa facture n'est pas
`PAYE`, **sauf** déblocage manuel Admin tracé (`POST /api/v1/factures/:id/debloquer-livraison`,
motif obligatoire → journal d'audit). Le contrôle est appliqué côté backend, pas seulement dans
l'UI. Le scan QR Madina (`/caisse` → onglet « Scan arrivée ») affiche désormais un badge rouge
« IMPAYÉ — LIVRAISON BLOQUÉE » avec boutons Relancer sur WhatsApp / Débloquer (Admin uniquement).

### Caisse Madina (`/api/v1/caisse`, onglet « Caisse du jour »)

Une caisse par jour et par devise (`CashRegisterClosure`, contrainte `[date, currency]`). Entrées
(paiements colis) et dépenses (douane, manutention, loyer, carburant…) alimentent
`CashTransaction`. Solde théorique = fond d'ouverture + entrées − dépenses, recalculé en direct.
La clôture demande un comptage physique, calcule l'écart, et génère un Rapport de Clôture PDF
téléchargeable (`GET /caisse/:id/rapport-pdf`).

### Suivi des créances & impayés (`/creances`, Admin uniquement)

Vue financière (créances totales, clients à risque, paiements partiels) — donc réservée à l'Admin
via `finance:read_margins`, cohérent avec la règle RLS applicative du §3. Ancienneté calculée
depuis la date de création de la plus ancienne facture impayée du client : `< 7j` (ambre),
`8-30j` (orange), `> 30j` (rouge). Bouton « Relancer sur WhatsApp » par client, montant exact dû
inclus dans le message.

### Notifications WhatsApp (`backend/src/lib/whatsapp/`)

Adaptateur agnostique du fournisseur (`WhatsAppProvider`), comme le stub OTP de la Phase 1 : tant
qu'aucune clé n'est configurée, les messages sont journalisés en console et tracés dans
`WhatsAppMessageLog`. Trois déclencheurs actifs :
- confirmation + montant estimé à l'enregistrement d'un colis en Chine (`colis.service.ts`)
- notification groupée par client dès qu'un lot passe « En entrepôt » (`lots.service.ts`)
- relance manuelle avec montant exact dû, depuis le tableau des impayés ou le scan bloqué

Pour brancher un vrai fournisseur : renseigner les clés Green API ou Twilio dans `.env`, implémenter
une classe respectant `WhatsAppProvider` (`backend/src/lib/whatsapp/types.ts`), puis la retourner
depuis `getWhatsAppProvider()` (`backend/src/lib/whatsapp/provider.ts`).

## Ce qui reste (prochaines phases — voir GEMINI.md §7)

- Devis (DEV-YYYY-XXXXX) — non implémentés, seules les Factures existent
- Phase 4 — Pilotage : dashboard financier réel (CA par période, kg expédiés), journal d'audit
  consultable en UI, écran Paramètres (taux de change, tarifs, utilisateurs), polish UI
- Écran de saisie des taux de change (`ExchangeRate` existe en base mais n'a pas encore d'UI ni
  de route dédiée — `getCurrentRateToGnf` lève une erreur explicite si aucun taux n'est configuré
  pour une devise autre que GNF, donc renseigner au moins un taux avant de tester un paiement
  non-GNF)
- Intégration réelle d'un provider SMS/WhatsApp (Green API / Twilio) pour OTP et notifications
- Upload de photos colis (actuellement un champ JSON de chemins/URLs, sans stockage de fichiers)
- Le manifeste (`/lots`) liste les colis au statut `ENREGISTRE` comme candidats à l'assignation ;
  la recherche/filtrage plus avancé (par client, par date) sera ajouté si besoin
