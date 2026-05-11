// ═══════════════════════════════════════════════════════════════
// FINANCE SHEETS — All Google Sheets ops against Finance OS
// ═══════════════════════════════════════════════════════════════

function getFinanceSS() {
  return SpreadsheetApp.openById(FINANCE_SS_ID);
}

// ── READ: Full dashboard data (called from Life OS Finance tab) ──
function getFinanceData() {
  try {
    var ss = getFinanceSS();
    var tz = Session.getScriptTimeZone();
    var data = { currency: 'MAD' };

    // STATE
    var stateSheet = ss.getSheetByName('State');
    data.state = {};
    if (stateSheet) {
      data.state = {
        currentBalance:   fnv(stateSheet, 'C5'),
        availableBalance: fnv(stateSheet, 'C8'),
        monthIncome:      fnv(stateSheet, 'C12'),
        monthExpenses:    fnv(stateSheet, 'C13'),
        monthNet:         fnv(stateSheet, 'C14'),
        weekExpenses:     fnv(stateSheet, 'C16'),
        weekIncome:       fnv(stateSheet, 'C17'),
        weekNet:          fnv(stateSheet, 'C18'),
        lastWeek:         fnv(stateSheet, 'C31')
      };
    }

    // TRANSACTIONS (bulk read once, reused everywhere)
    var txSheet = ss.getSheetByName('Transactions');
    var txData = txSheet ? txSheet.getDataRange().getValues() : [];

    // RECENT TRANSACTIONS (last 20 non-deleted)
    data.recentTransactions = [];
    for (var i = txData.length - 1; i >= 1 && data.recentTransactions.length < 20; i--) {
      var row = txData[i];
      if (row[FC.DELETED] === true || String(row[FC.DELETED]).toUpperCase() === 'TRUE') continue;
      if (!row[FC.DATE]) continue;
      var dateStr = row[FC.DATE] instanceof Date
        ? Utilities.formatDate(row[FC.DATE], tz, 'MMM dd')
        : String(row[FC.DATE]).substring(0, 10);
      data.recentTransactions.push({
        date:        dateStr,
        type:        String(row[FC.TYPE] || ''),
        category:    String(row[FC.CAT] || 'Other'),
        description: String(row[FC.DESC] || ''),
        amount:      Number(row[FC.AMT]) || 0,
        note:        String(row[FC.NOTE] || '')
      });
    }

    // CATEGORY SPENDING — This Month
    var catSheet = ss.getSheetByName('Category Spending');
    data.categorySpending = [];
    data.categoryTotal = 0;
    if (catSheet) {
      for (var r = 5; r <= 17; r++) {
        var name  = catSheet.getRange('B' + r).getValue();
        var spent = catSheet.getRange('C' + r).getValue();
        if (!name) continue;
        var val = Math.abs(Number(spent) || 0);
        if (val > 0) data.categorySpending.push({ name: String(name), value: val });
      }
      data.categoryTotal = Math.abs(Number(catSheet.getRange('C19').getValue()) || 0);
    }

    // ALL-TIME CATEGORY SPENDING (computed from Transactions)
    var allTimeByCat = {}, allTimeTotal = 0;
    for (var i = 1; i < txData.length; i++) {
      var row = txData[i];
      if (row[FC.DELETED] === true || String(row[FC.DELETED]).toUpperCase() === 'TRUE') continue;
      var type = String(row[FC.TYPE] || '');
      if (type !== 'Expense' && type !== 'CNSS_Expense') continue;
      var cat = String(row[FC.CAT] || 'Other');
      var absAmt = Math.abs(Number(row[FC.AMT]) || 0);
      if (absAmt > 0) {
        allTimeByCat[cat] = (allTimeByCat[cat] || 0) + absAmt;
        allTimeTotal += absAmt;
      }
    }
    data.allTimeCategorySpending = Object.keys(allTimeByCat)
      .map(function(k) { return { name: k, value: Math.round(allTimeByCat[k]) }; })
      .sort(function(a, b) { return b.value - a.value; });
    data.allTimeCategoryTotal = Math.round(allTimeTotal);

    // WEEKLY SPENDING
    var weekSheet = ss.getSheetByName('Weekly Spending');
    data.weeklySpending = [];
    data.weekLabel = '';
    data.weeklyTotal = 0;
    if (weekSheet) {
      data.weekLabel = String(weekSheet.getRange('B3').getValue() || 'This Week');
      for (var r = 6; r <= 14; r++) {
        var name   = weekSheet.getRange('B' + r).getValue();
        var amount = weekSheet.getRange('C' + r).getValue();
        if (!name || String(name) === 'TOTAL') continue;
        var val = Math.abs(Number(amount) || 0);
        if (val > 0) data.weeklySpending.push({ name: String(name), value: val });
      }
      data.weeklyTotal = Math.abs(Number(weekSheet.getRange('C15').getValue()) || 0);
    }

    // MONTHLY SUMMARY
    var monthlySheet = ss.getSheetByName('Monthly Summary');
    data.monthlySummary = [];
    if (monthlySheet) {
      for (var r = 5; r <= 30; r++) {
        var month    = monthlySheet.getRange('B' + r).getValue();
        var income   = Number(monthlySheet.getRange('C' + r).getValue()) || 0;
        var expenses = Number(monthlySheet.getRange('D' + r).getValue()) || 0;
        var net      = Number(monthlySheet.getRange('E' + r).getValue()) || 0;
        if (!month) break;
        if (income === 0 && expenses === 0) continue;
        data.monthlySummary.push({
          month:    String(month),
          income:   income,
          expenses: Math.abs(expenses),
          net:      net
        });
      }
    }

    // CNSS
    var cnssSheet = ss.getSheetByName('CNSS');
    var cnssPending = 0, cnssRefunded = 0, cnssRate = 0;
    if (cnssSheet) {
      cnssPending  = Math.abs(Number(cnssSheet.getRange('C4').getValue()) || 0);
      cnssRefunded = Math.abs(Number(cnssSheet.getRange('C5').getValue()) || 0);
      cnssRate     = Number(cnssSheet.getRange('C6').getValue()) || 0;
    }
    var cnssTxs = [], cnssCount = 0;
    for (var i = 1; i < txData.length; i++) {
      var row = txData[i];
      if (row[FC.DELETED] === true || String(row[FC.DELETED]).toUpperCase() === 'TRUE') continue;
      if (!row[FC.DATE]) continue;
      var type = String(row[FC.TYPE] || '');
      var note = String(row[FC.NOTE] || '');
      if (type.indexOf('CNSS') < 0 && note.toUpperCase().indexOf('CNSS') < 0) continue;
      cnssCount++;
      var dateStr = row[FC.DATE] instanceof Date
        ? Utilities.formatDate(row[FC.DATE], tz, 'MMM dd, yyyy')
        : String(row[FC.DATE]).substring(0, 10);
      cnssTxs.push({ date: dateStr, description: String(row[FC.DESC] || ''), amount: Number(row[FC.AMT]) || 0, type: type });
    }
    cnssTxs.sort(function(a, b) { return b.date > a.date ? 1 : -1; });
    data.cnss = { pending: cnssPending, refunded: cnssRefunded, rate: cnssRate, count: cnssCount, transactions: cnssTxs };

    // DEBTS
    var debtSheet = ss.getSheetByName('Debts');
    data.debts = { summary: [], entries: [] };
    if (debtSheet) {
      var debtData = debtSheet.getDataRange().getValues();
      for (var i = 0; i < debtData.length; i++) {
        if (String(debtData[i][9]) === 'Person') {
          for (var j = i + 1; j < debtData.length && j < i + 10; j++) {
            var sRow = debtData[j];
            var person = sRow[9];
            if (!person || String(person).trim() === '' || String(person).indexOf('📝') >= 0) break;
            var iOwe    = Number(sRow[10]) || 0;
            var currency = String(sRow[11] || 'MAD');
            var theyOwe = Number(sRow[12]) || 0;
            if (iOwe > 0 || theyOwe > 0) {
              data.debts.summary.push({ person: String(person), iOwe: iOwe, currency: currency, theyOwe: theyOwe });
            }
          }
          break;
        }
      }
      for (var i = 0; i < debtData.length; i++) {
        var row = debtData[i];
        var person = row[3], type = row[4], amount = row[5], curr = row[6];
        if (person && type && Number(amount) > 0 && String(type) !== 'Type' && String(person) !== 'Person') {
          data.debts.entries.push({ person: String(person), type: String(type), amount: Number(amount), currency: String(curr || 'MAD') });
        }
      }
    }

    data.lastUpdated = new Date().toISOString();
    return data;

  } catch (err) {
    return { error: err.message + ' | ' + err.stack };
  }
}

