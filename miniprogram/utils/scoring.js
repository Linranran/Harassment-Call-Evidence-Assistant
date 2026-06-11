function scoreRecord(record) {
  const checks = [
    { key: "phone", label: "号码", ok: Boolean(record.phone) },
    { key: "callTime", label: "来电时间", ok: Boolean(record.callTime) },
    { key: "summary", label: "骚扰内容", ok: Boolean(record.summary) },
    { key: "harassmentType", label: "骚扰类型", ok: Boolean(record.harassmentType) },
    { key: "companyName", label: "公司名", ok: Boolean(record.companyName) },
    { key: "hasRecording", label: "录音", ok: Boolean(record.hasRecording) }
  ];
  const passed = checks.filter((item) => item.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const missing = checks.filter((item) => !item.ok).map((item) => item.label);
  return {
    score,
    missing,
    level: score >= 80 ? "较完整" : score >= 50 ? "可提交" : "需补充"
  };
}

function scoreRecords(records) {
  if (!records.length) {
    return {
      score: 0,
      level: "需补充",
      missing: ["骚扰记录"]
    };
  }
  const average = Math.round(
    records.reduce((sum, record) => sum + scoreRecord(record).score, 0) / records.length
  );
  return {
    score: average,
    level: average >= 80 ? "较完整" : average >= 50 ? "可提交" : "需补充",
    missing: []
  };
}

module.exports = {
  scoreRecord,
  scoreRecords
};
