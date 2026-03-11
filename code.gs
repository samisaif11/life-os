/**
 * ═══════════════════════════════════════════════════════════════
 * LIFE OS — Sami's Dashboard — Google Sheets Backend
 * ═══════════════════════════════════════════════════════════════
 *
 * This Apps Script provides a REST-like API for the Production Dashboard.
 * Deploy as a Web App to enable cloud persistence via Google Sheets.
 *
 * Endpoints:
 *   GET  → reads all sheets and returns the full D object as JSON
 *   POST → receives the full D object and writes it to all sheets
 */

// ═══════ SHEET NAMES ═══════
const SHEETS = {
  TASKS:         'Tasks',
  COMPLETED:     'Completed',
  DEADLINES:     'Deadlines',
  PROJECTS:      'Projects',
  CLOSED:        'Closed',
  PEOPLE:        'People',
  PARTNERS:      'Partners',
  MONTHLY:       'Monthly',
  PROJDONE:      'ProjDone',
  META:          'Meta',
  PROJCOLORS:    'ProjectColors',
  PPLCOLORS:     'PeopleColors',
  INVOICES:      'Invoices',
  BANKACCTS:     'BankAccounts',
  CLIENTS:       'Clients',
  BOOKS:         'Books',
  BOOKS_QUEUE:   'BooksQueue',
  GROCERIES:     'Groceries',
  HEALTH_LOGS:   'HealthLogs'
};

// ═══════ COLUMN DEFINITIONS ═══════
const TASK_COLS     = ['id','name','project','person','partner','priority','due','done','blocked','blockedBy','order','notes','createdAt','completedAt','doneDate','subtasks'];
const DEADLINE_COLS = ['id','date','title','project','partner','type','allDay','keepCount','notes'];
const PROJECT_COLS  = ['title','year','status','type','director','category'];
const CLOSED_COLS   = ['title','year','director'];
const PEOPLE_COLS   = ['code','name','role'];
const PARTNER_COLS  = ['name','color','bgColor'];
const MONTHLY_COLS  = ['month','count'];
const PROJDONE_COLS = ['project','count'];
const META_COLS     = ['key','value'];
const PROJCOLOR_COLS = ['name','color','bgColor','code'];
const PPLCOLOR_COLS  = ['code','color','bgColor'];
const INVOICE_COLS    = ['id','invoiceNumber','date','client','project','description','montantHT','tvaRate','montantTTC','catchupHT','catchupTVA','catchupTTC','status','pdfUrl','emailSentDate','bankAccountId','notes','clientAddress','clientSIREN','clientCostCenter','clientDealRef'];
const BANKACCT_COLS   = ['id','name','ribImageFileId'];
const CLIENT_COLS     = ['name','address','siren','defaultCostCenter'];
const BOOK_COLS       = ['id','title','author','cover','metric','total','current','progress','rating','status','genre','createdAt','updatedAt','notes','imageUrl'];
const BOOK_QUEUE_COLS = ['id','title','author','genre','priority','addedAt','notes'];
const GROCERY_COLS    = ['id','name','location','needsRefill','typicalPrice','lastPurchased','notes','createdAt','updatedAt'];
const LEGACY_BOOK_COLS    = ['id','title','author','cover','progress','rating','status','genre','createdAt','updatedAt','notes','imageUrl'];
const LEGACY_GROCERY_COLS = ['id','item','location','category','quantity','unit','priority','purchased','createdAt','updatedAt','notes'];
const HEALTH_LOG_COLS = ['id','date','metric','value','unit','category','notes','createdAt'];

