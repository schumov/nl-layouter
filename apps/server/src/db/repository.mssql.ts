// apps/server/src/db/repository.mssql.ts
// MS SQL Server implementation of NLRepository — uses the `mssql` package directly
// (Drizzle ORM v0.45 has no MSSQL dialect).
//
// Document storage: JSONB does not exist in SQL Server.
//   newsletters.document → NVARCHAR(MAX), serialised/deserialised as JSON.
//
// IDs: UNIQUEIDENTIFIER with DEFAULT NEWID() — crypto.randomUUID() on insert.
//
// RETURNING equivalent: SQL Server OUTPUT clause (OUTPUT INSERTED.*).
import * as sql from 'mssql';
import { randomUUID } from 'crypto';
import type { NLRepository, NewsletterRow, NewsletterFull, PresetSummary, PresetFull, NewNewsletter, NewsletterDoc } from './repository.js';

// ── Connection string parser ───────────────────────────────────────────────────
// Supports ADO.NET / Azure SQL format:
//   Server=myserver,1433;Database=mydb;User Id=sa;Password=secret;Encrypt=True;TrustServerCertificate=True
function parseMssqlConnectionString(connStr: string): sql.config {
  const parts: Record<string, string> = {};
  for (const segment of connStr.split(';')) {
    const idx = segment.indexOf('=');
    if (idx === -1) continue;
    parts[segment.slice(0, idx).trim().toLowerCase()] = segment.slice(idx + 1).trim();
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

// ── Lazy pool ─────────────────────────────────────────────────────────────────
let _pool: sql.ConnectionPool | null = null;

async function getPool(connStr: string): Promise<sql.ConnectionPool> {
  if (_pool?.connected) return _pool;
  _pool = await sql.connect(parseMssqlConnectionString(connStr));
  return _pool;
}

// ── Repository factory ────────────────────────────────────────────────────────
export function createMssqlRepository(connectionString: string): NLRepository {
  const req = async () => (await getPool(connectionString)).request();

  return {
    async listNewsletters(): Promise<NewsletterRow[]> {
      const r = await req();
      const result = await r.query<{ id: string; title: string; updatedAt: Date; sectionCount: number }>(`
        SELECT
          id,
          title,
          updated_at  AS updatedAt,
          ISNULL((SELECT COUNT(*) FROM OPENJSON(document, '$.rows')), 0) AS sectionCount
        FROM newsletters
        ORDER BY updated_at DESC
      `);
      return result.recordset;
    },

    async getNewsletter(id: string): Promise<NewsletterFull | null> {
      const r = await req();
      r.input('id', sql.UniqueIdentifier, id);
      const result = await r.query<{
        id: string; title: string; document: string; createdAt: Date; updatedAt: Date;
      }>('SELECT id, title, document, created_at AS createdAt, updated_at AS updatedAt FROM newsletters WHERE id = @id');
      const row = result.recordset[0];
      if (!row) return null;
      return { ...row, document: JSON.parse(row.document) as NewsletterDoc };
    },

    async createNewsletter(data: NewNewsletter): Promise<NewsletterFull> {
      const r = await req();
      const id = randomUUID();
      r.input('id',       sql.UniqueIdentifier,     id);
      r.input('title',    sql.NVarChar(255),         data.title);
      r.input('document', sql.NVarChar(sql.MAX),     JSON.stringify(data.document));
      const result = await r.query<{
        id: string; title: string; document: string; createdAt: Date; updatedAt: Date;
      }>(`
        INSERT INTO newsletters (id, title, document, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.document,
               INSERTED.created_at AS createdAt, INSERTED.updated_at AS updatedAt
        VALUES (@id, @title, @document, GETUTCDATE(), GETUTCDATE())
      `);
      const row = result.recordset[0]!;
      return { ...row, document: JSON.parse(row.document) as NewsletterDoc };
    },

    async updateNewsletterDocument(id: string, document: NewsletterDoc): Promise<{ id: string; updatedAt: Date } | null> {
      const r = await req();
      r.input('id',       sql.UniqueIdentifier, id);
      r.input('document', sql.NVarChar(sql.MAX), JSON.stringify(document));
      const result = await r.query<{ id: string; updatedAt: Date }>(`
        UPDATE newsletters
        SET    document = @document, updated_at = GETUTCDATE()
        OUTPUT INSERTED.id, INSERTED.updated_at AS updatedAt
        WHERE  id = @id
      `);
      return result.recordset[0] ?? null;
    },

    async renameNewsletter(id: string, title: string): Promise<{ id: string; title: string; updatedAt: Date } | null> {
      const r = await req();
      r.input('id',    sql.UniqueIdentifier, id);
      r.input('title', sql.NVarChar(255),    title);
      const result = await r.query<{ id: string; title: string; updatedAt: Date }>(`
        UPDATE newsletters
        SET    title = @title, updated_at = GETUTCDATE()
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.updated_at AS updatedAt
        WHERE  id = @id
      `);
      return result.recordset[0] ?? null;
    },

    async deleteNewsletter(id: string): Promise<boolean> {
      const r = await req();
      r.input('id', sql.UniqueIdentifier, id);
      const result = await r.query<{ id: string }>(`
        DELETE FROM newsletters OUTPUT DELETED.id WHERE id = @id
      `);
      return result.recordset.length > 0;
    },

    async listPresets(type: 'header' | 'footer'): Promise<PresetSummary[]> {
      const r = await req();
      r.input('type', sql.NVarChar(50), type);
      const result = await r.query<{ id: string; type: string; name: string; thumbnail: string | null }>(
        'SELECT id, type, name, preview_thumbnail AS thumbnail FROM presets WHERE type = @type'
      );
      return result.recordset.map(row => ({ ...row, thumbnail: row.thumbnail ?? null }));
    },

    async getPreset(id: string): Promise<PresetFull | null> {
      const r = await req();
      r.input('id', sql.NVarChar(100), id);
      const result = await r.query<{
        id: string; type: string; name: string; htmlContent: string; thumbnail: string | null;
      }>('SELECT id, type, name, html_content AS htmlContent, preview_thumbnail AS thumbnail FROM presets WHERE id = @id');
      const row = result.recordset[0];
      if (!row) return null;
      return { ...row, thumbnail: row.thumbnail ?? null };
    },
  };
}
