// ═══════════════════════════════════════════════════════════════
// FINANCE PARSER — Gemini 2.0 Flash transaction parsing
// ═══════════════════════════════════════════════════════════════

function parseWithGemini(text) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY not set in Script Properties');

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key;

  var payload = {
    contents: [{
      role: 'user',
      parts: [{ text: FINANCE_SYSTEM_PROMPT + '\n\nUser message: ' + text }]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 600
    }
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());

  if (json.error) throw new Error('Gemini error: ' + json.error.message);

  var raw = json.candidates[0].content.parts[0].text.trim();
  // Strip markdown code fences if Gemini wraps output
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(raw);
}
