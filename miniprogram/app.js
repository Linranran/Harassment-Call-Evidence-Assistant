App({
  globalData: {
    envId: "cloud1-d0gl6htap2c02c9e3",
    appName: "防骚扰电话证据助手"
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.envId || undefined,
        traceUser: true
      });
    }
  }
});
