// apps/server/src/db/index.ts
// Repository factory — returns the correct NLRepository implementation based on DB_TYPE.
//
// DB_TYPE=postgres (default) → Drizzle + postgres.js (Neon / any PostgreSQL)
// DB_TYPE=mssql              → mssql package (SQL Server / Azure SQL)
import 'dotenv/config';
import type { NLRepository } from './repository.js';
import { createPgRepository }    from './repository.pg.js';
import { createMssqlRepository } from './repository.mssql.js';

const dbType = (process.env['DB_TYPE'] ?? 'postgres').toLowerCase();

function buildRepository(): NLRepository {
  if (dbType === 'mssql') {
    const connStr = process.env['MSSQL_CONNECTION_STRING'];
    if (!connStr) {
      throw new Error(
        'MSSQL_CONNECTION_STRING is required when DB_TYPE=mssql — set it in apps/server/.env'
      );
    }
    return createMssqlRepository(connStr);
  }
  return createPgRepository();
}

export const repository: NLRepository = buildRepository();
export type { NLRepository };
