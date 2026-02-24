const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

const OWNER_UID = "100094141593150";

module.exports = {
  config: {
    name: "whitelist",
    aliases: ["wl"],
    version: "5.1",
    author: "NeoKEX + Fully Flexible",
    countDown: 5,
    role: 2,
    category: "owner"
  },

  onStart: async function ({ message, args, event, usersData, threadsData, role }) {

    // ===== INIT =====
    if (!config.whiteListMode) config.whiteListMode = { enable: false, whiteListIds: [] };
    if (!config.whiteListModeThread) config.whiteListModeThread = { enable: false, whiteListThreadIds: [] };
    if (!config.whiteListMode.whiteListIds.includes(OWNER_UID)) config.whiteListMode.whiteListIds.push(OWNER_UID);

    const saveConfig = () => {
      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
    };

    let sub = args[0]?.toLowerCase();
    let action = args[1]?.toLowerCase();

    if (!sub) return message.reply("⚠️ | Use: mode / user / thread / status");

    // ===== FLEXIBLE SHORTCUT =====
    // allow: wl add ... → wl user add
    // allow: wl remove ... → wl user remove
    if (sub === "add" || sub === "remove") {
      action = sub;
      sub = "user";
    }

    // =================================================
    // GLOBAL ADMIN MODE
    // =================================================
    if (sub === "mode") {
      if (action === "on") { config.whiteListMode.enable = true; config.whiteListModeThread.enable = true; saveConfig(); return message.reply("🔒 Admin Mode: ON ✅\nOnly admins & approved users can use the bot."); }
      if (action === "off") { config.whiteListMode.enable = false; config.whiteListModeThread.enable = false; saveConfig(); return message.reply("🔓 Admin Mode: OFF ❌\nEveryone can use the bot now."); }
      return message.reply("⚠️ | Use: wl mode on / wl mode off");
    }

    // =================================================
    // USER WHITELIST
    // =================================================
    if (sub === "user") {
      if (action === "on") { config.whiteListMode.enable = true; saveConfig(); return message.reply("✅ | User whitelist: ON"); }
      if (action === "off") { config.whiteListMode.enable = false; saveConfig(); return message.reply("❌ | User whitelist: OFF"); }
      if (action === "list") {
        const list = config.whiteListMode.whiteListIds;
        if (!list.length) return message.reply("📋 | No users whitelisted.");
        let msg = "📋 | Whitelisted Users:\n";
        for (const uid of list) { const name = await usersData.getName(uid); msg += `• ${name} (${uid})\n`; }
        return message.reply(msg);
      }

      if (action === "add") {
        if (role < 3) return message.reply("❌ | No permission");
        let uids = [];
        if (Object.keys(event.mentions).length) uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else uids = args.slice(2).filter(a => !isNaN(a));
        if (!uids.length) return message.reply("⚠️ | Mention, reply, or provide UID");

        const added = [];
        for (const uid of uids) { if (!config.whiteListMode.whiteListIds.includes(uid)) { config.whiteListMode.whiteListIds.push(uid); added.push(uid); } }
        saveConfig();
        return message.reply(`✅ | User(s) added: ${added.join(", ")}`);
      }

      if (action === "remove") {
        let uids = [];
        if (Object.keys(event.mentions).length) uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else uids = args.slice(2).filter(a => !isNaN(a));
        if (!uids.length) return message.reply("⚠️ | Mention, reply, or provide UID");

        for (const uid of uids) { config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.filter(id => id != uid); }
        if (!config.whiteListMode.whiteListIds.includes(OWNER_UID)) config.whiteListMode.whiteListIds.push(OWNER_UID);
        saveConfig();
        return message.reply(`✅ | User(s) removed: ${uids.join(", ")}`);
      }
    }

    // =================================================
    // THREAD WHITELIST
    // =================================================
    if (sub === "thread") {
      const threadID = args[2] || event.threadID;
      if (action === "on") { config.whiteListModeThread.enable = true; saveConfig(); return message.reply("✅ | Thread whitelist: ON"); }
      if (action === "off") { config.whiteListModeThread.enable = false; saveConfig(); return message.reply("❌ | Thread whitelist: OFF"); }
      if (action === "list") {
        const list = config.whiteListModeThread.whiteListThreadIds;
        if (!list.length) return message.reply("📋 | No threads whitelisted.");
        let msg = "📋 | Whitelisted Threads:\n";
        for (const tid of list) { const info = await threadsData.getInfo(tid); msg += `• ${info.threadName} (${tid})\n`; }
        return message.reply(msg);
      }
      if (action === "add") { if (!config.whiteListModeThread.whiteListThreadIds.includes(threadID)) config.whiteListModeThread.whiteListThreadIds.push(threadID); saveConfig(); return message.reply("✅ | Thread added"); }
      if (action === "remove") { config.whiteListModeThread.whiteListThreadIds = config.whiteListModeThread.whiteListThreadIds.filter(id => id != threadID); saveConfig(); return message.reply("✅ | Thread removed"); }
    }

    // =================================================
    // STATUS
    // =================================================
    if (sub === "status") {
      return message.reply(
        `📊 WHITELIST STATUS\n\n👤 User Mode: ${config.whiteListMode.enable ? "ON" : "OFF"}\nUsers: ${config.whiteListMode.whiteListIds.length}\n\n💬 Thread Mode: ${config.whiteListModeThread.enable ? "ON" : "OFF"}\nThreads: ${config.whiteListModeThread.whiteListThreadIds.length}`
      );
    }

    return message.reply("⚠️ | Invalid subcommand. Use: mode, user, thread, status");
  }
};
