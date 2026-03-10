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
const PROJECT_COLS  = ['title','year','status','type','director'];
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
const BOOK_COLS       = ['id','title','author','cover','progress','rating','status','genre','createdAt','updatedAt','notes','imageUrl'];
const BOOK_QUEUE_COLS = ['id','title','author','genre','priority','addedAt','notes'];
const GROCERY_COLS    = ['id','item','location','category','quantity','unit','priority','purchased','createdAt','updatedAt','notes'];
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
      date:      str(row.date),
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
      director: str(row.director)
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
    data.books = readSheet(ss, SHEETS.BOOKS, BOOK_COLS).map(row => ({
      id: toNum(row.id),
      title: str(row.title),
      author: str(row.author),
      cover: str(row.cover),
      progress: toNum(row.progress),
      rating: toNum(row.rating),
      status: str(row.status),
      genre: str(row.genre),
      createdAt: str(row.createdAt),
      updatedAt: str(row.updatedAt),
      notes: str(row.notes),
      imageUrl: str(row.imageUrl)
    }));

    // --- Books Queue ---
    data.booksQueue = readSheet(ss, SHEETS.BOOKS_QUEUE, BOOK_QUEUE_COLS).map(row => ({
      id: toNum(row.id),
      title: str(row.title),
      author: str(row.author),
      genre: str(row.genre),
      priority: toNum(row.priority),
      addedAt: str(row.addedAt),
      notes: str(row.notes)
    }));

    data.bkid = toNum(meta.bkid) || 1;
    data.booksGoal = toNum(meta.booksGoal) || 30;

    // --- Groceries ---
    data.groceries = readSheet(ss, SHEETS.GROCERIES, GROCERY_COLS).map(row => ({
      id: toNum(row.id),
      item: str(row.item),
      location: str(row.location),
      category: str(row.category),
      quantity: str(row.quantity),
      unit: str(row.unit),
      priority: toNum(row.priority),
      purchased: toBool(row.purchased),
      createdAt: str(row.createdAt),
      updatedAt: str(row.updatedAt),
      notes: str(row.notes)
    }));

    data.gid = toNum(meta.gid) || 1;
    data.groceryLocations = [];

    // --- Health Logs ---
    data.healthLogs = readSheet(ss, SHEETS.HEALTH_LOGS, HEALTH_LOG_COLS).map(row => ({
      id: toNum(row.id),
      date: str(row.date),
      metric: str(row.metric),
      value: str(row.value),
      unit: str(row.unit),
      category: str(row.category),
      notes: str(row.notes),
      createdAt: str(row.createdAt)
    }));

    data.hid = toNum(meta.hid) || 1;

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
      (D.projects || []).map(p => [p.title, p.year, p.status, p.type, p.director]));

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
        b.id, b.title, b.author, b.cover, b.progress || 0, b.rating || 0,
        b.status || '', b.genre || '', b.createdAt || '', b.updatedAt || '',
        b.notes || '', b.imageUrl || ''
      ]));

    // --- Books Queue ---
    writeSheet(ss, SHEETS.BOOKS_QUEUE, BOOK_QUEUE_COLS,
      (D.booksQueue || []).map(bq => [
        bq.id, bq.title, bq.author, bq.genre || '', bq.priority || 0, bq.addedAt || '', bq.notes || ''
      ]));

    // --- Groceries ---
    writeSheet(ss, SHEETS.GROCERIES, GROCERY_COLS,
      (D.groceries || []).map(g => [
        g.id, g.item, g.location || '', g.category || '', g.quantity || '',
        g.unit || '', g.priority || 0, g.purchased ? 'TRUE' : 'FALSE',
        g.createdAt || '', g.updatedAt || '', g.notes || ''
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
      ['savedAt',    now]
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
  let subs = [];
  try {
    if (row.subtasks) subs = JSON.parse(row.subtasks);
  } catch (_) {}
  return {
    id:          toNum(row.id),
    name:        str(row.name),
    project:     str(row.project),
    person:      str(row.person),
    partner:     str(row.partner),
    priority:    toNum(row.priority) || 3,
    due:         str(row.due) || null,
    done:        toBool(row.done),
    blocked:     toBool(row.blocked),
    blockedBy:   str(row.blockedBy) || null,
    order:       toNum(row.order),
    notes:       str(row.notes),
    createdAt:   str(row.createdAt) || null,
    completedAt: str(row.completedAt) || null,
    doneDate:    str(row.doneDate) || null,
    subtasks:    subs
  };
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
  const data = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();
  return data.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/** Write data to a sheet (clears existing data, keeps header) */
function writeSheet(ss, name, cols, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(cols);
    // Bold + freeze header
    sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

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
    if (!str(q.author)) issues.push('📥 Queue item missing author');
  });

  // Check Groceries
  const groceries = readSheet(ss, SHEETS.GROCERIES, GROCERY_COLS);
  groceries.forEach(g => {
    if (!str(g.item)) issues.push('🛒 Grocery missing item name');
    if (!str(g.location)) issues.push('🛒 Grocery missing location: ' + str(g.item));
    if (!str(g.category)) issues.push('🛒 Grocery missing category: ' + str(g.item));
    if (!g.createdAt) issues.push('🛒 Grocery missing createdAt: ' + str(g.item));
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
    if (str(g.item) && !str(g.location)) count++;
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