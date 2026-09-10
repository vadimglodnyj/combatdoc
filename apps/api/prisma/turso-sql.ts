/**
 * Parse a SQLite / Turso SQL dump into table rows.
 * Does not execute SQL; safe to run on untrusted dumps.
 */

export type SqlRow = Record<string, unknown>;

export interface ParsedDump {
  tables: Record<string, { columns: string[]; rows: SqlRow[] }>;
}

export function parseDump(sql: string): ParsedDump {
  const tables: ParsedDump['tables'] = {};
  for (const stmt of splitStatements(stripComments(sql))) {
    const created = parseCreateTable(stmt);
    if (created) {
      const key = created.name.toLowerCase();
      if (!tables[key]) {
        tables[key] = { columns: created.columns, rows: [] };
      } else if (!tables[key].columns.length) {
        tables[key].columns = created.columns;
      }
      continue;
    }
    const inserted = parseInsert(stmt);
    if (!inserted) continue;
    const key = inserted.table.toLowerCase();
    if (!tables[key]) {
      tables[key] = { columns: inserted.columns ?? [], rows: [] };
    }
    const columns =
      inserted.columns?.length ? inserted.columns : tables[key].columns;
    if (!tables[key].columns.length && columns.length) {
      tables[key].columns = columns;
    }
    for (const values of inserted.rows) {
      const row: SqlRow = {};
      const cols = columns.length ? columns : values.map((_, i) => `c${i}`);
      cols.forEach((col, i) => {
        row[col] = values[i] ?? null;
      });
      tables[key].rows.push(row);
    }
  }
  return { tables };
}

export function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let current = '';
  let inSingle = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inSingle) {
      current += ch;
      if (ch === "'" && sql[i + 1] === "'") {
        current += sql[++i];
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      current += ch;
      continue;
    }
    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) out.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }
  const tail = current.trim();
  if (tail) out.push(tail);
  return out;
}

export function stripComments(sql: string): string {
  let out = '';
  let i = 0;
  let inSingle = false;
  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (inSingle) {
      out += ch;
      if (ch === "'" && next === "'") {
        out += next;
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseCreateTable(stmt: string): { name: string; columns: string[] } | null {
  const match = stmt.match(
    /^CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:["'`]?([\w.]+)["'`]?)\s*\(/i,
  );
  if (!match) return null;
  const open = stmt.indexOf('(');
  const close = stmt.lastIndexOf(')');
  if (open < 0 || close <= open) return { name: match[1], columns: [] };
  const body = stmt.slice(open + 1, close);
  const columns: string[] = [];
  for (const raw of splitTopLevel(body)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|INDEX)\b/i.test(line)) continue;
    const nameMatch = line.match(/^["'`]?([\w]+)["'`]?/);
    if (nameMatch) columns.push(nameMatch[1]);
  }
  return { name: match[1].replace(/^.*\./, ''), columns };
}

function parseInsert(stmt: string): {
  table: string;
  columns?: string[];
  rows: unknown[][];
} | null {
  const match = stmt.match(
    /^INSERT\s+INTO\s+(?:["'`]?([\w.]+)["'`]?)\s*(?:\(([^)]*)\))?\s*VALUES\s*/i,
  );
  if (!match) return null;
  const table = match[1].replace(/^.*\./, '');
  const columns = match[2]
    ? match[2]
        .split(',')
        .map((c) => c.trim().replace(/^["'`]|["'`]$/g, ''))
        .filter(Boolean)
    : undefined;
  const valuesStart = stmt.toLowerCase().indexOf('values');
  const valuesSql = stmt.slice(valuesStart + 'values'.length).trim();
  const rows = parseValueGroups(valuesSql);
  return { table, columns, rows };
}

function parseValueGroups(sql: string): unknown[][] {
  const groups: unknown[][] = [];
  let i = 0;
  while (i < sql.length) {
    while (i < sql.length && /[\s,]/.test(sql[i])) i += 1;
    if (i >= sql.length) break;
    if (sql[i] !== '(') break;
    const { values, end } = parseValueList(sql, i);
    groups.push(values);
    i = end;
  }
  return groups;
}

function parseValueList(sql: string, start: number): { values: unknown[]; end: number } {
  const values: unknown[] = [];
  let i = start + 1;
  while (i < sql.length) {
    while (i < sql.length && /\s/.test(sql[i])) i += 1;
    if (sql[i] === ')') return { values, end: i + 1 };
    const parsed = parseValue(sql, i);
    values.push(parsed.value);
    i = parsed.end;
    while (i < sql.length && /\s/.test(sql[i])) i += 1;
    if (sql[i] === ',') {
      i += 1;
      continue;
    }
    if (sql[i] === ')') return { values, end: i + 1 };
    break;
  }
  return { values, end: i };
}

function parseValue(sql: string, start: number): { value: unknown; end: number } {
  let i = start;
  while (i < sql.length && /\s/.test(sql[i])) i += 1;
  const rest = sql.slice(i);
  if (/^NULL\b/i.test(rest)) {
    return { value: null, end: i + 4 };
  }
  if (sql[i] === "'") {
    let out = '';
    i += 1;
    while (i < sql.length) {
      if (sql[i] === "'" && sql[i + 1] === "'") {
        out += "'";
        i += 2;
        continue;
      }
      if (sql[i] === "'") return { value: out, end: i + 1 };
      out += sql[i];
      i += 1;
    }
    return { value: out, end: i };
  }
  if (/^[+-]?\d/.test(rest)) {
    const m = rest.match(/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?/);
    const raw = m ? m[0] : rest[0];
    return { value: Number(raw), end: i + raw.length };
  }
  const ident = rest.match(/^[A-Za-z_][\w]*/);
  return { value: ident ? ident[0] : rest[0], end: i + (ident ? ident[0].length : 1) };
}

function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inSingle) {
      current += ch;
      if (ch === "'" && body[i + 1] === "'") {
        current += body[++i];
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      current += ch;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}
