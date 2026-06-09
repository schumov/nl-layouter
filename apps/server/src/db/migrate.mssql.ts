// apps/server/src/db/migrate.mssql.ts
// Idempotent schema migration for MS SQL Server.
// Creates `newsletters` and `presets` tables if they do not already exist.
//
// Usage:  pnpm --filter nl-layouter-server migrate:mssql
import 'dotenv/config';
import * as sql from 'mssql';

const connStr = process.env['MSSQL_CONNECTION_STRING'];
if (!connStr) {
  console.error('❌  MSSQL_CONNECTION_STRING is not set in apps/server/.env');
  process.exit(1);
}

function parseConnectionString(cs: string): sql.config {
  const parts: Record<string, string> = {};
  for (const seg of cs.split(';')) {
    const idx = seg.indexOf('=');
    if (idx === -1) continue;
    parts[seg.slice(0, idx).trim().toLowerCase()] = seg.slice(idx + 1).trim();
  }
  const serverRaw = (parts['server'] ?? parts['data source'] ?? '').replace(/^tcp:/i, '');
  const [host, portStr] = serverRaw.split(',');
  return {
    server:   host?.trim() ?? '',
    port:     portStr ? parseInt(portStr.trim(), 10) : 1433,
    database: parts['database'] ?? parts['initial catalog'] ?? '',
    user:     parts['user id'] ?? parts['uid'] ?? '',
    password: parts['password'] ?? parts['pwd'] ?? '',
    options: {
      encrypt:                (parts['encrypt'] ?? 'true').toLowerCase() !== 'false',
      trustServerCertificate: (parts['trustservercertificate'] ?? 'false').toLowerCase() === 'true',
    },
  };
}

async function migrate() {
  const pool = await sql.connect(parseConnectionString(connStr!));
  const req  = pool.request();

  console.log('🔄  Running MSSQL migrations…');

  await req.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'newsletters')
    BEGIN
      CREATE TABLE newsletters (
        id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        title        NVARCHAR(255)    NOT NULL,
        document     NVARCHAR(MAX)    NOT NULL,
        created_at   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        updated_at   DATETIME2        NOT NULL DEFAULT GETUTCDATE()
      );
      PRINT 'Created table: newsletters';
    END
  `);

  await req.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'presets')
    BEGIN
      CREATE TABLE presets (
        id                NVARCHAR(100) NOT NULL PRIMARY KEY,
        type              NVARCHAR(50)  NOT NULL,
        name              NVARCHAR(255) NOT NULL,
        html_content      NVARCHAR(MAX) NOT NULL,
        preview_thumbnail NVARCHAR(MAX)     NULL
      );
      PRINT 'Created table: presets';
    END
  `);

  console.log('✅  MSSQL migration complete.');
  await pool.close();
}

migrate().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
