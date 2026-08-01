import { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 n'intercepte pas automatiquement les rejets de promesses dans les handlers
// async : une erreur non catchée (ex. base de données injoignable) fait planter tout le
// process Node. Ce wrapper transmet toute erreur à next() pour qu'elle soit gérée par le
// middleware d'erreur global plutôt que de crasher le serveur.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
