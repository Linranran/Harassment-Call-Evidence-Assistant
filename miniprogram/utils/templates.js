const { scoreRecords } = require("./scoring");

function formatRecordLine(record, index) {
  const noteText = record.note ? `，备注：${record.note}` : "";
  return `${index + 1}. ${record.callTime || "时间待补充"}，号码 ${record.phone || "号码待补充"}，${record.callType || "来电"}，内容：${record.summary || record.harassmentType || "骚扰营销"}${noteText}`;
}

function buildRecordText(records) {
  return records.map(formatRecordLine).join("\n");
}

function buildComplaintDrafts(records, options = {}) {
  const userPhone = options.userPhone || "";
  const userPhoneText = userPhone || "本人手机号";
  const carrier = options.carrier || "运营商";
  const recordText = buildRecordText(records);
  const typeText = records[0] && records[0].harassmentType ? records[0].harassmentType : "商业营销";
  const score = scoreRecords(records);

  const drafts = [
    {
      channel: "12321",
      title: "12321 骚扰电话投诉",
      content:
        `${userPhone ? `本人手机号 ${userPhone}` : "本人手机号"} 长期遭受未经同意的${typeText}骚扰电话，严重影响正常生活和工作。\n\n` +
        `近期记录如下：\n${recordText || "暂无记录"}\n\n` +
        "本人从未同意相关机构使用本人手机号进行营销外呼，疑似存在个人信息泄露、非法共享或违规外呼问题。请求核查上述号码所属外呼平台、企业主体及线路来源，并依法处理相关骚扰电话和违规营销行为。"
    },
    {
      channel: "运营商",
      title: "运营商客服话术",
      content:
        `本人是${carrier}用户，手机号 ${userPhoneText}。近期持续收到${typeText}骚扰电话，号码和时间如下：\n${recordText || "暂无记录"}\n\n` +
        "请为本人免费开通最高级骚扰电话防护，重点拦截 0755 固话、95/400 营销外呼和高频陌生号码；请协助标记本人号码拒绝相关营销外呼，并核查上述号码是否属于违规外呼线路。"
    },
    {
      channel: "12345",
      title: "12345 升级投诉",
      content:
        `${userPhone ? `本人手机号 ${userPhone}` : "本人手机号"} 长期遭受${typeText}电话骚扰，疑似个人信息被泄露或违规共享。近期骚扰记录如下：\n${recordText || "暂无记录"}\n\n` +
        "本人诉求：核查相关外呼主体和个人信息来源，责令停止骚扰，依法查处非法获取、使用或买卖个人信息及违规外呼行为。"
    },
    {
      channel: "12381",
      title: "12381 工信部升级投诉",
      content:
        `${userPhone ? `本人手机号 ${userPhone}` : "本人手机号"} 持续遭受${typeText}骚扰电话，已影响正常生活。近期记录如下：\n${recordText || "暂无记录"}\n\n` +
        "请求核查相关号码所属运营商、外呼平台和企业备案信息，督促运营商履行骚扰电话治理、码号管理和用户权益保护义务，并对违规外呼线路依法处理。"
    }
  ];

  return {
    drafts,
    score
  };
}

module.exports = {
  buildComplaintDrafts,
  buildRecordText
};