// ═══════════════════════════════════════════════════════════════
//  doGet — READ all data from sheets, return as JSON
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {};

    // --- Tasks ---
    data.tasks = readSheet(ss, SHEETS.TASKS, TASK_COLS).map(parseTask);

    // --- Completed ---
    data.completed = readSheet(ss, SHEETS.COMPLETED, TASK_COLS).map(parseTask);

    // --- Deadlines ---
    data.deadlines = readSheet(ss, SHEETS.DEADLINES, DEADLINE_COLS).map(row => ({
      id:        toNum(row.id),
      date:      normalizeDate(str(row.date)),
      title:     str(row.title),
      project:   str(row.project),
      partner:   str(row.partner),
      type:      str(row.type) || 'hard',
      allDay:    toBool(row.allDay),
      keepCount: toBool(row.keepCount),
      notes:     str(row.notes)
    }));

    // --- Projects ---
    data.projects = readSheet(ss, SHEETS.PROJECTS, PROJECT_COLS).map(row => ({
      title:    str(row.title),
      year:     toNum(row.year),
      status:   str(row.status),
      type:     str(row.type),
      director: str(row.director),
      category: str(row.category) || (str(row.status) === 'personal' ? 'personal' : 'film')
    }));

    // --- Closed ---
    data.closed = readSheet(ss, SHEETS.CLOSED, CLOSED_COLS).map(row => ({
      title:    str(row.title),
      year:     toNum(row.year),
      director: str(row.director)
    }));

    // --- People ---
    data.people = readSheet(ss, SHEETS.PEOPLE, PEOPLE_COLS).map(row => ({
      code: str(row.code),
      name: str(row.name),
      role: str(row.role)
    }));

    // --- Partners (returns as PA object) ---
    const partnerRows = readSheet(ss, SHEETS.PARTNERS, PARTNER_COLS);
    const PA = {};
    partnerRows.forEach(row => {
      if (row.name) PA[str(row.name)] = { c: str(row.color), b: str(row.bgColor) };
    });
    data.partners = PA;

    // --- Monthly ---
    data.monthly = readSheet(ss, SHEETS.MONTHLY, MONTHLY_COLS).map(row => ({
      m: str(row.month),
      c: toNum(row.count)
    }));

    // --- ProjDone ---
    const pdRows = readSheet(ss, SHEETS.PROJDONE, PROJDONE_COLS);
    const projDone = {};
    pdRows.forEach(row => { if (row.project) projDone[str(row.project)] = toNum(row.count); });
    data.projDone = projDone;

    // --- Meta ---
    const metaRows = readSheet(ss, SHEETS.META, META_COLS);
    const meta = {};
    metaRows.forEach(row => { if (row.key) meta[str(row.key)] = str(row.value); });
    data.nid  = toNum(meta.nid) || 1;
    data.dlid = toNum(meta.dlid) || 1;
    data.savedAt = meta.savedAt || '';

    // --- Posters (stored as JSON blob in meta) ---
    try { data.posters = meta.posters ? JSON.parse(meta.posters) : {}; } catch(_) { data.posters = {}; }

    // --- Project Colors (PC object) ---
    const pcRows = readSheet(ss, SHEETS.PROJCOLORS, PROJCOLOR_COLS);
    const PC = {};
    pcRows.forEach(row => {
      if (row.name) PC[str(row.name)] = { c: str(row.color), b: str(row.bgColor), code: str(row.code) };
    });
    data.projectColors = PC;

    // --- People Colors (PP object) ---
    const ppRows = readSheet(ss, SHEETS.PPLCOLORS, PPLCOLOR_COLS);
    const PPobj = {};
    ppRows.forEach(row => {
      if (row.code) PPobj[str(row.code)] = { c: str(row.color), b: str(row.bgColor) };
    });
    data.peopleColors = PPobj;

    // --- Invoices ---
    data.invoices = readSheet(ss, SHEETS.INVOICES, INVOICE_COLS).map(row => ({
      id: toNum(row.id), invoiceNumber: str(row.invoiceNumber), date: str(row.date),
      client: str(row.client), project: str(row.project), description: str(row.description),
      montantHT: str(row.montantHT), tvaRate: toNum(row.tvaRate), montantTTC: str(row.montantTTC),
      catchupHT: str(row.catchupHT), catchupTVA: toNum(row.catchupTVA), catchupTTC: str(row.catchupTTC),
      status: str(row.status) || 'draft', pdfUrl: str(row.pdfUrl), emailSentDate: str(row.emailSentDate),
      bankAccountId: toNum(row.bankAccountId), notes: str(row.notes),
      clientAddress: str(row.clientAddress), clientSIREN: str(row.clientSIREN),
      clientCostCenter: str(row.clientCostCenter), clientDealRef: str(row.clientDealRef)
    }));

    // --- Bank Accounts ---
    data.bankAccounts = readSheet(ss, SHEETS.BANKACCTS, BANKACCT_COLS).map(row => ({
      id: toNum(row.id), name: str(row.name), ribImageFileId: str(row.ribImageFileId)
    }));

    // --- Clients ---
    data.clients = readSheet(ss, SHEETS.CLIENTS, CLIENT_COLS).map(row => ({
      name: str(row.name), address: str(row.address), siren: str(row.siren),
      defaultCostCenter: str(row.defaultCostCenter)
    }));

    data.invid = toNum(meta.invid) || 1;

    // --- Books ---
    const bookHeaders = getHeaders(ss, SHEETS.BOOKS);
    const bookRows = bookHeaders.includes('metric')
      ? readSheet(ss, SHEETS.BOOKS, BOOK_COLS).map(row => ({
          id: toNum(row.id),
          title: str(row.title),
          author: str(row.author),
          cover: str(row.cover),
          metric: str(row.metric) || 'pages',
          total: toNum(row.total),
          current: toNum(row.current),
          progress: toNum(row.progress),
          rating: toNum(row.rating),
          status: str(row.status),
          genre: str(row.genre),
          createdAt: str(row.createdAt),
          updatedAt: str(row.updatedAt),
          notes: str(row.notes),
          imageUrl: str(row.imageUrl)
        }))
      : readSheet(ss, SHEETS.BOOKS, LEGACY_BOOK_COLS).map(row => ({
          id: toNum(row.id),
          title: str(row.title),
          author: str(row.author),
          cover: str(row.cover),
          metric: 'pages',
          total: 0,
          current: 0,
          progress: toNum(row.progress),
          rating: toNum(row.rating),
          status: str(row.status),
          genre: str(row.genre),
          createdAt: str(row.createdAt),
          updatedAt: str(row.updatedAt),
          notes: str(row.notes),
          imageUrl: str(row.imageUrl)
        }));
    data.books = bookRows;

    // --- Books Queue ---
    data.booksQueue = readSheet(ss, SHEETS.BOOKS_QUEUE, BOOK_QUEUE_COLS)
      .map(row => str(row.title))
      .filter(Boolean);

    data.bkid = toNum(meta.bkid) || 1;
    data.booksGoal = toNum(meta.booksGoal) || 30;

    // --- Groceries ---
    const groceryHeaders = getHeaders(ss, SHEETS.GROCERIES);
    data.groceries = groceryHeaders.includes('name')
      ? readSheet(ss, SHEETS.GROCERIES, GROCERY_COLS).map(row => ({
          id: toNum(row.id),
          name: str(row.name),
          location: str(row.location),
          needsRefill: toBool(row.needsRefill),
          typicalPrice: row.typicalPrice === '' ? null : toNum(row.typicalPrice),
          lastPurchased: str(row.lastPurchased),
          createdAt: str(row.createdAt),
          updatedAt: str(row.updatedAt),
          notes: str(row.notes)
        }))
      : readSheet(ss, SHEETS.GROCERIES, LEGACY_GROCERY_COLS).map(row => ({
          id: toNum(row.id),
          name: str(row.item),
          location: str(row.location),
          needsRefill: false,
          typicalPrice: null,
          lastPurchased: '',
          createdAt: str(row.createdAt),
          updatedAt: str(row.updatedAt),
          notes: str(row.notes)
        }));

    data.gid = toNum(meta.gid) || 1;
    data.groceryLocations = [...new Set(data.groceries.map(g => g.location).filter(Boolean))];

    // --- Health Logs ---
    data.healthLogs = readSheet(ss, SHEETS.HEALTH_LOGS, HEALTH_LOG_COLS).map(row => ({
      id: toNum(row.id),
      date: normalizeDate(str(row.date)),
      metric: str(row.metric).toLowerCase().replace(/\s+/g, '_'),
      value: toNum(row.value),
      unit: str(row.unit),
      category: str(row.category),
      notes: str(row.notes),
      createdAt: str(row.createdAt)
    }));

    data.hid = toNum(meta.hid) || 1;
    data.poidsCible = toNum(meta.poidsCible) || 65;

    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  doPost — WRITE full D object to all sheets
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000); // Wait up to 10s for exclusive access

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const D = JSON.parse(e.postData.contents);

    // --- Check for conflicts ---
    if (D._expectedSavedAt) {
      const metaRows = readSheet(ss, SHEETS.META, META_COLS);
      const meta = {};
      metaRows.forEach(row => { if (row.key) meta[str(row.key)] = str(row.value); });
      if (meta.savedAt && meta.savedAt !== D._expectedSavedAt) {
        lock.releaseLock();
        return jsonResponse({
          error: 'CONFLICT',
          message: 'Data was modified by another session.',
          serverSavedAt: meta.savedAt
        }, 409);
      }
    }

    const now = new Date().toISOString();

    // --- Tasks ---
    writeSheet(ss, SHEETS.TASKS, TASK_COLS,
      (D.tasks || []).map(t => taskToRow(t)));

    // --- Completed ---
    writeSheet(ss, SHEETS.COMPLETED, TASK_COLS,
      (D.completed || []).map(t => taskToRow(t)));

    // --- Deadlines ---
    writeSheet(ss, SHEETS.DEADLINES, DEADLINE_COLS,
      (D.deadlines || []).map(d => [
        d.id, d.date, d.title, d.project, d.partner,
        d.type, d.allDay ? 'TRUE' : 'FALSE', d.keepCount ? 'TRUE' : 'FALSE', d.notes || ''
      ]));

    // --- Projects ---
    writeSheet(ss, SHEETS.PROJECTS, PROJECT_COLS,
      (D.projects || []).map(p => [p.title, p.year, p.status, p.type, p.director, p.category || (p.status === 'personal' ? 'personal' : 'film')]));

    // --- Closed ---
    writeSheet(ss, SHEETS.CLOSED, CLOSED_COLS,
      (D.closed || []).map(p => [p.title, p.year, p.director]));

    // --- People ---
    writeSheet(ss, SHEETS.PEOPLE, PEOPLE_COLS,
      (D.people || []).map(p => [p.code, p.name, p.role]));

    // --- Partners ---
    const partners = D.partners || {};
    writeSheet(ss, SHEETS.PARTNERS, PARTNER_COLS,
      Object.entries(partners).map(([k, v]) => [k, v.c, v.b]));

    // --- Monthly ---
    writeSheet(ss, SHEETS.MONTHLY, MONTHLY_COLS,
      (D.monthly || []).map(m => [m.m, m.c]));

    // --- ProjDone ---
    const pd = D.projDone || {};
    writeSheet(ss, SHEETS.PROJDONE, PROJDONE_COLS,
      Object.entries(pd).map(([k, v]) => [k, v]));

    // --- Invoices ---
    writeSheet(ss, SHEETS.INVOICES, INVOICE_COLS,
      (D.invoices || []).map(inv => [
        inv.id, inv.invoiceNumber, inv.date, inv.client, inv.project, inv.description,
        inv.montantHT, inv.tvaRate, inv.montantTTC, inv.catchupHT, inv.catchupTVA || '', inv.catchupTTC,
        inv.status, inv.pdfUrl, inv.emailSentDate, inv.bankAccountId, inv.notes,
        inv.clientAddress, inv.clientSIREN, inv.clientCostCenter, inv.clientDealRef
      ]));

    // --- Bank Accounts ---
    writeSheet(ss, SHEETS.BANKACCTS, BANKACCT_COLS,
      (D.bankAccounts || []).map(ba => [ba.id, ba.name, ba.ribImageFileId]));

    // --- Clients ---
    writeSheet(ss, SHEETS.CLIENTS, CLIENT_COLS,
      (D.clients || []).map(cl => [cl.name, cl.address, cl.siren, cl.defaultCostCenter]));

    // --- Books ---
    writeSheet(ss, SHEETS.BOOKS, BOOK_COLS,
      (D.books || []).map(b => [
        b.id, b.title, b.author, b.cover,
        b.metric || 'pages', b.total || 0, b.current || 0,
        b.progress || 0, b.rating || 0, b.status || '', b.genre || '',
        b.createdAt || '', b.updatedAt || '', b.notes || '', b.imageUrl || ''
      ]));

    // --- Books Queue ---
    writeSheet(ss, SHEETS.BOOKS_QUEUE, BOOK_QUEUE_COLS,
      (D.booksQueue || []).map(bq => [
        '',
        typeof bq === 'string' ? bq : str(bq && bq.title),
        '', '', '', '', ''
      ]));

    // --- Groceries ---
    writeSheet(ss, SHEETS.GROCERIES, GROCERY_COLS,
      (D.groceries || []).map(g => [
        g.id, g.name, g.location || '', g.needsRefill ? 'TRUE' : 'FALSE',
        g.typicalPrice === null || g.typicalPrice === undefined ? '' : g.typicalPrice,
        g.lastPurchased || '', g.notes || '', g.createdAt || '', g.updatedAt || ''
      ]));

    // --- Health Logs ---
    writeSheet(ss, SHEETS.HEALTH_LOGS, HEALTH_LOG_COLS,
      (D.healthLogs || []).map(h => [
        h.id, h.date, h.metric, h.value, h.unit || '', h.category || '',
        h.notes || '', h.createdAt || ''
      ]));

    // --- Meta ---
    writeSheet(ss, SHEETS.META, META_COLS, [
      ['nid',        D.nid || 1],
      ['dlid',       D.dlid || 1],
      ['invid',      D.invid || 1],
      ['bkid',       D.bkid || 1],
      ['booksGoal',  D.booksGoal || 30],
      ['gid',        D.gid || 1],
      ['hid',        D.hid || 1],
      ['poidsCible', D.poidsCible || 65],
      ['savedAt',    now],
      ['posters',    JSON.stringify(D.posters || {})]
    ]);

    // --- Project Colors ---
    const pc = D.projectColors || {};
    writeSheet(ss, SHEETS.PROJCOLORS, PROJCOLOR_COLS,
      Object.entries(pc).map(([k, v]) => [k, v.c, v.b, v.code || '']));

    // --- People Colors ---
    const pp = D.peopleColors || {};
    writeSheet(ss, SHEETS.PPLCOLORS, PPLCOLOR_COLS,
      Object.entries(pp).map(([k, v]) => [k, v.c, v.b]));

    lock.releaseLock();
    return jsonResponse({ success: true, savedAt: now });
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** Parse a task row from the sheet into a task object */
function parseTask(row) {
  const parseSubs = v => {
    if (!v && v !== 0) return [];
    if (Array.isArray(v)) return normalizeSubtasks(v);
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return [];
      try { return normalizeSubtasks(JSON.parse(t)); } catch (_) { return []; }
    }
    return [];
  };

  let subs = parseSubs(row.subtasks);

  // Migration: some legacy/misaligned rows stored subtasks JSON in other columns.
  if (!subs.length) {
    const candidates = [row.notes, row.blockedBy, row.order, row.createdAt, row.completedAt, row.doneDate, row.partner, row.due, row.person];
    for (let i = 0; i < candidates.length; i++) {
      const parsed = parseSubs(candidates[i]);
      if (parsed.length) { subs = parsed; break; }
    }
  }

  // Migration: backup restore misaligned columns — partner field may contain original due date
  const dueRaw = str(row.due);
  let due = /^\d+(?:\.\d+)?$/.test(dueRaw) ? null : (normalizeDate(dueRaw) || null);
  let partner = str(row.partner);
  if (!due && partner && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /.test(partner)) {
    const migrated = normalizeDate(partner);
    if (migrated) { due = migrated; partner = ''; }
  }

  let createdAt = str(row.createdAt) || null;
  let blockedBy = str(row.blockedBy) || null;
  // Migration: createdAt may be shifted into blockedBy.
  if (!createdAt && blockedBy && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(blockedBy)) {
    createdAt = blockedBy;
    blockedBy = null;
  }

  let notes = str(row.notes);
  // If notes column accidentally contains subtasks JSON, don't expose raw JSON in UI notes.
  if (notes && notes.startsWith('[') && notes.endsWith(']') && subs.length) notes = '';

  return {
    id:          toNum(row.id),
    name:        str(row.name),
    project:     str(row.project),
    person:      str(row.person),
    partner:     partner,
    priority:    toNum(row.priority) || 3,
    due:         due,
    done:        toBool(row.done),
    blocked:     toBool(row.blocked),
    blockedBy:   blockedBy,
    order:       toNum(row.order),
    notes:       notes,
    createdAt:   createdAt,
    completedAt: str(row.completedAt) || null,
    doneDate:    normalizeDate(str(row.doneDate)) || null,
    subtasks:    subs
  };
}

