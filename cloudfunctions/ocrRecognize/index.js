const cloud = require("wx-server-sdk");
const tencentcloud = require("tencentcloud-sdk-nodejs");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const OcrClient = tencentcloud.ocr.v20181119.Client;

function mockRecords() {
  const now = new Date();
  const dateText = now.toISOString().slice(0, 10);

  return {
    mode: "mock",
    text: "",
    records: [
      {
        phone: "0755-2688****",
        callTime: `${dateText} 10:24`,
        callType: "未接来电",
        harassmentType: "深圳入户",
        summary: "深圳入户中介营销，未经同意反复拨打",
        source: "cloud_mock_ocr"
      }
    ]
  };
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xff10 + 48))
    .replace(/[＊Ｘｘ]/g, "*")
    .replace(/[–—－]/g, "-");
}

function normalizePhone(value) {
  return normalizeText(value)
    .replace(/[xX]/g, "*")
    .replace(/^\s*\((0\d{2,3})\)\s*/, "$1-")
    .replace(/[()（）]/g, "")
    .replace(/[^\d+*-]/g, "")
    .replace(/-{2,}/g, "-");
}

function isLikelyPhone(value) {
  const normalized = normalizePhone(value);
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 14) return false;
  if (/^\d{1,2}:\d{2}$/.test(String(value).trim())) return false;
  if (/^20\d{6,12}$/.test(digits)) return false;
  return true;
}

function compactPhoneForCompare(value) {
  return normalizePhone(value).replace(/[^\d*]/g, "");
}

function extractPhoneCandidates(content) {
  const candidates = [];
  const phoneLikeRegexes = [
    /(?:\+?86[\s-]?)?1[3-9](?:[\s-]?\d){9}/g,
    /\(?0\d{2,3}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    /95(?:[\s-]?[\d*]){2,10}/g,
    /400(?:[\s-]?[\d*]){6,10}/g,
    /(?:\d{3,4}[\s-]){1,3}\d{3,4}/g
  ];

  phoneLikeRegexes.forEach((phoneLikeRegex) => {
    let match;
    while ((match = phoneLikeRegex.exec(content))) {
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

function guessHarassmentType(text) {
  if (/入户|落户|深户|人才引进|社保|公积金/.test(text)) return "深圳入户";
  if (/贷款|借款|额度|利息|放款/.test(text)) return "贷款";
  if (/房|楼盘|买房|卖房|租房|中介/.test(text)) return "房产";
  if (/保险|保单|保障/.test(text)) return "保险";
  if (/课程|培训|学历|教育/.test(text)) return "教育培训";
  if (/装修|家装/.test(text)) return "装修";
  if (/招聘|职位|岗位|简历|面试|兼职/.test(text)) return "招聘";
  if (/催收|逾期|欠款|还款|债务/.test(text)) return "催收";
  if (/理财|投资|基金|收益|期货/.test(text)) return "投资理财";
  if (/股票|证券|荐股|牛股|炒股/.test(text)) return "股票证券";
  if (/医美|美容|整形|祛斑|植发/.test(text)) return "医美";
  if (/客服|订单|退款|售后|电商|淘宝|京东|拼多多/.test(text)) return "电商客服";
  if (/快递|物流|包裹|取件|派送/.test(text)) return "快递物流";
  if (/婚恋|相亲|交友|红娘/.test(text)) return "婚恋交友";
  if (/外卖|到店|团购|家政|维修|保洁/.test(text)) return "本地生活";
  if (/诈骗|验证码|银行卡|转账|中奖|公安|法院/.test(text)) return "疑似诈骗";
  return "其他";
}

function extractRecordsFromText(text) {
  const content = normalizeText(text || "");
  const lines = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const dateRegex = /(?:20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}日?)?\s*\d{1,2}:\d{2}/;
  const uniquePhones = extractPhoneCandidates(content);

  return uniquePhones.map((item) => {
    const nearbyText = content.slice(Math.max(0, item.index - 80), item.index + 120);
    const compactPhone = compactPhoneForCompare(item.phone);
    const nearbyLines = lines.filter((line) => compactPhoneForCompare(line).includes(compactPhone));
    const dateMatch = nearbyText.match(dateRegex) || content.match(dateRegex);
    const callType = /未接/.test(nearbyText) ? "未接来电" : /已接|通话/.test(nearbyText) ? "已接来电" : "陌生来电";
    const harassmentType = guessHarassmentType(content);

    return {
      phone: item.phone,
      callTime: dateMatch ? dateMatch[0].replace(/[年月]/g, "-").replace("日", "").trim() : "",
      callType,
      harassmentType,
      summary: nearbyLines.join("；"),
      source: "tencent_ocr"
    };
  });
}

async function downloadImage(fileID) {
  const result = await cloud.downloadFile({ fileID });
  return result.fileContent;
}

async function recognizeByTencentOCR(imageBuffer) {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  const region = process.env.TENCENT_OCR_REGION || "ap-guangzhou";

  if (!secretId || !secretKey) {
    throw new Error("Missing TENCENT_SECRET_ID or TENCENT_SECRET_KEY env vars");
  }

  const client = new OcrClient({
    credential: {
      secretId,
      secretKey
    },
    region,
    profile: {
      httpProfile: {
        endpoint: "ocr.tencentcloudapi.com"
      }
    }
  });

  const result = await client.GeneralBasicOCR({
    ImageBase64: imageBuffer.toString("base64")
  });

  const text = (result.TextDetections || [])
    .map((item) => item.DetectedText)
    .filter(Boolean)
    .join("\n");

  return {
    raw: result,
    text
  };
}

exports.main = async (event) => {
  if (!event || !event.fileID) {
    return mockRecords();
  }

  try {
    const imageBuffer = await downloadImage(event.fileID);
    const ocr = await recognizeByTencentOCR(imageBuffer);
    const records = extractRecordsFromText(ocr.text);

    return {
      mode: "tencent_ocr",
      text: ocr.text,
      records,
      raw: ocr.raw
    };
  } catch (error) {
    return {
      mode: "error",
      records: [],
      message: error.message || "OCR failed"
    };
  }
};
