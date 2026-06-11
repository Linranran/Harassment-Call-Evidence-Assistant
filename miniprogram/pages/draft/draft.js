const { CARRIERS } = require("../../utils/constants");
const { buildComplaintDrafts } = require("../../utils/templates");
const { getRecords, saveProgress } = require("../../utils/storage");

const COMPLAINT_CHANNELS = [
  {
    name: "12321",
    title: "12321 网络不良与垃圾信息举报",
    contact: "https://www.12321.cn",
    tip: "适合投诉骚扰电话、垃圾短信、违规营销外呼。也可拨打 12321 咨询。"
  },
  {
    name: "运营商客服",
    title: "运营商骚扰拦截与号码核查",
    contact: "移动 10086 / 联通 10010 / 电信 10000 / 广电 10099",
    tip: "要求开通骚扰拦截、标记拒绝营销外呼，并核查相关号码线路。"
  },
  {
    name: "12345",
    title: "地方政务服务便民热线",
    contact: "12345",
    tip: "适合升级反馈个人信息疑似泄露、地方企业违规营销等问题。"
  },
  {
    name: "12381",
    title: "工信部公共服务热线",
    contact: "12381",
    tip: "适合升级投诉通信服务、码号管理、运营商骚扰治理相关问题。"
  }
];

function getChannelContact(channel) {
  const item = COMPLAINT_CHANNELS.find((entry) => entry.name === channel);
  return item || {
    name: channel,
    title: channel,
    contact: "",
    tip: ""
  };
}

Page({
  data: {
    complaintChannels: COMPLAINT_CHANNELS,
    carriers: CARRIERS,
    carrier: "不确定",
    drafts: [],
    records: [],
    score: {
      score: 0,
      level: "需补充"
    },
    userPhone: ""
  },

  onShow() {
    const userPhone = wx.getStorageSync("user_phone") || "";
    const carrier = wx.getStorageSync("carrier") || "不确定";
    this.setData({ userPhone, carrier });
    this.refreshDrafts();
    setTimeout(() => this.refreshDrafts(), 100);
  },

  onTabItemTap() {
    this.refreshDrafts();
  },

  updateUserPhone(event) {
    this.setData({ userPhone: event.detail.value });
    wx.setStorageSync("user_phone", event.detail.value);
  },

  updateCarrier(event) {
    const carrier = CARRIERS[event.detail.value];
    this.setData({ carrier }, this.refreshDrafts);
    wx.setStorageSync("carrier", carrier);
  },

  refreshDrafts() {
    const records = getRecords();
    const result = buildComplaintDrafts(records, {
      userPhone: this.data.userPhone,
      carrier: this.data.carrier
    });
    this.setData({
      drafts: result.drafts.map((draft) => ({
        ...draft,
        contact: getChannelContact(draft.channel)
      })),
      records,
      score: result.score
    });
  },

  copyDraft(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.content,
      success: () => {
        wx.showToast({
          title: "已复制",
          icon: "success"
        });
      }
    });
  },

  copyContact(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.contact,
      success: () => {
        wx.showToast({
          title: "入口已复制",
          icon: "success"
        });
      }
    });
  },

  createProgress(event) {
    const channel = event.currentTarget.dataset.channel;
    saveProgress({
      channel,
      status: "待提交",
      recordIds: this.data.records.map((item) => item.id)
    });
    wx.showToast({
      title: "已记录",
      icon: "success"
    });
  }
});