function normalizeSubtasks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((sub, index) => {
      if (typeof sub === 'string') {
        const name = str(sub);
        if (!name) return null;
        return { id: index + 1, name: name, completed: false };
      }
      if (!sub || typeof sub !== 'object') return null;
      const name = str(sub.name || sub.title || sub.label);
      if (!name) return null;
      return {
        id: toNum(sub.id) || index + 1,
        name: name,
        completed: toBool(sub.completed)
      };
    })
    .filter(Boolean);
}

/** Convert a task object to a row array */
function taskToRow(t) {
  return [
    t.id, t.name, t.project, t.person, t.partner,
    t.priority, t.due || '', t.done ? 'TRUE' : 'FALSE',
    t.blocked ? 'TRUE' : 'FALSE', t.blockedBy || '',
    t.order, t.notes || '', t.createdAt || '', t.completedAt || '',
    t.doneDate || '',
    JSON.stringify(t.subtasks || [])
  ];
}

/** Read a sheet and return array of objects keyed by column headers */
function readSheet(ss, name, cols) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // Only header or empty
  const headers = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), cols.length))
    .getValues()[0]
    .map(str);
  const colIndexes = cols.map((col, fallbackIndex) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? idx : fallbackIndex;
  });
  const width = Math.max(headers.length, cols.length);
  const data = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  return data.map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      const sourceIdx = colIndexes[i];
      obj[col] = sourceIdx >= 0 && sourceIdx < row.length ? row[sourceIdx] : '';
    });
    return obj;
  });
}

