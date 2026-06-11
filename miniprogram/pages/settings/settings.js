const { CARRIERS } = require("../../utils/constants");
const { clearAll } = require("../../utils/storage");

Page({
  data: {
    carriers: CARRIERS,
    carrier: "不确定",
    userPhone: ""
  },

  onShow() {
    this.setData({
      carrier: wx.getStorageSync("carrier") || "不确定",
      userPhone: wx.getStorageSync("user_phone") || ""
    });
  },

  updateUserPhone(event) {
    this.setData({ userPhone: event.detail.value });
    wx.setStorageSync("user_phone", event.detail.value);
  },

  updateCarrier(event) {
    const carrier = CARRIERS[event.detail.value];
    this.setData({ carrier });
    wx.setStorageSync("carrier", carrier);
  },

  clearData() {
    wx.showModal({
      title: "清空本地数据",
      content: "确定清空所有骚扰记录、投诉进度和设置吗？",
      success: (res) => {
        if (res.confirm) {
          clearAll();
          this.setData({
            carrier: "不确定",
            userPhone: ""
          });
          wx.showToast({
            title: "已清空",
            icon: "success"
          });
        }
      }
    });
  }
});
