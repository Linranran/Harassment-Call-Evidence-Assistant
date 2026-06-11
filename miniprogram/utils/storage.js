const RECORDS_KEY = "call_records";
const PROGRESS_KEY = "complaint_progress";

function readList(key) {
  return wx.getStorageSync(key) || [];
}

function writeList(key, list) {
  wx.setStorageSync(key, list);
  return list;
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function getRecords() {
  return readList(RECORDS_KEY);
}

function saveRecord(record) {
  const records = getRecords();
  const now = new Date().toISOString();
  const next = {
    id: record.id || createId("rec"),
    phone: record.phone || "",
    callTime: record.callTime || "",
    callType: record.callType || "陌生来电",
    harassmentType: record.harassmentType || "其他",
    summary: record.summary || "",
    note: record.note || "",
    hasRecording: Boolean(record.hasRecording),
    companyName: record.companyName || "",
    source: record.source || "manual",
    createdAt: record.createdAt || now,
    updatedAt: now
  };
  const index = records.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    records[index] = next;
  } else {
    records.unshift(next);
  }
  writeList(RECORDS_KEY, records);
  return next;
}

function removeRecord(id) {
  const records = getRecords().filter((item) => item.id !== id);
  writeList(RECORDS_KEY, records);
  return records;
}

function getProgressList() {
  return readList(PROGRESS_KEY);
}

function saveProgress(progress) {
  const list = getProgressList();
  const now = new Date().toISOString();
  const next = {
    id: progress.id || createId("cmp"),
    channel: progress.channel || "12321",
    status: progress.status || "待提交",
    submitTime: progress.submitTime || "",
    receiptNo: progress.receiptNo || "",
    note: progress.note || "",
    recordIds: progress.recordIds || [],
    createdAt: progress.createdAt || now,
    updatedAt: now
  };
  const index = list.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    list[index] = next;
  } else {
    list.unshift(next);
  }
  writeList(PROGRESS_KEY, list);
  return next;
}

function removeProgress(id) {
  const list = getProgressList().filter((item) => item.id !== id);
  writeList(PROGRESS_KEY, list);
  return list;
}

function clearAll() {
  wx.removeStorageSync(RECORDS_KEY);
  wx.removeStorageSync(PROGRESS_KEY);
}

module.exports = {
  clearAll,
  getProgressList,
  getRecords,
  removeProgress,
  removeRecord,
  saveProgress,
  saveRecord
};
