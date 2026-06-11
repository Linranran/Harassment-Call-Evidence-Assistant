function mockRecognizeImage() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const dateText = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return [
    {
      phone: "0755-2688****",
      callTime: `${dateText} 10:24`,
      callType: "未接来电",
      harassmentType: "深圳入户",
      summary: "深圳入户中介营销，未经同意反复拨打",
      source: "mock_ocr"
    },
    {
      phone: "9521****",
      callTime: `${dateText} 14:16`,
      callType: "已接来电",
      harassmentType: "深圳入户",
      summary: "落户、人才引进相关营销电话",
      source: "mock_ocr"
    }
  ];
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xff10 + 48))
    .replace(/[＊ＸｘxX]/g, "*")
    .replace(/[–—－]/g, "-")
    .replace(/^\s*\((0\d{2,3})\)\s*/, "$1-")
    .replace(/[()（）]/g, "")
    .replace(/[^\d+*-]/g, "")
    .replace(/-{2,}/g, "-");
}

function isLikelyPhone(value) {
  const digits = normalizePhone(value).replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 14) return false;
  if (/^\d{1,2}:\d{2}$/.test(String(value).trim())) return false;
  if (/^20\d{6,12}$/.test(digits)) return false;
  return true;
}

function compactPhoneForCompare(value) {
  return normalizePhone(value).replace(/[^\d*]/g, "");
}

function normalizeOcrText(value) {
  return String(value || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xff10 + 48))
    .replace(/[＊ＸｘxX]/g, "*")
    .replace(/[–—－]/g, "-");
}

function extractPhoneCandidates(content) {
  const candidates = [];
  const normalizedContent = normalizeOcrText(content);
  const phoneLikeRegexes = [
    /(?:\+?86[\s-]?)?1[3-9](?:[\s-]?\d){9}/g,
    /\(?0\d{2,3}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    /95(?:[\s-]?[\d*]){2,10}/g,
    /400(?:[\s-]?[\d*]){6,10}/g,
    /(?:\d{3,4}[\s-]){1,3}\d{3,4}/g
  ];

  phoneLikeRegexes.forEach((phoneLikeRegex) => {
    let match;
    while ((match = phoneLikeRegex.exec(normalizedContent))) {
      const raw = match[0].trim();
      if (!isLikelyPhone(raw)) continue;
      candidates.push({
        phone: normalizePhone(raw),
        index: match.index
      });
    }
  });

  return candidates.filter((item, index, list) => {
    const current = compactPhoneForCompare(item.phone);
    const duplicateIndex = list.findIndex((candidate) => compactPhoneForCompare(candidate.phone) === current);
    if (duplicateIndex !== index) return false;
    return !list.some((candidate, candidateIndex) => {
      if (candidateIndex === index) return false;
      const other = compactPhoneForCompare(candidate.phone);
      return other.length > current.length && other.includes(current);
    });
  });
}

function parseOcrText(text) {
  const content = String(text || "");
  const dateMatch = content.match(/(?:20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}日?)?\s*\d{1,2}:\d{2}/);
  return extractPhoneCandidates(content).map((item) => ({
    phone: item.phone,
    callTime: dateMatch ? dateMatch[0].replace(/[年月]/g, "-").replace("日", "").trim() : "",
    callType: "陌生来电",
    harassmentType: "其他",
    summary: "",
    source: "text_parse"
  }));
}

module.exports = {
  mockRecognizeImage,
  normalizePhone,
  parseOcrText
};