/** Write data to a sheet (clears existing data, always updates header) */
function writeSheet(ss, name, cols, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.setFrozenRows(1);
  }

  // Always update header row to ensure it matches current column definitions
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');

  // Clear data rows (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getMaxColumns()).clearContent();
  }

  // Write new data
  if (rows.length > 0) {
    // Ensure all rows have correct number of columns
    const padded = rows.map(r => {
      const row = [...r];
      while (row.length < cols.length) row.push('');
      return row.slice(0, cols.length);
    });
    sheet.getRange(2, 1, padded.length, cols.length).setValues(padded);
  }
}

/** Build a JSON response */
function jsonResponse(obj, status) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Type-safe conversions
function str(v)    { return v === null || v === undefined ? '' : String(v).trim(); }
function toNum(v)  { const n = Number(v); return isNaN(n) ? 0 : n; }
function toBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

/**
 * Normalize a date string to YYYY-MM-DD format.
 * Handles both YYYY-MM-DD and long JS Date strings like
 * "Mon Mar 09 2026 00:00:00 GMT+0000 (UTC+00:00)".
 */
function normalizeDate(s) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getHeaders(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 1) return [];
  const width = Math.max(1, sh.getLastColumn());
  return sh.getRange(1, 1, 1, width).getValues()[0].map(str);
}

// ═══════════════════════════════════════════════════════════════
//  SETUP — Run this once to create all sheets with headers
// ═══════════════════════════════════════════════════════════════
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = [
    { name: SHEETS.TASKS,         cols: TASK_COLS },
    { name: SHEETS.COMPLETED,     cols: TASK_COLS },
    { name: SHEETS.DEADLINES,     cols: DEADLINE_COLS },
    { name: SHEETS.PROJECTS,      cols: PROJECT_COLS },
    { name: SHEETS.CLOSED,        cols: CLOSED_COLS },
    { name: SHEETS.PEOPLE,        cols: PEOPLE_COLS },
    { name: SHEETS.PARTNERS,      cols: PARTNER_COLS },
    { name: SHEETS.MONTHLY,       cols: MONTHLY_COLS },
    { name: SHEETS.PROJDONE,      cols: PROJDONE_COLS },
    { name: SHEETS.META,          cols: META_COLS },
    { name: SHEETS.PROJCOLORS,    cols: PROJCOLOR_COLS },
    { name: SHEETS.PPLCOLORS,     cols: PPLCOLOR_COLS },
    { name: SHEETS.INVOICES,      cols: INVOICE_COLS },
    { name: SHEETS.BANKACCTS,     cols: BANKACCT_COLS },
    { name: SHEETS.CLIENTS,       cols: CLIENT_COLS },
    { name: SHEETS.BOOKS,         cols: BOOK_COLS },
    { name: SHEETS.BOOKS_QUEUE,   cols: BOOK_QUEUE_COLS },
    { name: SHEETS.GROCERIES,     cols: GROCERY_COLS },
    { name: SHEETS.HEALTH_LOGS,   cols: HEALTH_LOG_COLS }
  ];

  sheetsConfig.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    } else {
      sheet.clearContents();
    }
    // Write header
    sheet.getRange(1, 1, 1, cfg.cols.length).setValues([cfg.cols]);
    sheet.getRange(1, 1, 1, cfg.cols.length)
      .setFontWeight('bold')
      .setBackground('#1f1f28')
      .setFontColor('#d4af37');
    sheet.setFrozenRows(1);
    // Auto-resize
    for (let i = 1; i <= cfg.cols.length; i++) {
      sheet.autoResizeColumn(i);
    }
  });

  // Clean up the default "Sheet1" if it exists and is empty
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (_) {}
  }

  SpreadsheetApp.getUi().alert('✅ All sheets created successfully!\n\nYou can now deploy this as a Web App.');
}

// ═══════════════════════════════════════════════════════════════
//  DIAGNOSTIC — Check for items needing persistence
// ═══════════════════════════════════════════════════════════════
/**
 * Scans the dashboard data and identifies items without persistent storage.
 * Run this function from the Apps Script editor to get a report.
 *
 * Usage: In Apps Script editor, click Run > scanMissingData()
 *
 * Checks for:
 * - Books without stored metadata (title, author, cover missing)
 * - Groceries without location/category
 * - Health logs without proper date/metric
 * - Any items with temporary data (in-memory only)
 */