function fnv(sheet, cell) {
  return Number(sheet.getRange(cell).getValue()) || 0;
}

// ── WRITE: Add transaction row ──
function addTransaction(parsed) {
  var ss = getFinanceSS();
  var sheet = ss.getSheetByName('Transactions');
  var tz = Session.getScriptTimeZone();
  var now = new Date();
  var id = sheet.getLastRow();
  sheet.appendRow([
    id,
    Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    Utilities.formatDate(now, tz, 'HH:mm'),
    parsed.type || 'Expense',
    parsed.category || 'Other',
    parsed.description || '',
    parsed.amount || 0,
    parsed.confidence !== undefined ? parsed.confidence : 1,
    false,
    false,
    parsed.note || '',
    parsed.currency || 'MAD',
    parsed.person || '',
    parsed.debt_action || ''
  ]);
}

// ── WRITE: Add debt entry ──
function addDebt(parsed) {
  var ss = getFinanceSS();
  var sheet = ss.getSheetByName('Debts');
  var id = sheet.getLastRow();
  sheet.appendRow([
    id,
    new Date(),
    '',
    parsed.person || '',
    parsed.debt_action || '',
    Math.abs(parsed.amount || 0),
    parsed.currency || 'MAD',
    parsed.note || ''
  ]);
}

// ── WRITE: Soft-delete last non-deleted transaction ──
function softDeleteLast() {
  var ss = getFinanceSS();
  var sheet = ss.getSheetByName('Transactions');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (row[FC.DELETED] === true || String(row[FC.DELETED]).toUpperCase() === 'TRUE') continue;
    if (!row[FC.DATE]) continue;
    sheet.getRange(i + 1, FC.DELETED + 1).setValue(true);
    return {
      description: String(row[FC.DESC]),
      amount:      Number(row[FC.AMT]),
      currency:    String(row[FC.CURRENCY] || 'MAD'),
      category:    String(row[FC.CAT])
    };
  }
  return null;
}

