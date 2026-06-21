require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ["CHANNEL"]
});

// ===================== CONFIG =====================
const TOKEN = process.env.TOKEN;
const ROLE_ID = "1445822762890563745";

// ===================== STATE =====================
let shopOpen = false;
let shopChannelId = null;
let shopInterval = null;

const queues = new Map();

// ===================== READY =====================
client.once("ready", () => {
  console.log(`${client.user.tag} ออนไลน์แล้ว`);
});

// ===================== OPEN SHOP =====================
async function sendOpenShop(channel) {
  await channel.send(`<@&${ROLE_ID}>`);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("📢 ประกาศขณะนี้ ร้านกำลังเปิดรับคิวอยู่น๊าา <:shield:1502734762538958949>")
    .setDescription(`
สั่งงานกดเปิด Ticket มาได้เลย

**วิธีการสั่งงาน**
ลูกค้าสามารถกดเปิด Ticket
และสั่งงานภายใน Ticket ของตัวเองได้เลยน๊า <:check:1445834442596683860>

\`\`\`
เวลาเปิดร้าน & รับคิว
• 08:00 - 22:00

เวลาทำงาน
• 20:00 - 00:00
\`\`\`
`)
    .setImage("https://cdn.discordapp.com/attachments/1446892511514722374/1503056453504860412/Open_for_queue.png")
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

// ===================== CLOSE SHOP =====================
async function sendCloseShop(channel) {
  await channel.send(`<@&${ROLE_ID}>`);

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("📢 ประกาศขณะนี้ ร้านกำลังปิดรับคิวอยู่น๊าา <:cross:1503070258217484410>")
    .setDescription(`
มาใหม่วันพรุ่งนี้เวลาร้านเปิด

**วิธีการสั่งงาน**
ลูกค้าสามารถกดเปิด Ticket ได้ <:Red_Verified:1492952897988722688>

\`\`\`
เวลาเปิดร้าน & รับคิว
• 08:00 - 22:00

เวลาทำงาน
• 20:00 - 00:00
\`\`\`
`)
    .setImage("https://cdn.discordapp.com/attachments/1446892511514722374/1503069494959018005/Queue_Closed.png")
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

// ===================== MESSAGE COMMANDS =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  const isAdmin = message.member?.permissions?.has(
    PermissionsBitField.Flags.Administrator
  );

  // ===================== !เปิดร้าน =====================
  if (cmd === "!เปิดร้าน") {
    if (!isAdmin) return;

    const channelId = args[1];
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return message.reply("ไม่พบห้อง");

    shopOpen = true;
    shopChannelId = channelId;

    await sendOpenShop(channel);

    if (shopInterval) clearInterval(shopInterval);

    shopInterval = setInterval(async () => {
      if (!shopOpen) return;

      const ch = await client.channels.fetch(shopChannelId).catch(() => null);
      if (ch) await sendOpenShop(ch);

    }, 3 * 60 * 60 * 1000);

    message.reply("เปิดร้าน + auto 3 ชั่วโมงแล้ว");
  }

  // ===================== !ปิดร้าน =====================
  if (cmd === "!ปิดร้าน") {
    if (!isAdmin) return;

    const channel = await client.channels.fetch(args[1]).catch(() => null);
    if (!channel) return;

    shopOpen = false;
    if (shopInterval) clearInterval(shopInterval);

    await sendCloseShop(channel);

    message.reply("ปิดร้านแล้ว");
  }

// ===================== !dmall =====================
if (cmd === "!dmall") {
  if (!isAdmin) return;

  const text = args.slice(1).join(" ");
  if (!text) return message.reply("ใส่ข้อความก่อน");

  const guild = message.guild;
  await guild.members.fetch();

  // ดึงลิงก์ทั้งหมด
  const imageUrls = text.match(/https?:\/\/\S+/g) || [];

  // ลบลิงก์ออกจากข้อความ
  const cleanText = text
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("📢 ประกาศจาก SD DESIGN STUDIO")
    .setDescription(cleanText)
    .setFooter({
      text: "SD DESIGN STUDIO"
    })
    .setTimestamp();

  guild.members.cache.forEach(member => {
    if (member.user.bot) return;

    member.send({
      embeds: [embed],
      files: [
        ...imageUrls,
        ...[...message.attachments.values()].map(file => file.url)
      ]
    }).catch(() => {});
  });

  message.reply("ส่ง DM ทุกคนเรียบร้อยแล้ว");
}

// ===================== !dmid =====================
if (cmd === "!dmid") {
  if (!isAdmin) return;

  const userId = args[1];
  const text = args.slice(2).join(" ");

  if (!userId || !text)
    return message.reply("!dmid <ไอดีลูกค้า> <ข้อความ>");

  const user = await client.users.fetch(userId).catch(() => null);

  if (!user) return message.reply("ไม่พบผู้ใช้");

  // ดึงลิงก์รูปทั้งหมด
  const imageUrls = text.match(/https?:\/\/\S+/g) || [];

  // เอาลิงก์รูปออกจากข้อความ
  const cleanText = text
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle("📢 ประกาศจาก SD DESIGN STUDIO")
    .setDescription(cleanText)
    .setFooter({
      text: "SD DESIGN STUDIO"
    })
    .setTimestamp();

  await user.send({
    embeds: [embed],
    files: [
      ...imageUrls,
      ...[...message.attachments.values()].map(file => file.url)
    ]
  }).catch(() => {
    message.reply("ไม่สามารถส่ง DM ให้ผู้ใช้นี้ได้");
  });

  message.reply("ส่ง DM เรียบร้อยแล้ว");
}

  // ===================== !ลงคิว =====================
  if (cmd === "!ลงคิว") {
    if (!isAdmin) return;

    const customerChannelId = args[1];
    const adminChannelId = args[2];
    const text = args.slice(3).join(" ");

    const customerChannel = await client.channels.fetch(customerChannelId).catch(() => null);
    const adminChannel = await client.channels.fetch(adminChannelId).catch(() => null);

    if (!customerChannel || !adminChannel)
      return message.reply("ID ห้องไม่ถูกต้อง");

    const id = Date.now().toString();

    // ===== CUSTOMER =====
    const customerEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📦 รายการคิว")
      .addFields(
        { name: "รายละเอียด", value: text || "-" },
        { name: "สถานะ", value: "⏳ รอคิว" }
      );

    const customerMsg = await customerChannel.send({ embeds: [customerEmbed] });

    // ===== ADMIN =====
    const adminEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📦 แผงจัดการคิว (แอดมิน)")
      .addFields(
        { name: "รายละเอียด", value: text || "-" },
        { name: "สถานะ", value: "⏳ รอคิว" },
        { name: "Queue ID", value: id }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`work_${id}`)
        .setLabel("กำลังทำ")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`done_${id}`)
        .setLabel("ส่งงานเรียบร้อย")
        .setStyle(ButtonStyle.Success)
    );

    const adminMsg = await adminChannel.send({
      embeds: [adminEmbed],
      components: [row]
    });

    queues.set(id, {
      text,
      customerChannelId,
      adminChannelId,
      customerMsgId: customerMsg.id,
      adminMsgId: adminMsg.id,
      userId: message.author.id
    });

    message.reply("ลงคิวแล้ว");
  }
});

