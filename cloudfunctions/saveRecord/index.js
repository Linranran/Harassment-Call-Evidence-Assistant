exports.main = async (event, context) => {
  const wxContext = context && context.OPENID ? context : {};
  return {
    ok: true,
    openid: wxContext.OPENID || "",
    received: event || {}
  };
};
