GEMINI.md — Contexte Projet : DSL Air-Cargo SaaS
Ce fichier définit le contexte permanent du projet. L'agent DOIT le lire et respecter toutes les règles ci-dessous avant chaque génération de code. En cas de conflit entre une demande ponctuelle et ce fichier, demander confirmation avant de dévier.


1. Présentation du projet
DSL Air-Cargo est une entreprise de fret aérien (freight forwarding) spécialisée dans les expéditions Chine (Guangzhou) → Guinée (Conakry).

L'objectif est de construire un SaaS de gestion complet et fonctionnel couvrant tout le cycle : réception marchandise en Chine → groupage par lot → transport aérien → dédouanement → entrepôt Conakry → facturation → paiement → livraison client.

Utilisateurs cibles : le gérant (admin), les agents en Chine (réception/pesée), les agents à Conakry (entrepôt/caisse/livraison), et à terme un portail client en lecture seule.

Langue de l'application : FRANÇAIS par défaut. Toute l'interface, les messages d'erreur, les documents générés (factures, devis, bordereaux) sont en français.


2. Stack technique imposée
Frontend : React + TypeScript + Tailwind CSS (design moderne, responsive, mobile-first car les agents utilisent des smartphones)
Backend : Node.js + Express (ou NestJS si justifié)
Base de données : PostgreSQL
ORM : Prisma
Auth : JWT avec rôles (RBAC)
Validation : Zod côté frontend ET backend
Pas de dépendances exotiques. Privilégier les librairies stables et maintenues.


3. Règles métier NON NÉGOCIABLES
Ces règles sont le cœur du système. Les implémenter exactement comme décrit.
3.1 Poids (réel & volumétrique)
poids_volumétrique = (longueur_cm × largeur_cm × hauteur_cm) ÷ 6000

poids_taxable      = MAX(poids_réel_kg, poids_volumétrique)