// ===================== BUTTON SYSTEM =====================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const [type, id] = interaction.customId.split("_");
  const queue = queues.get(id);

  if (!queue)
    return interaction.reply({ content: "ไม่พบคิว", ephemeral: true });

  const adminChannel = await client.channels.fetch(queue.adminChannelId);
  const customerChannel = await client.channels.fetch(queue.customerChannelId);

  const adminMsg = await adminChannel.messages.fetch(queue.adminMsgId);
  const customerMsg = await customerChannel.messages.fetch(queue.customerMsgId);

  // ================= WORK =================
  if (type === "work") {
    const adminEmbed = EmbedBuilder.from(adminMsg.embeds[0])
      .setColor("Orange")
      .setFields(
        { name: "รายละเอียด", value: queue.text },
        { name: "สถานะ", value: "⏳ กำลังทำ" },
        { name: "Queue ID", value: id }
      );

    const customerEmbed = EmbedBuilder.from(customerMsg.embeds[0])
      .setColor("Orange")
      .setFields(
        { name: "รายละเอียด", value: queue.text },
        { name: "สถานะ", value: "⏳ กำลังทำ" }
      );

    await adminMsg.edit({ embeds: [adminEmbed] });
    await customerMsg.edit({ embeds: [customerEmbed] });

    return interaction.reply({
      content: "อัปเดตสถานะแล้ว",
      ephemeral: true
    });
  }

  // ================= DONE -> MODAL =================
  if (type === "done") {

    const modal = new ModalBuilder()
      .setCustomId(`finish_${id}`)
      .setTitle("ส่งงานเรียบร้อย");

    const input = new TextInputBuilder()
      .setCustomId("userId")
      .setLabel("ใส่ ID ลูกค้า Discord")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }
});

// ===================== MODAL SYSTEM =====================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const id = interaction.customId.split("_")[1];
  const userId = interaction.fields.getTextInputValue("userId");

  const queue = queues.get(id);
  if (!queue) return;

  const adminChannel = await client.channels.fetch(queue.adminChannelId);
  const customerChannel = await client.channels.fetch(queue.customerChannelId);

  const adminMsg = await adminChannel.messages.fetch(queue.adminMsgId);
  const customerMsg = await customerChannel.messages.fetch(queue.customerMsgId);

  const adminEmbed = EmbedBuilder.from(adminMsg.embeds[0])
    .setColor("Green")
    .setFields(
      { name: "รายละเอียด", value: queue.text },
      { name: "สถานะ", value: "✅ ส่งแล้ว" },
      { name: "Queue ID", value: id }
    );

  const customerEmbed = EmbedBuilder.from(customerMsg.embeds[0])
    .setColor("Green")
    .setFields(
      { name: "รายละเอียด", value: queue.text },
      { name: "สถานะ", value: "✅ ส่งแล้ว" }
    );

  await adminMsg.edit({ embeds: [adminEmbed], components: [] });
  await customerMsg.edit({ embeds: [customerEmbed] });

  try {
    const user = await client.users.fetch(userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ งานเสร็จแล้ว")
          .setDescription(queue.text)
      ]
    });
  } catch {}

  interaction.reply({
    content: "ส่งงาน + อัปเดต + DM แล้ว",
    ephemeral: true
  });
});

// ===================== LOGIN =====================
client.login(TOKEN);

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is online");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});