function scanMissingData() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const issues = [];

  // Check Books sheet
  const books = readSheet(ss, SHEETS.BOOKS, BOOK_COLS);
  books.forEach(b => {
    if (!str(b.title)) issues.push('📚 Book missing title');
    if (!str(b.author)) issues.push('📚 Book missing author');
    if (!str(b.cover)) issues.push('📚 Book missing cover image');
    if (!b.createdAt) issues.push('📚 Book missing createdAt timestamp');
  });

  // Check Books Queue
  const queue = readSheet(ss, SHEETS.BOOKS_QUEUE, BOOK_QUEUE_COLS);
  queue.forEach(q => {
    if (!str(q.title)) issues.push('📥 Queue item missing title');
  });

  // Check Groceries
  const groceries = readSheet(ss, SHEETS.GROCERIES, GROCERY_COLS);
  groceries.forEach(g => {
    if (!str(g.name)) issues.push('🛒 Grocery missing item name');
    if (!str(g.location)) issues.push('🛒 Grocery missing location: ' + str(g.name));
    if (!g.createdAt) issues.push('🛒 Grocery missing createdAt: ' + str(g.name));
  });

  // Check Health Logs
  const healthLogs = readSheet(ss, SHEETS.HEALTH_LOGS, HEALTH_LOG_COLS);
  healthLogs.forEach(h => {
    if (!str(h.date)) issues.push('❤️ Health log missing date');
    if (!str(h.metric)) issues.push('❤️ Health log missing metric name');
    if (!str(h.value)) issues.push('❤️ Health log missing value');
  });

  // Report results
  if (issues.length === 0) {
    ui.alert('✅ All data is properly persisted!\n\nNo missing fields detected.');
    return;
  }

  const report = '⚠️ MISSING DATA REPORT\n\n' +
    issues.slice(0, 20).join('\n') +
    (issues.length > 20 ? '\n\n... and ' + (issues.length - 20) + ' more issues' : '');

  ui.alert(report);
}

/**
 * Helper: Get the count of items that need attention
 * Call from frontend or dashboard to show notification badge
 */
function countMissingData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let count = 0;

  // Books without all required fields
  readSheet(ss, SHEETS.BOOKS, BOOK_COLS).forEach(b => {
    if (!str(b.title) || !str(b.author) || !str(b.cover)) count++;
  });

  // Groceries without location
  readSheet(ss, SHEETS.GROCERIES, GROCERY_COLS).forEach(g => {
    if (str(g.name) && !str(g.location)) count++;
  });

  // Health logs without date
  readSheet(ss, SHEETS.HEALTH_LOGS, HEALTH_LOG_COLS).forEach(h => {
    if (str(h.metric) && !str(h.date)) count++;
  });

  return count;
}

// ═══════════════════════════════════════════════════════════════
//  RESTORE — Bulk import data from Excel backup
// ═══════════════════════════════════════════════════════════════
/**
 * RESTORE DATA from Excel backup
 *
 * Usage:
 * 1. In terminal: cd /home/user/life-os && python3 restore_backup.py
 * 2. Check Google Sheets - data will be restored
 * 3. Run scanMissingData() to verify
 */
