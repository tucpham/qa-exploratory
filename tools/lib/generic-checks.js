// Generic test oracle: anomalies that are wrong in ANY project, no business rule needed.
// Based on consistency heuristics (HICCUPPS "Product" / "User expectations"). A hit is an ANOMALY,
// not a confirmed defect: the defect triager still reproduces it and checks context.
const PATTERNS = [
  { type: 'nan', severity: 'High', re: /(?<![A-Za-z])NaN(?![A-Za-z])/g },
  { type: 'undefined', severity: 'High', re: /(?<![A-Za-z_])undefined(?![A-Za-z_])/g },
  { type: 'object-object', severity: 'High', re: /\[object (Object|Promise|Array)\]/g },
  { type: 'invalid-date', severity: 'High', re: /Invalid Date|NaN\/NaN|0000-00-00/g },
  { type: 'infinity', severity: 'Medium', re: /(?<![A-Za-z])-?Infinity(?![A-Za-z])/g },
  { type: 'null-literal', severity: 'Low', re: /(?<![A-Za-z_"'])null(?![A-Za-z_"'])/g },
  { type: 'template-placeholder', severity: 'Medium', re: /\{\{\s*[\w.]+\s*\}\}|\$\{[\w.]+\}|%[sd](?![a-z])|:\w+_id\b/g },
  { type: 'i18n-key', severity: 'Medium', re: /\b(?:label|msg|message|error|title|btn|button|menu|common|validation)\.[a-z0-9_]+(?:\.[a-z0-9_]+)+\b/gi },
  { type: 'stack-trace', severity: 'High', re: /\bat [\w.$<>]+ \(.*:\d+:\d+\)|Traceback \(most recent call last\)|\bException in thread\b|java\.lang\.\w+Exception|NullPointerException|TypeError: |ReferenceError: /g },
  { type: 'db-error', severity: 'High', re: /SQLSTATE\[|ORA-\d{5}|SQL syntax.*MySQL|PG::\w+Error|duplicate key value violates/g },
  { type: 'server-error-text', severity: 'High', re: /Internal Server Error|500 Internal|502 Bad Gateway|503 Service Unavailable|Whitelabel Error Page/g },
  { type: 'replacement-char', severity: 'Medium', re: /�/g },
  { type: 'mojibake', severity: 'Medium', re: /Ã[\u0080-¿]|Ä[\u0080-¿]|á»|áº|縺|繧|譁|\?\?\?\?/g },
  { type: 'raw-html', severity: 'Medium', re: /&lt;\/?[a-z]+&gt;|&amp;(?:amp|lt|gt|quot);/g },
];

function scanText(text, { ignore = [] } = {}) {
  const out = [];
  for (const p of PATTERNS) {
    if (ignore.includes(p.type)) continue;
    p.re.lastIndex = 0; let m; let n = 0;
    while ((m = p.re.exec(text)) && n < 5) {
      n++;
      const s = Math.max(0, m.index - 40);
      out.push({ type: p.type, severity: p.severity, match: m[0], excerpt: text.slice(s, m.index + m[0].length + 40).replace(/\s+/g, ' ').trim() });
    }
  }
  return out;
}

// CSV/formula injection: cell text that a spreadsheet would execute.
function isFormulaInjection(v) {
  if (typeof v !== 'string') return false;
  const s = v.trimStart();
  return /^[=@]/.test(s) || /^[+-][A-Za-z(]/.test(s) || /^[\t\r]/.test(v);
}

module.exports = { scanText, isFormulaInjection, PATTERNS };
