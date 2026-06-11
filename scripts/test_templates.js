const assert = require("assert");
const { buildComplaintDrafts } = require("../miniprogram/utils/templates");
const { scoreRecord, scoreRecords } = require("../miniprogram/utils/scoring");

const records = [
  {
    id: "rec_1",
    phone: "0755-2688****",
    callTime: "2026-06-10 10:24",
    callType: "未接来电",
    harassmentType: "深圳入户",
    summary: "深圳入户中介营销，未经同意反复拨打",
    hasRecording: false,
    companyName: ""
  }
];

const singleScore = scoreRecord(records[0]);
assert(singleScore.score > 0, "record score should be positive");

const aggregateScore = scoreRecords(records);
assert(aggregateScore.score > 0, "aggregate score should be positive");

const result = buildComplaintDrafts(records, {
  userPhone: "138****0000",
  carrier: "中国移动"
});

assert.strictEqual(result.drafts.length, 4, "should generate 4 complaint drafts");
assert(result.drafts[0].content.includes("12321") === false, "content should be plain complaint text");
assert(result.drafts[0].content.includes("0755-2688****"), "draft should include phone number");
assert(result.drafts[1].content.includes("中国移动"), "carrier draft should include carrier");

console.log("template tests passed");
