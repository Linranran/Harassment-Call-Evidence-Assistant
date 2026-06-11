const { mockRecognizeImage, parseOcrText } = require("../../utils/ocr");
const { getRecords, removeRecord } = require("../../utils/storage");

Page({
  data: {
    records: []
  },

  onShow() {
    this.setData({
      records: getRecords()
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !file.tempFilePath) {
          this.goReview(mockRecognizeImage(), "");
          return;
        }
        this.recognizeImage(file.tempFilePath);
      },
      fail: () => {
        wx.showToast({
          title: "已取消上传",
          icon: "none"
        });
      }
    });
  },

  recognizeImage(tempFilePath) {
    const app = getApp();
    const envId = app.globalData && app.globalData.envId;

    if (!wx.cloud || !envId) {
      wx.showToast({
        title: "未配置云环境，使用模拟识别",
        icon: "none"
      });
      this.goReview(mockRecognizeImage(), tempFilePath);
      return;
    }

    wx.showLoading({
      title: "识别中"
    });

    wx.cloud.uploadFile({
      cloudPath: `ocr/${Date.now()}_${Math.random().toString(16).slice(2)}.jpg`,
      filePath: tempFilePath,
      success: (uploadResult) => {
        wx.cloud.callFunction({
          name: "ocrRecognize",
          data: {
            fileID: uploadResult.fileID
          },
          success: (callResult) => {
            const result = callResult.result || {};
            if (result.records && result.records.length) {
              this.goReview(result.records, tempFilePath);
            } else {
              const fallbackRecords = parseOcrText(result.text || "");
              if (fallbackRecords.length) {
                this.goReview(fallbackRecords, tempFilePath);
                return;
              }
              const ocrText = result.text ? `\n\nOCR 已读到文字：${String(result.text).slice(0, 80)}` : "";
              wx.showModal({
                title: "未识别到号码",
                content: result.message || `请确认截图里露出了号码。建议裁剪到通话记录顶部最近一通电话，或先使用手动添加。${ocrText}`,
                showCancel: false
              });
            }
          },
          fail: () => {
            wx.showToast({
              title: "OCR 调用失败，使用模拟识别",
              icon: "none"
            });
            this.goReview(mockRecognizeImage(), tempFilePath);
          },
          complete: () => wx.hideLoading()
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: "上传失败，使用模拟识别",
          icon: "none"
        });
        this.goReview(mockRecognizeImage(), tempFilePath);
      }
    });
  },

  useMockOcr() {
    this.goReview(mockRecognizeImage(), "");
  },

  goReview(records, imagePath) {
    wx.setStorageSync("pending_ocr_records", records);
    wx.setStorageSync("pending_ocr_image", imagePath || "");
    wx.navigateTo({
      url: "/pages/review/review"
    });
  },

  goManual() {
    wx.setStorageSync("editing_record", null);
    wx.navigateTo({
      url: "/pages/review/review?manual=1"
    });
  },

  editRecord(event) {
    const id = event.currentTarget.dataset.id;
    const record = this.data.records.find((item) => item.id === id);
    wx.setStorageSync("editing_record", record);
    wx.navigateTo({
      url: "/pages/review/review?edit=1"
    });
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除记录",
      content: "确定删除这条骚扰记录吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            records: removeRecord(id)
          });
        }
      }
    });
  },

  goDraft() {
    wx.switchTab({
      url: "/pages/draft/draft"
    });
  }
});