function restoreFromBackup(sheetData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!sheetData || typeof sheetData !== 'object') {
    return { success: false, error: "Invalid data format" };
  }

  try {
    // Restore all original sheets
    if (sheetData.tasks)      writeSheet(ss, SHEETS.TASKS,      TASK_COLS,       sheetData.tasks);
    if (sheetData.completed)  writeSheet(ss, SHEETS.COMPLETED,  TASK_COLS,       sheetData.completed);
    if (sheetData.deadlines)  writeSheet(ss, SHEETS.DEADLINES,  DEADLINE_COLS,   sheetData.deadlines);
    if (sheetData.projects)   writeSheet(ss, SHEETS.PROJECTS,   PROJECT_COLS,    sheetData.projects);
    if (sheetData.closed)     writeSheet(ss, SHEETS.CLOSED,     CLOSED_COLS,     sheetData.closed);
    if (sheetData.people)     writeSheet(ss, SHEETS.PEOPLE,     PEOPLE_COLS,     sheetData.people);
    if (sheetData.partners)   writeSheet(ss, SHEETS.PARTNERS,   PARTNER_COLS,    sheetData.partners);
    if (sheetData.monthly)    writeSheet(ss, SHEETS.MONTHLY,    MONTHLY_COLS,    sheetData.monthly);
    if (sheetData.projdone)   writeSheet(ss, SHEETS.PROJDONE,   PROJDONE_COLS,   sheetData.projdone);
    if (sheetData.meta)       writeSheet(ss, SHEETS.META,       META_COLS,       sheetData.meta);
    if (sheetData.projcolors) writeSheet(ss, SHEETS.PROJCOLORS, PROJCOLOR_COLS,  sheetData.projcolors);
    if (sheetData.pplcolors)  writeSheet(ss, SHEETS.PPLCOLORS,  PPLCOLOR_COLS,   sheetData.pplcolors);
    if (sheetData.invoices)   writeSheet(ss, SHEETS.INVOICES,   INVOICE_COLS,    sheetData.invoices);
    if (sheetData.bankaccts)  writeSheet(ss, SHEETS.BANKACCTS,  BANKACCT_COLS,   sheetData.bankaccts);
    if (sheetData.clients)    writeSheet(ss, SHEETS.CLIENTS,    CLIENT_COLS,     sheetData.clients);

    return {
      success: true,
      message: "✅ All data restored!",
      sheetsRestored: Object.keys(sheetData).length
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ═══════════════════════════════════════════════════════════════
//  ONE-CLICK RESTORE — Run this function to restore everything
// ═══════════════════════════════════════════════════════════════
/**
 * 🎯 EASIEST RESTORE METHOD FOR BEGINNERS - ONE CLICK!
 *
 * Step-by-step:
 * 1. Open your Google Sheet
 * 2. Click Extensions → Apps Script
 * 3. At top, find dropdown that says "Select function"
 * 4. Click it and choose "restoreAllDataNow"
 * 5. Click the ▶ RUN button (big play button at top)
 * 6. Click "Review Permissions" → "Allow"
 * 7. Wait 10-30 seconds for it to complete
 * 8. Close Apps Script and go back to your Google Sheet
 * 9. REFRESH the page (Press F5 or Cmd+R)
 * 10. All your data is back! ✅
 */
function restoreAllDataNow() {
  Logger.log('🔄 Starting restore from backup...');
  const ui = SpreadsheetApp.getUi();

  try {
    // Use the embedded backup data
    const backupData = BACKUP_DATA;

    Logger.log('📊 Data loaded: ' + Object.keys(backupData).length + ' sheets');
    Logger.log('  Tasks: ' + backupData.tasks.length + ' rows');
    Logger.log('  Projects: ' + backupData.projects.length + ' rows');
    Logger.log('  etc...');

    // Call the restore function
    const result = restoreFromBackup(backupData);

    Logger.log('✅ Result: ' + JSON.stringify(result));

    // Show success message
    ui.alert('✅ SUCCESS!\n\n' +
      'Your data has been restored to Google Sheets!\n\n' +
      'Next step:\n' +
      '1. Close this Apps Script window\n' +
      '2. Go back to your Google Sheet\n' +
      '3. Refresh the page (Press F5)\n' +
      '4. All your data should be visible!\n\n' +
      'Restored ' + Object.keys(backupData).length + ' sheets');

    return result;

  } catch (error) {
    Logger.log('❌ Error: ' + error);
    ui.alert('❌ Error during restore:\n' + error.message);
    return { success: false, error: error.toString() };
  }
}

// ═══════════════════════════════════════════════════════════════
// BACKUP DATA - Auto-generated from CSV files
// ═══════════════════════════════════════════════════════════════
const BACKUP_DATA = {
  tasks: [["6.0", "READ UK/MOROCCO SHORT FILM", "CREATIVE PRODUCER", "2.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "0.0", "", "2026-03-04T11:02:38.432Z", "", "", "[{\"id\":8,\"name\":\"REPLY ABOUT AVAILABILITY\",\"completed\":true}]"], ["9.0", "EXPLORE IF 15MIN VERSION IS DOABLE", "WATER FOR THE BIRDS", "1.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "1.0", "2026-03-04T11:04:16.916Z", "[{\"id\":10,\"name\":\"PARSE FOOTAGE (PRORES + MUSIC) INTO PREMIERE TIMELINE\",\"completed\":false},{\"id\":11,\"name\":\"SEE WHAT YOU CAN IMPROVE\",\"completed\":false},{\"id\":12,\"name\":\"DELIVER TO SEE DIFFERENCE\",\"completed\":false}]"], ["17.0", "PHASE 0 - BACK TO BUSINESS - DATA GATHERING", "THE MOUNTAIN OF PATIENCE", "1.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "2.0", "", "2026-03-04T11:19:21.348Z", "[{\"id\":18,\"name\":\"TRANSCRIBE TALAL AFIFI\u2019S VOICE NOTE\",\"completed\":false},{\"id\":19,\"name\":\"TRANSCRIBE NABIL\u2019S VOICE NOTE\",\"completed\":false},{\"id\":20,\"name\":\"TRANSCRIBE  MAHDI BEKKARI\u2019S VOICE NOTE\",\"completed\":false},{\"id\":21,\"name\":\"RECORDED CALL W/ ABDELMONÉAM\",\"completed\":false},{\"id\":22,\"name\":\"RECORDED CALL W/ ABDALLAH\",\"completed\":false},{\"id\":23,\"name\":\"RECORDED CALL W/ GHANJARI\",\"completed\":false},{\"id\":24,\"name\":\"RECORDED CALL W/ 3AMMATY ASMAE\",\"completed\":false},{\"id\":25,\"name\":\"RECORDED CALL W/ 3AMMATY HELETY\",\"completed\":false},{\"id\":26,\"name\":\"RECORDED CALL W/ SALAH SHIRAZAD\",\"completed\":false},{\"id\":27,\"name\":\"RECORDED CALL W/ BEHERY (CALLIGRAPHY CONSULTATION)\",\"completed\":false},{\"id\":43,\"name\":\"GET UNSTUCK W/ MOHAMMED BELFQIH\",\"completed\":false}]"], ["5.0", "WATCH & EVALUATE ALL ZORA VIDEOS", "ZORACHOCOLATE", "2.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "3.0", "Think PI\u0100NKY PICTURES + VALUE", "2026-03-04T11:01:50.853Z", "[{\"id\":7,\"name\":\"SAVE VIDEOS IN ONE SAFE STORAGE SPACE\",\"completed\":false}]"], ["28.0", "PHASE 1 - ORGANIZE FOOTAGE + PROPER TRAILER", "THE MOUNTAIN OF PATIENCE", "4.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "4.0", "2026-03-04T11:28:48.249Z", "", "", "[{\"id\":29,\"name\":\"CALL W/ LAMA ABOUT HER PROCESS SORTING THE FOOTAGE\",\"completed\":false},{\"id\":38,\"name\":\"MAKE A PROPER TRAILER\",\"completed\":false},{\"id\":46,\"name\":\"SELL BMPCC6K TO BUY FS7\",\"completed\":false}]"], ["37.0", "PHASE II  (THE MOUNTAIN OF PATIENCE)", "THE MOUNTAIN OF PATIENCE", "5.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "1", "SAMI", "5.0", "2026-03-04T11:47:56.607Z", "[{\"id\":39,\"name\":\"TRAILER READY TO BE SHARED / DATA ORGANIZATION SYSTEM IN PLACE\",\"completed\":false},{\"id\":40,\"name\":\"CONTACT ISABELLE FAUVELLE FOR HER CONTACTS\",\"completed\":false},{\"id\":41,\"name\":\"CONTACT SAID OUMA FOR HIS CONTACTS\",\"completed\":false},{\"id\":42,\"name\":\"CONTACT DORA BOUCHOUCHA FOR HER CONTACTS\",\"completed\":false},{\"id\":44,\"name\":\"REGISTER FILM W/ PI\u0100NKY\",\"completed\":false},{\"id\":45,\"name\":\"BE OFFICIALLY ATTACHED W/ A PRODUCER IF NECESSARY\",\"completed\":false}]"], ["75.0", "VITAMIN D - INTAKE", "HEALTH MAINTENANCE", "3.0", "Sat Mar 07 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "", "6.0", "", "2026-03-04T13:22:19.199Z", "[{\"id\":76,\"name\":\"STUDY IF IT'S THE RIGHT DECISION\",\"completed\":false}]"], ["64.0", "DECORATE ROOM IN CASABLANCA", "PERSONAL RELATIONSHIPS", "5.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "", "7.0", "2026-03-04T12:40:42.363Z", "[{\"id\":65,\"name\":\"HANG MIRROR\",\"completed\":false},{\"id\":66,\"name\":\"HANG BOARD / BUY MARKERS\",\"completed\":false},{\"id\":67,\"name\":\"GET UNDERBED SUPPORT\",\"completed\":false},{\"id\":68,\"name\":\"PERFECT LIGHT CHANDELIER\",\"completed\":false},{\"id\":69,\"name\":\"WALL POSTER SELECTION\",\"completed\":false},{\"id\":70,\"name\":\"HANG TUNISIA DECORATION\",\"completed\":false},{\"id\":90,\"name\":\"ADD HIND'S ART\",\"completed\":false}]"], ["52.0", "PHASE 0 - THE PREPARATION", "PI\u0100NKY PICTURES", "4.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "", "8.0", "2026-03-04T12:09:31.521Z", "[{\"id\":53,\"name\":\"RESOLVE AE PROBLEM\",\"completed\":false},{\"id\":54,\"name\":\"SAVE MONEY FOR COMPANY COSTS\",\"completed\":false},{\"id\":55,\"name\":\"REGISTER SOCIÉTÉ (ONLINE SERVICE?)\",\"completed\":false},{\"id\":56,\"name\":\"REGISTER IPS, PREVIOUS FILMS\",\"completed\":false},{\"id\":57,\"name\":\"CREATE PIANKY PICTURES GMAIL\",\"completed\":false},{\"id\":58,\"name\":\"CREATE A DRAFT LOGO\",\"completed\":false},{\"id\":59,\"name\":\"CREATE BUSINESS MANAGEMENT CANVAS — DFI (DURBAN FILM INSTITUTE POD)\",\"completed\":false}]"], ["60.0", "CREATE A BEAUTIFUL CALLIGRAPHY FRAME", "ARABIC CALLIGRAPHY FRAMES", "4.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "", "9.0", "2026-03-04T12:23:09.356Z", "", "", "[{\"id\":61,\"name\":\"FIND THE PERFECT PAPER (CALL CONTACTS, ETSY, AMAZON, MARKET IN CASA, ART FRIENDS...)\",\"completed\":false},{\"id\":62,\"name\":\"FIGURE OUT THE CALLIGRAPHY YOU'RE GOING TO MAKE\",\"completed\":false},{\"id\":63,\"name\":\"FIND THE PERFECT FRAME\",\"completed\":false}]"], ["71.0", "PHOTOGRAPHING THE SOUL", "DJS: PHOTOGRAPHING THE SOUL", "5.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "", "10.0", "PI\u0100NKY PICTURES", "2026-03-04T13:13:15.877Z", "", "", "[{\"id\":72,\"name\":\"FIGURE OUT LOGISTICS, BUDGET\",\"completed\":false},{\"id\":73,\"name\":\"FILM IT ON A WEEKEND OF MORE\",\"completed\":false},{\"id\":74,\"name\":\"THINK PI\u0100NKY PICTURES IN MIND\",\"completed\":false}]"], ["82.0", "ADD TO CALENDAR/TASK LIST / GROCERIES", "", "3.0", "Sat Mar 07 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "11.0", "", "2026-03-07T12:23:27.991Z", "[{\"id\":83,\"name\":\"DEBT FOR ANOUAR\",\"completed\":false},{\"id\":84,\"name\":\"BUY COTTON\",\"completed\":false},{\"id\":85,\"name\":\"BUY COMPRESS\",\"completed\":false},{\"id\":86,\"name\":\"CHECK BACTOSPRAY PRICE\",\"completed\":false},{\"id\":87,\"name\":\"FIX DEBT AND FINANCIAL BUDDY\",\"completed\":false},{\"id\":88,\"name\":\"TAKE HIND'S FRAME\",\"completed\":false},{\"id\":89,\"name\":\"VITAMIN  D\",\"completed\":false},{\"id\":91,\"name\":\"WATCH CLARISSA'S FILM\",\"completed\":false}]"], ["16.0", "READ, AND UNDERSTAND NUBIA/MUNICH LETTERS", "HALFA, THE LOST PARADISE", "3.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "12.0", "2026-03-04T11:12:22.309Z", "", "", "[]"], ["13.0", "CREATE A TRAILER", "WATER FOR THE BIRDS", "3.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "13.0", "", "2026-03-04T11:05:24.048Z", "[{\"id\":14,\"name\":\"MAKE DECISION, IF IT'S YOU OR FIVER\",\"completed\":false}]"], ["33.0", "GYM MEMBERSHIP LIFE CHANGE", "HEALTH MAINTENANCE", "3.0", "Wed Mar 25 2026 00:00:00 GMT+0100 (UTC+01:00)", "0", "0", "14.0", "", "2026-03-04T11:40:42.895Z", "[{\"id\":34,\"name\":\"DECIDE WHICH GYM (NEAR WORK, OR NEAR HOME)\",\"completed\":false},{\"id\":35,\"name\":\"BUY NICE SPORT SHOES\",\"completed\":false},{\"id\":36,\"name\":\"FIGURE OUT HIGH CALORIE + HIGH PROTEIN + CREATINE SYSTEM\",\"completed\":false}]"], ["50.0", "REPLY TO KHALED AL-KHAWALDI", "PERSONAL RELATIONSHIPS", "3.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "0", "0", "15.0", "", "2026-03-04T12:04:14.245Z", "[{\"id\":51,\"name\":\"WATCH HIS TRAILER\",\"completed\":false}]"]],
  completed: [["15.0", "PREPARE FOR JANA WAHBE'S PRODUCTION CALL", "THE MOUNTAIN OF PATIENCE", "1.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "1", "0", "4.0", "2026-03-04T11:08:14.677Z", "2026-03-05T23:49:09.872Z", "Thu Mar 05 2026 00:00:00 GMT+0000 (UTC+00:00)", "[]"], ["47.0", "CALL W/ CLARISSA", "PERSONAL RELATIONSHIPS", "3.0", "Wed Mar 04 2026 00:00:00 GMT+0000 (UTC+00:00)", "1", "0", "10.0", "2026-03-04T12:03:41.279Z", "2026-03-08T00:58:21.213Z", "Sun Mar 08 2026 00:00:00 GMT+0000 (UTC+00:00)", "[{\"id\":48,\"name\":\"WATCH HER FILM\",\"completed\":true},{\"id\":49,\"name\":\"WATCH BARBIE THE MOVIE FOR DISCUSSION\",\"completed\":true}]"], ["92.0", "ORGANIZE MY PRIORITIES (USING TIM FERRIS)", "3.0", "Mon Mar 09 2026 00:00:00 GMT+0000 (UTC+00:00)", "1", "0", "16.0", "2026-03-09T01:27:24.027Z", "2026-03-09T10:55:59.857Z", "Mon Mar 09 2026 00:00:00 GMT+0000 (UTC+00:00)", "[]"], ["77.0", "GROCERIES", "PERSONAL RELATIONSHIPS", "3.0", "Thu Mar 05 2026 00:00:00 GMT+0000 (UTC+00:00)", "1", "0", "12.0", "2026-03-05T00:15:06.513Z", "2026-03-09T12:05:06.393Z", "Mon Mar 09 2026 00:00:00 GMT+0000 (UTC+00:00)", "[{\"id\":78,\"name\":\"BACTOSPRAY\",\"completed\":true},{\"id\":79,\"name\":\"NOTEBOOK\",\"completed\":true},{\"id\":80,\"name\":\"HAIR GEL\",\"completed\":true},{\"id\":81,\"name\":\"CHICKEN\",\"completed\":true}]"]],
  deadlines: [["2.0", "Sun Mar 01 2026 17:05:00 GMT+0000 (UTC+00:00)", "PME", "hard", "0", "1"], ["5.0", "Sat Mar 14 2026 12:00:00 GMT+0000 (UTC+00:00)", "BROUILLON D\u2019UN RÊVE - DOCUMENTAIRE (APPLY BEFORE DEADLINE 9 AVRIL)", "THE MOUNTAIN OF PATIENCE", "soft", "1", "0"], ["6.0", "Thu Apr 09 2026 12:00:00 GMT+0100 (UTC+01:00)", "BROUILLON D\u2019UN RÊVE - DOCUMENTAIRE", "THE MOUNTAIN OF PATIENCE", "hard", "1", "0"], ["9.0", "Mon Apr 13 2026 12:00:00 GMT+0100 (UTC+01:00)", "STORYHOUSE - TRIP TO BEIRUT", "THE MOUNTAIN OF PATIENCE", "STORYHOUSE", "hard", "1", "0"], ["10.0", "Mon Mar 30 2026 12:00:00 GMT+0100 (UTC+01:00)", "ONEDRIVE TO WIPE OUT ALL YOUR DATA", "", "", "soft", "1", "0"], ["11.0", "Wed Apr 01 2026 12:00:00 GMT+0100 (UTC+01:00)", "RENEW MOROCCAN PASSPORT", "", "", "soft", "1", "0"], ["12.0", "Fri Apr 03 2026 12:00:00 GMT+0100 (UTC+01:00)", "DOCUMENTARY PROPOSAL | AJD | FOR LINDA QIBAA", "", "", "soft", "1", "0"], ["13.0", "Fri Apr 10 2026 12:00:00 GMT+0100 (UTC+01:00)", "MNA IS FINALLY ACTIVE!!", "soft", "1", "0"], ["14.0", "Thu Apr 30 2026 12:00:00 GMT+0100 (UTC+01:00)", "FESPACO (2027) APPLICATION", "WATER FOR THE BIRDS", "soft", "1", "0"], ["15.0", "Sun May 03 2026 12:00:00 GMT+0100 (UTC+01:00)", "CARAVANE TIGHMERT - ABD / INVITATION", "soft", "1", "0"], ["16.0", "Thu Oct 15 2026 12:00:00 GMT+0100 (UTC+01:00)", "CARAVANE TIGHMERT", "", "soft", "1", "0"], ["17.0", "Fri Aug 14 2026 12:00:00 GMT+0100 (UTC+01:00)", "RED SEA FEATURE FILM PROGRAM (14TH OF AUGUST - 20TH OF SEPTEMBER)", "THE GREEN CAFTAN", "hard", "1", "0"], ["18.0", "Fri Mar 20 2026 12:00:00 GMT+0000 (UTC+00:00)", "FIGURE GYM LIFE CHANGE / EID", "HEALTH MAINTENANCE", "soft", "1", "0"]],
  projects: [["THE MOUNTAIN OF PATIENCE", "2028.0", "dev", "Feature Film", ""], ["WATER FOR THE BIRDS", "2026.0", "distribution", "Feature Film", "TBD"], ["THE GREEN CAFTAN", "2029.0", "dev", "Feature Film", "TBD"], ["FREELANCE WORK", "0.0", "personal", "Feature Film", ""], ["ZORA CHOCOLATE", "0.0", "", "", ""], ["ZORA CHOCOLATE", "0.0", "", "", ""], ["ZORACHOCOLATE", "0.0", "personal", "", ""], ["CREATIVE PRODUCER", "0.0", "personal", "personal"], ["HALFA, THE LOST PARADISE", "0.0", "distribution", "Short Documentary"], ["NAIMA'S MOVIE (2022)", "0.0", "delivery", "Short Fiction"], ["PI\u0100NKY PICTURES", "0.0", "personal", "personal"], ["HEALTH MAINTENANCE", "0.0", "personal", "personal"], ["PERSONAL RELATIONSHIPS", "0.0", "personal", "personal"], ["ARABIC CALLIGRAPHY FRAMES", "0.0", "personal", ""], ["DJS: PHOTOGRAPHING THE SOUL", "0.0", "dev", "Short Documentary"], ["NAIMA'S MOVIE'", "0.0", "delivery", "Short Fiction"]],
  closed: [],
  people: [["JANA", "JANA WAHBE"], ["SAMI", "SAMI S. SIRELKHATIM"]],
  partners: [["STORYHOUSE", "#c8a937", "rgba(200,169,55,0.15)"], ["TAMAYOUZ", "#a937c8", "rgba(169,55,200,0.15)"]],
  monthly: [["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]],
  projdone: [],
  meta: [["nid", "93.0"], ["dlid", "20.0"], ["invid", "1.0"], ["savedAt", "2026-03-09T15:54:28.886Z"]],
  projcolors: [["THE MOUNTAIN OF PATIENCE", "#ffa82e", "rgba(255,168,46,0.12)", "TMOP"], ["WATER FOR THE BIRDS", "#0f97ff", "rgba(15,151,255,0.12)", "WTB"], ["THE GREEN CAFTAN", "#d10000", "rgba(209,0,0,0.12)", "GREENCAF"], ["ZORA CHOCOLATE", "#60a5fa", "rgba(96,165,250,0.12)", "ZORA"], ["ZORACHOCOLATE", "#ce2fee", "rgba(206,47,238,0.12)", "ZORA"], ["CREATIVE PRODUCER", "#6600ff", "rgba(102,0,255,0.12)", "PROD"], ["HALFA, THE LOST PARADISE", "#755f38", "rgba(117,95,56,0.12)", "HALFA"], ["NAIMA'S MOVIE (2022)", "# e1e50b", "rgba(225,229,11,0.12)", "NAIMA"], ["PI\u0100NKY PICTURES", "#0be5e1", "rgba(11,229,225,0.12)", "PI\u0100NKY"], ["FREELANCE WORK", "#9b5b12", "rgba(155,91,18,0.12)", "WORK"], ["HEALTH MAINTENANCE", "#ead1ff", "rgba(234,209,255,0.12)", "HEALTH"], ["PERSONAL RELATIONSHIPS", "#cdd0bd", "rgba(205,208,189,0.12)", "PERSONAL"], ["ARABIC CALLIGRAPHY FRAMES", "#3e7123", "rgba(62,113,35,0.12)", "FRAMES"], ["DJS: PHOTOGRAPHING THE SOUL", "#ffffff", "rgba(255,255,255,0.12)", "DJS"], ["NAIMA'S MOVIE'", "#902323", "rgba(144,35,35,0.12)", "NAIMA"]],
  pplcolors: [["JANA", "#43db5c", "rgba(67,219,92,0.13)"], ["SAMI", "#e24040", "rgba(226,64,64,0.13)"]],
  invoices: [],
  bankaccts: [],
  clients: []
};