// ── WRITE: Restore last soft-deleted transaction ──
function undoDelete() {
  var ss = getFinanceSS();
  var sheet = ss.getSheetByName('Transactions');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (row[FC.DELETED] !== true && String(row[FC.DELETED]).toUpperCase() !== 'TRUE') continue;
    if (!row[FC.DATE]) continue;
    sheet.getRange(i + 1, FC.DELETED + 1).setValue(false);
    return {
      description: String(row[FC.DESC]),
      amount:      Number(row[FC.AMT]),
      currency:    String(row[FC.CURRENCY] || 'MAD'),
      category:    String(row[FC.CAT])
    };
  }
  return null;
}

// ── WRITE: Change amount of last non-deleted transaction ──
function changeLastAmount(newAmount) {
  var ss = getFinanceSS();
  var sheet = ss.getSheetByName('Transactions');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (row[FC.DELETED] === true || String(row[FC.DELETED]).toUpperCase() === 'TRUE') continue;
    if (!row[FC.DATE]) continue;
    var oldAmt = Number(row[FC.AMT]);
    var signed = oldAmt < 0 ? -Math.abs(newAmount) : Math.abs(newAmount);
    sheet.getRange(i + 1, FC.AMT + 1).setValue(signed);
    return {
      description: String(row[FC.DESC]),
      amount:      signed,
      currency:    String(row[FC.CURRENCY] || 'MAD')
    };
  }
  return null;
}

// ── READ: Telegram reply helpers ──
function getBalanceText() {
  var state = getFinanceSS().getSheetByName('State');
  if (!state) return '❌ State sheet not found';
  var balance = Math.round(fnv(state, 'C8'));
  return '💰 Available Balance: ' + balance.toLocaleString() + ' MAD';
}

function getWeeklyText() {
  var state = getFinanceSS().getSheetByName('State');
  if (!state) return '❌ State sheet not found';
  var exp      = Math.abs(Math.round(fnv(state, 'C16')));
  var inc      = Math.round(fnv(state, 'C17'));
  var net      = Math.round(fnv(state, 'C18'));
  var lastWeek = Math.abs(Math.round(fnv(state, 'C31')));
  return '📊 This Week (since Monday)\n\n' +
    '💸 Expenses: ' + exp.toLocaleString() + ' MAD\n' +
    '💰 Income: '   + inc.toLocaleString() + ' MAD\n' +
    '📈 Net: '      + net.toLocaleString() + ' MAD\n\n' +
    '📅 Last week: ' + lastWeek.toLocaleString() + ' MAD';
}

function getDistributionText() {
  var catSheet = getFinanceSS().getSheetByName('Category Spending');
  if (!catSheet) return '❌ Category Spending sheet not found';
  var total = Math.abs(Number(catSheet.getRange('C19').getValue()) || 0);
  var lines = ['📊 Spending Distribution This Month\n'];
  for (var r = 5; r <= 17; r++) {
    var name  = catSheet.getRange('B' + r).getValue();
    var spent = Math.abs(Number(catSheet.getRange('C' + r).getValue()) || 0);
    if (!name || spent === 0) continue;
    var pct = total > 0 ? Math.round(spent / total * 100) : 0;
    lines.push(name + ': ' + Math.round(spent).toLocaleString() + ' MAD (' + pct + '%)');
  }
  if (total > 0) lines.push('\nTotal: ' + Math.round(total).toLocaleString() + ' MAD');
  return lines.join('\n');
}

function getMonthlyText() {
  var state = getFinanceSS().getSheetByName('State');
  if (!state) return '❌ State sheet not found';
  var inc  = Math.round(fnv(state, 'C12'));
  var exp  = Math.abs(Math.round(fnv(state, 'C13')));
  var net  = Math.round(fnv(state, 'C14'));
  var now  = new Date();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var label = months[now.getMonth()] + ' ' + now.getFullYear();
  return '📅 ' + label + '\n\n' +
    '💰 Income: '   + inc.toLocaleString() + ' MAD\n' +
    '💸 Expenses: ' + exp.toLocaleString() + ' MAD\n' +
    '📈 Net: '      + net.toLocaleString() + ' MAD';
}
