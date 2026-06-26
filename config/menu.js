function mainMenuMessage() {
  return {
    type: "text",
    text: "🏸 健好羽球 V5\n請選擇功能：",
    quickReply: {
      items: [
        { type: "action", action: { type: "message", label: "💰 收入", text: "收入\n零打收入:\n球券收入:\n會員收入:\n耗球:\n備註:" } },
        { type: "action", action: { type: "message", label: "💸 支出", text: "支出\n項目:\n金額:\n備註:" } },
        { type: "action", action: { type: "message", label: "🏸 耗球", text: "耗球:" } },
        { type: "action", action: { type: "message", label: "🏦 交款", text: "交款:" } },
        { type: "action", action: { type: "message", label: "📊 今天", text: "今天" } },
        { type: "action", action: { type: "message", label: "📅 本月", text: "本月" } },
        { type: "action", action: { type: "message", label: "👤 我的未交", text: "我的未交" } },
      ],
    },
  };
}

module.exports = { mainMenuMessage };