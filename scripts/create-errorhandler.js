import fs from 'fs';
import path from 'path';

const backendRoot = 'C:/Users/1/repos/alphabag_v3_backend';
const errorHandlerPath = path.join(backendRoot, 'src/middleware/errorHandler.js');

const content = `// SPDX-License-Identifier: MIT
export function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);
  
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
`;

fs.writeFileSync(errorHandlerPath, content, 'utf8');
console.log('✅ Created errorHandler.js in alphabag_v3_backend/src/middleware/');
