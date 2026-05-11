// ═══════════════════════════════════════════════════════════════
// TELEGRAM — Webhook handler for Financial Buddy bot
// ═══════════════════════════════════════════════════════════════

var TELEGRAM_ALLOWED_UID = 8242935687;

function handleTelegramUpdate(update) {
  try {
    var msg = update.message || update.edited_message;
    if (!msg || !msg.text) return finOkResponse();

    var chatId = msg.chat.id;
    var userId = msg.from ? Number(msg.from.id) : null;
    var text   = String(msg.text).trim();

    if (userId !== TELEGRAM_ALLOWED_UID) return finOkResponse();

    dispatchFinanceMessage(text, chatId);
    return finOkResponse();

  } catch (err) {
    Logger.log('Telegram handler error: ' + err.message + '\n' + err.stack);
    return finOkResponse();
  }
}

function dispatchFinanceMessage(text, chatId) {
  var lower = text.toLowerCase();

  // ── Exact commands (no AI needed) ──

  if (lower.indexOf('delete last') >= 0) {
    var deleted = softDeleteLast();
    if (deleted) {
      sendTelegramMessage(chatId,
        '🗑 Deleted: ' + deleted.description + ' — ' +
        Math.abs(deleted.amount).toLocaleString() + ' ' + deleted.currency +
        ' (' + deleted.category + ')');
    } else {
      sendTelegramMessage(chatId, '❌ No recent transaction to delete.');
    }
    return;
  }

  if (/change last to\s+\d+/i.test(text)) {
    var match = text.match(/change last to\s+(\d+(?:\.\d+)?)/i);
    if (match) {
      var changed = changeLastAmount(parseFloat(match[1]));
      if (changed) {
        sendTelegramMessage(chatId,
          '✅ Updated: ' + changed.description + ' → ' +
          Math.abs(changed.amount).toLocaleString() + ' ' + changed.currency);
      } else {
        sendTelegramMessage(chatId, '❌ No recent transaction to update.');
      }
    }
    return;
  }

  if (lower.indexOf('undo') >= 0) {
    var restored = undoDelete();
    if (restored) {
      sendTelegramMessage(chatId,
        '↩️ Restored: ' + restored.description + ' — ' +
        Math.abs(restored.amount).toLocaleString() + ' ' + restored.currency +
        ' (' + restored.category + ')');
    } else {
      sendTelegramMessage(chatId, '❌ Nothing to undo.');
    }
    return;
  }

  if (lower.indexOf('balance') >= 0) {
    sendTelegramMessage(chatId, getBalanceText());
    return;
  }

  if (lower.indexOf('week') >= 0) {
    sendTelegramMessage(chatId, getWeeklyText());
    return;
  }

  if (lower.indexOf('distribution') >= 0 || lower.indexOf('breakdown') >= 0 || lower.indexOf('repartition') >= 0) {
    sendTelegramMessage(chatId, getDistributionText());
    return;
  }

  if (lower.indexOf('month') >= 0) {
    sendTelegramMessage(chatId, getMonthlyText());
    return;
  }

  // ── Default: parse with Gemini ──
  try {
    var parsed = parseWithGemini(text);

    if (parsed.multi && parsed.transactions) {
      var lines = [];
      parsed.transactions.forEach(function(tx) {
        addTransaction(tx);
        lines.push('✓ ' + tx.description + ' — ' +
          Math.abs(tx.amount) + ' ' + (tx.currency || 'MAD') +
          ' (' + tx.category + ') ' + getCatEmoji(tx.category));
      });
      sendTelegramMessage(chatId, lines.join('\n'));
      return;
    }

    if (!parsed.type || parsed.type === 'Unknown') {
      sendTelegramMessage(chatId, '🤷 Could not parse that. Try: "45 taxi" or "balance" or "week"');
      return;
    }

    if (parsed.type === 'Debt') {
      addDebt(parsed);
      var dir = (parsed.debt_action === 'Borrowed' || parsed.debt_action === 'Payment')
        ? '📤 Updated: what you owe ' + parsed.person
        : '📥 Updated: what ' + parsed.person + ' owes you';
      sendTelegramMessage(chatId,
        '✓ ' + parsed.description + ' — ' + Math.abs(parsed.amount) + ' ' + (parsed.currency || 'MAD') + '\n' + dir);
      return;
    }

    // Low confidence: warn but still save
    if (parsed.confidence < 0.8) {
      sendTelegramMessage(chatId,
        '🤔 Not sure. Did you mean: ' + parsed.description +
        ' — ' + Math.abs(parsed.amount || 0) + ' ' + (parsed.currency || 'MAD') +
        ' (' + parsed.category + ')? Rephrase if wrong.');
    }

    addTransaction(parsed);

    if (parsed.confidence >= 0.8) {
      var bigFlag = (parsed.amount || 0) < -200 ? '\n⚠️ Big expense — above 200 MAD' : '';
      sendTelegramMessage(chatId,
        '✓ ' + parsed.description + ' — ' +
        Math.abs(parsed.amount || 0) + ' ' + (parsed.currency || 'MAD') +
        ' (' + parsed.category + ') ' + getCatEmoji(parsed.category) + bigFlag);
    }

  } catch (err) {
    Logger.log('Parse/write error: ' + err.message + '\n' + err.stack);
    sendTelegramMessage(chatId, '❌ Error processing message: ' + err.message);
  }
}

function sendTelegramMessage(chatId, text) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) { Logger.log('TELEGRAM_BOT_TOKEN not set in Script Properties'); return; }
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text }),
    muteHttpExceptions: true
  });
}

function getCatEmoji(cat) {
  var map = {
    'Food': '🍕', 'Transport': '🚕', 'Medical': '🏥',
    'Rent': '🏠', 'Groceries': '🛒', 'Personal': '🧴',
    'Subscriptions': '📱', 'Entertainment': '🎬',
    'Production Costs': '🎥', 'Gifts': '🎁',
    'Charity': '💝', 'Phone': '📞'
  };
  return map[cat] || '';
}

function finOkResponse() {
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}
