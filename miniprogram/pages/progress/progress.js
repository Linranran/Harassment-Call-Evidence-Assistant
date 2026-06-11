const { COMPLAINT_STATUS } = require("../../utils/constants");
const { getProgressList, removeProgress, saveProgress } = require("../../utils/storage");

Page({
  data: {
    list: [],
    statuses: COMPLAINT_STATUS
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      list: getProgressList()
    });
  },

  addProgress() {
    saveProgress({
      channel: "12321",
      status: "待提交"
    });
    this.refresh();
  },

  changeStatus(event) {
    const id = event.currentTarget.dataset.id;
    const status = COMPLAINT_STATUS[event.detail.value];
    this.updateItem(id, { status });
  },

  updateProgress(event) {
    const { id, field } = event.currentTarget.dataset;
    this.updateItem(id, { [field]: event.detail.value });
  },

  updateItem(id, patch) {
    const item = this.data.list.find((entry) => entry.id === id);
    if (!item) return;
    saveProgress({ ...item, ...patch });
    this.refresh();
  },

  deleteProgress(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除进度",
      content: "确定删除这条投诉进度吗？",
      success: (res) => {
        if (res.confirm) {
          removeProgress(id);
          this.refresh();
        }
      }
    });
  }
});
