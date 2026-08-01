import { Request, Response } from 'express';
import * as caisseService from './caisse.service';
import { openClosureSchema, createTransactionSchema, closeClosureSchema } from './caisse.schema';
import { generateClosureReportPdf } from '@/lib/pdf/closureReport';

function handleError(res: Response, error: unknown) {
  if (error instanceof caisseService.CaisseError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

export async function openClosureHandler(req: Request, res: Response) {
  const parsed = openClosureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const closure = await caisseService.openClosure(
      parsed.data.currency,
      parsed.data.fondOuverture,
      req.user!.sub,
      parsed.data.date,
    );
    return res.status(201).json({ success: true, data: closure, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getOpenClosureHandler(req: Request, res: Response) {
  const currency = (req.query.currency as string) || 'GNF';
  const closure = await caisseService.getOpenClosure(currency as never);
  return res.status(200).json({ success: true, data: closure, error: null });
}

export async function listClosuresHandler(_req: Request, res: Response) {
  const closures = await caisseService.listClosures();
  return res.status(200).json({ success: true, data: closures, error: null });
}

export async function getClosureHandler(req: Request, res: Response) {
  const closure = await caisseService.getClosureById(req.params.id);
  if (!closure) {
    return res.status(404).json({ success: false, data: null, error: 'Caisse introuvable.' });
  }

  const soldeTheorique = caisseService.computeSoldeTheorique(Number(closure.fondOuverture), closure.transactions);
  return res.status(200).json({ success: true, data: { ...closure, soldeTheorique }, error: null });
}

export async function createTransactionHandler(req: Request, res: Response) {
  const parsed = createTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const transaction = await caisseService.createTransaction({
      ...parsed.data,
      createdByUserId: req.user!.sub,
    });
    return res.status(201).json({ success: true, data: transaction, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadClosureReportHandler(req: Request, res: Response) {
  const closure = await caisseService.getClosureById(req.params.id);
  if (!closure) {
    return res.status(404).json({ success: false, data: null, error: 'Caisse introuvable.' });
  }

  const soldeTheorique =
    closure.soldeTheorique ??
    caisseService.computeSoldeTheorique(Number(closure.fondOuverture), closure.transactions);

  const pdfBuffer = await generateClosureReportPdf({ ...closure, soldeTheorique } as never);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="rapport-cloture-${closure.date.toISOString().slice(0, 10)}-${closure.currency}.pdf"`,
  );
  return res.send(pdfBuffer);
}

export async function closeClosureHandler(req: Request, res: Response) {
  const parsed = closeClosureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const closure = await caisseService.closeClosure(
      req.params.id,
      parsed.data.comptagePhysique,
      req.user!.sub,
    );
    return res.status(200).json({ success: true, data: closure, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