Facturation actuelle : utiliser le POIDS RÉEL uniquement. Le poids taxable est calculé et stocké, mais n'est PAS utilisé pour la facturation pour le moment.
Afficher les trois valeurs sur la fiche colis : poids réel, poids volumétrique, poids taxable — le poids réel étant marqué comme "poids facturé".
Prévoir dans les paramètres un interrupteur admin : mode_facturation = "poids_réel" | "poids_taxable" (par défaut poids_réel). Cela permettra de basculer facilement plus tard sans refactor.
Le diviseur volumétrique 6000 reste configurable dans les paramètres.
3.2 Devises et taux de change
4 devises supportées : GNF, USD, EUR, CNY
Taux de change MANUELS uniquement. Aucune API de taux externe. L'admin saisit les taux dans un écran dédié, avec historique daté (chaque taux a une date d'effet, on ne modifie jamais un taux passé, on en crée un nouveau).
Chaque transaction enregistre le taux utilisé au moment de l'opération (jamais recalculé rétroactivement).
3.3 Numérotation séquentielle
LTA / AWB : DSL-YYYY-XXXXX (ex : DSL-2026-00042)
Factures : FAC-YYYY-XXXXX
Devis : DEV-YYYY-XXXXX
Numérotation séquentielle sans trou, réinitialisée chaque année, générée côté serveur dans une transaction pour éviter les doublons en cas d'accès concurrent.
3.4 Blocage de livraison (règle critique)
Un colis ne peut PAS être marqué "Sorti d'entrepôt / Livré" tant que la facture associée n'est pas marquée "Payée".
Ce contrôle est appliqué côté backend (pas seulement dans l'UI).
Exception possible : l'admin peut débloquer manuellement avec motif obligatoire, tracé dans un journal d'audit.
3.5 Tarification
Tarifs de base (facturés au poids réel — cf. règle 3.1) :

Colis standard : 160 000 GNF/kg
Colis à risque (liquides, batteries au lithium, produits inflammables, aérosols, magnétiques, poudres, cosmétiques liquides, etc.) : 180 000 GNF/kg
Gros volumes : sur devis (tarif personnalisé par client possible)
Option additionnelle : Pack Inspection & Photo avant expédition (order bump, montant configurable)

Règles d'implémentation :

Les tarifs sont entièrement configurables par l'admin dans un écran Paramètres → Tarifs. Ils ne sont JAMAIS codés en dur, car les prix évoluent avec les coûts logistiques et le taux de change.
Chaque tarif a une date d'effet : quand l'admin modifie un prix, on crée une nouvelle ligne de tarif datée. Les factures déjà émises gardent leur tarif d'origine (historique préservé).
Chaque colis a un champ catégorie_tarif avec choix : standard | risque | personnalisé. Le prix appliqué est celui en vigueur à la date de création de la facture.
La liste des types de produits à risque est configurable (une table de référence que l'admin peut enrichir).
Prévoir un champ libre tarif_unitaire_manuel sur la facture pour les cas exceptionnels (avec motif obligatoire, tracé au journal d'audit).
3.6 Statuts des paiements
✅ Payé intégralement
⚡ Paiement partiel (afficher le solde restant)
❌ Impayé
Un client peut payer en plusieurs fois, dans des devises différentes ; chaque paiement est une ligne avec sa devise et son taux.


4. Modules fonctionnels (11 modules)
Développer dans cet ordre de priorité :

Authentification & rôles — Admin, Agent Chine, Agent Conakry, Caissier, (Client lecture seule en phase ultérieure)
Clients — fiche client (nom, téléphones GN/CN, WhatsApp, adresse), historique complet des lots et paiements, solde global
Réception colis (Chine) — saisie colis : description, poids réel, dimensions, photos, client destinataire, calcul auto du poids taxable
Lots / Groupage — regroupement de colis en lots, numéro de lot, LTA associée, statut du lot (En réception → Fermé → Envolé → Arrivé → En dédouanement → En entrepôt → Clôturé)
Suivi (tracking) — timeline par colis et par lot, notifications de changement de statut
Devis & Factures — génération PDF en français, en-tête DSL Air-Cargo, détail par colis, conversion de devises affichée
Caisse / Paiements — encaissements multi-devises, reçus imprimables, journal de caisse par jour et par devise
Entrepôt Conakry — entrées/sorties, contrôle du blocage facture impayée, bon de sortie signé
Dashboard — CA par période, kg expédiés, lots en cours, impayés, top clients
Paramètres — taux de change, tarifs, numérotation, utilisateurs
Journal d'audit — toute action sensible (déblocage, modification de facture, suppression) tracée : qui, quoi, quand, motif


5. Modèle de données — points d'attention
Client 1—N Colis ; Lot 1—N Colis ; Facture N—1 Client et liée aux colis facturés ; Paiement N—1 Facture
Tous les montants stockés en decimal (jamais float), avec devise + taux vers GNF
Soft delete partout (deletedAt), jamais de suppression physique des données financières
Horodatage createdAt / updatedAt sur toutes les tables
Numéros de téléphone au format international (+224 pour la Guinée, +86 pour la Chine)


6. Conventions de code
Code et commentaires : identifiants en anglais, textes UI en français
Composants React fonctionnels, hooks, pas de classes
Un composant = un fichier ; dossiers par module (/modules/clients, /modules/lots, etc.)
API REST : /api/v1/..., réponses { success, data, error }
Toute route protégée par middleware auth + vérification de rôle
Tests minimum : règles métier critiques (poids taxable, numérotation, blocage livraison)
Gérer les erreurs avec messages français clairs pour l'utilisateur final (public non technique)


7. Phases de développement
Phase 1 — Fondations : setup projet, Prisma schema complet, auth + rôles, CRUD clients Phase 2 — Cœur métier : colis, lots, calcul poids taxable, statuts, tracking Phase 3 — Finance : devis, factures PDF, caisse multi-devises, blocage livraison, taux de change Phase 4 — Pilotage : dashboard, entrepôt, journal d'audit, paramètres, polish UI

À la fin de chaque phase, fournir : instructions de lancement, données de démonstration (seed), et un résumé de ce qui reste.


8. Ce qu'il ne faut PAS faire
❌ Ne jamais utiliser d'API de taux de change externe
❌ Ne jamais permettre une sortie d'entrepôt sur facture impayée sans déblocage admin tracé
❌ Ne jamais stocker de montants en float
❌ Ne jamais coder les tarifs en dur
❌ Ne pas ajouter de fonctionnalités non demandées sans confirmation
❌ Ne pas générer d'interface en anglais



Contact projet : Boubacar — DSL Air-Cargo, Conakry, Guinée.

