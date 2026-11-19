import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { AddressInfo } from 'net';
import { cleCompte, envoiCodeParCompteLimiter, piegeARobots } from '../middleware/antiSpam';

describe('Anti-spam : reconnaissance du compte visé', () => {
  it('donne la même clé à un numéro écrit de plusieurs façons', () => {
    expect(cleCompte('+224 620 71 71 50')).toBe('620717150');
    expect(cleCompte('00224620717150')).toBe('620717150');
    expect(cleCompte('620717150')).toBe('620717150');
  });

  it('garde l’e-mail en minuscules et ignore un identifiant vide', () => {
    expect(cleCompte('  Admin@DSLcargo.com ')).toBe('admin@dslcargo.com');
    expect(cleCompte('')).toBe('');
    expect(cleCompte(undefined)).toBe('');
  });
});

describe('Anti-spam : piège à robots et limite des codes par compte', () => {
  let serveur: Server;
  let url = '';

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.post('/connexion', piegeARobots(), (req, res) => res.json({ success: true, data: req.body, error: null }));
    app.post('/code', piegeARobots('Si ce compte existe, un code a été envoyé.'), envoiCodeParCompteLimiter, (_req, res) =>
      res.json({ success: true, data: { message: 'Si ce compte existe, un code a été envoyé.', envoye: true }, error: null }),
    );
    await new Promise<void>((ok) => {
      serveur = app.listen(0, () => ok());
    });
    url = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((ok) => serveur.close(() => ok())));

  const envoyer = (chemin: string, corps: Record<string, string>) =>
    fetch(url + chemin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });

  it('laisse passer un humain (champ piège vide) et retire le champ avant le traitement', async () => {
    const r = await envoyer('/connexion', { identifier: 'agent', site_web: '' });
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual({ identifier: 'agent' });
  });

  it('refuse un robot qui remplit le champ piège', async () => {
    const r = await envoyer('/connexion', { identifier: 'agent', site_web: 'http://spam.example' });
    expect(r.status).toBe(400);
  });

  it('répond au robot comme à un humain sur une demande de code, sans rien envoyer', async () => {
    const r = await envoyer('/code', { identifier: '622000001', site_web: 'spam' });
    const corps = await r.json();
    expect(r.status).toBe(200);
    expect(corps.data.message).toContain('Si ce compte existe');
    expect(corps.data.envoye).toBeUndefined();
  });

  it('bloque le 4e code demandé pour le même numéro, même écrit autrement', async () => {
    const statuts = [];
    for (const id of ['+224 620 00 00 02', '00224620000002', '620000002', '620 000 002']) {
      statuts.push((await envoyer('/code', { identifier: id })).status);
    }
    expect(statuts).toEqual([200, 200, 200, 429]);
    // Un autre compte n'est pas pénalisé
    expect((await envoyer('/code', { identifier: '620000003' })).status).toBe(200);
  });
});
