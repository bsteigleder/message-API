import { recordRequest, recordResponse } from '../metrics/metricsStore.js';

function getRequestType(req) {
  const routePath = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
  const normalizedPath = routePath === '/' ? routePath : routePath.replace(/\/$/, '');

  return `${req.method} ${normalizedPath}`;
}

export function metricsMiddleware(req, res, next) {
  res.on('finish', () => {
    recordRequest(getRequestType(req));
    recordResponse(res.statusCode);
  });

  next();
}
