const { HARASSMENT_TYPES } = require("../../utils/constants");
const { saveRecord } = require("../../utils/storage");

function createBlankRecord() {
  return {
    localId: `local_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    phone: "",
    callTime: "",
    callType: "陌生来电",
    harassmentType: "其他",
    companyName: "",
    summary: "",
    note: "",
    hasRecording: false,
    selected: true,
    source: "manual"
  };
}

Page({
  data: {
    harassmentTypes: HARASSMENT_TYPES,
    isEdit: false,
    selectionStep: false,
    records: []
  },

  onLoad(query) {
    const editing = wx.getStorageSync("editing_record");
    if (query.edit && editing) {
      this.setData({
        isEdit: true,
        selectionStep: false,
        records: [{ ...editing, localId: editing.id }]
      });
      return;
    }

    if (query.manual) {
      this.setData({
        selectionStep: false,
        records: [createBlankRecord()]
      });
      return;
    }

    const pending = wx.getStorageSync("pending_ocr_records") || [];
    this.setData({
      selectionStep: pending.length > 0,
      records: pending.length
        ? pending.map((item, index) => ({
            ...createBlankRecord(),
            ...item,
            localId: `ocr_${index}`,
            selected: index === 0
          }))
        : [createBlankRecord()]
    });
  },

  updateField(event) {
    const { index, field } = event.currentTarget.dataset;
    const records = this.data.records.slice();
    records[index][field] = event.detail.value;
    this.setData({ records });
  },

  updateType(event) {
    const index = event.currentTarget.dataset.index;
    const records = this.data.records.slice();
    records[index].harassmentType = HARASSMENT_TYPES[event.detail.value];
    this.setData({ records });
  },

  chooseType(event) {
    const { index, type } = event.currentTarget.dataset;
    const records = this.data.records.slice();
    if (typeof records[index] === "undefined" || !type) return;
    records[index].harassmentType = type;
    this.setData({ records });
  },

  toggleRecording(event) {
    const index = event.currentTarget.dataset.index;
    const records = this.data.records.slice();
    records[index].hasRecording = event.detail.value;
    this.setData({ records });
  },

  toggleSelected(event) {
    const index = event.currentTarget.dataset.index;
    const records = this.data.records.slice();
    records[index].selected = event.detail.value;
    this.setData({ records });
  },

  addBlank() {
    this.setData({
      records: this.data.records.concat(createBlankRecord())
    });
  },

  continueToDetails() {
    const selected = this.data.records.filter((item) => item.selected !== false);
    if (!selected.length) {
      wx.showToast({
        title: "请至少选择一个号码",
        icon: "none"
      });
      return;
    }

    this.setData({
      selectionStep: false,
      records: selected.map((item, index) => ({
        ...item,
        selected: true,
        localId: item.localId || `selected_${index}`
      }))
    });
  },

  manualFromSelection() {
    this.setData({
      selectionStep: false,
      records: [createBlankRecord()]
    });
  },

  saveAll() {
    const valid = this.data.records.filter((item) => item.selected !== false && (item.phone || item.summary));
    if (!valid.length) {
      wx.showToast({
        title: "请至少填写号码或内容",
        icon: "none"
      });
      return;
    }

    valid.forEach((record) => saveRecord(record));
    wx.removeStorageSync("pending_ocr_records");
    wx.removeStorageSync("editing_record");
    wx.showToast({
      title: "已保存",
      icon: "success"
    });
    setTimeout(() => {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: "/pages/index/index" })
      });
    }, 600);
  }
});
