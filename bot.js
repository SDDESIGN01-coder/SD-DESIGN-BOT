const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server started");
});

require("dotenv").config();

console.log("TOKEN LENGTH =", process.env.TOKEN?.length);
console.log("PROJECT =", process.env.FIREBASE_PROJECT_ID);
const db = require("./firebase");

const {
    ChannelType,
    PermissionFlagsBits
} = require("discord.js");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  Events,
  PermissionsBitField,
  ModalBuilder,
  AttachmentBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
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

// ===================== TICKET CONFIG =====================
const TICKET_CATEGORY_ID = "ใส่IDหมวดหมู่Ticket";
const STAFF_ROLE_ID = "ใส่IDยศStaff";
const LOG_CHANNEL_ID = "ใส่IDห้องLog";

// ===================== IMAGE =====================
const ORDER_IMAGE =
"https://ใส่ลิงก์รูปขั้นตอนการสั่งงาน";

const QR_ADMIN1 =
"https://ใส่ลิงก์QRแอดมิน1";

const QR_ADMIN2 =
"https://ใส่ลิงก์QRแอดมิน2";

// ===================== PAYMENT =====================

const ADMIN1_NAME = "ชื่อแอดมินคนที่ 1";
const ADMIN1_BANK = "เลขบัญชีคนที่ 1";

const ADMIN2_NAME = "ชื่อแอดมินคนที่ 2";
const ADMIN2_BANK = "เลขบัญชีคนที่ 2";

// ======================================================
// TICKET SYSTEM CONFIG
// ======================================================

// หมวดหมู่ Ticket
const TICKET_CATEGORY_ID = "ใส่หมวดหมู่ Ticket";

// ห้อง Log
const TICKET_LOG_CHANNEL = "ใส่ห้อง Log";

// Role Staff ที่มองเห็น Ticket
const STAFF_ROLE_ID = "ใส่ Role Staff";

// ข้อความแจ้งเตือนตอนเปิด Ticket
const STAFF_MENTION = `<@&${STAFF_ROLE_ID}>`;

// รูปขั้นตอนการสั่งงาน
const ORDER_IMAGE =
"https://ใส่ลิงก์รูปขั้นตอน";

// รูป QR Admin 1
const ADMIN1_QR =
"https://ใส่ลิงก์รูป";

// รูป QR Admin 2
const ADMIN2_QR =
"https://ใส่ลิงก์รูป";

// ชื่อบัญชี Admin 1
const ADMIN1_NAME =
"ชื่อบัญชี";

// เลขบัญชี Admin1
const ADMIN1_NUMBER =
"000-0-00000-0";

// ชื่อบัญชี Admin2
const ADMIN2_NAME =
"ชื่อบัญชี";

// เลขบัญชี Admin2
const ADMIN2_NUMBER =
"000-0-00000-0";

// ===================== STATE =====================
let shopOpen = false;
let shopChannelId = null;
let shopInterval = null;

const queues = new Map();

// ======================================================
// TICKET CACHE
// ======================================================

const ticketCache = new Map();

// ======================================================
// TICKET NUMBER
// ======================================================

let ticketNumber = 1;
// ===================== READY =====================
client.once("ready", () => {
  console.log("✅ BOT ONLINE");
  console.log(client.user.tag);
});

// ===================== OPEN SHOP =====================
async function sendOpenShop(channel) {

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`ประกาศขณะนี้ ร้านกำลังเปิดรับคิวอยู่น๊าา <:shield:1502734762538958949>
               สั่งงานกดเปิด Ticket มาได้เลย`)
    .setDescription(`

**วิธีการสั่งงาน**
ลูกค้าสามารถกดเปิด Ticket
และสั่งงานภายใน Ticket ของตัวเองได้เลยน๊า <:check:1445834442596683860>
\`\`\`
เวลาเปิดร้าน & รับคิว
• 08:00 - 22:00
เวลาทำงานของทางร้าน
• 20:00 - 00:00
\`\`\`
(หากลูกค้า เปิด Ticket สั่งงาน ทางร้านจะตอบกลับ หรือหาก
เปิดTicketสั่งนอกเวลาดังกล่าว ทางร้านจะมาตอบในเวลา ที่แจ้งไว้ )
`)
    .setImage("https://cdn.discordapp.com/attachments/1446892511514722374/1503056453504860412/Open_for_queue.png")
    .setTimestamp();

  await channel.send({
    content: `<@&${ROLE_ID}>`,
    embeds: [embed],
    allowedMentions: {
      roles: [ROLE_ID]
    }
  });
}

// ===================== CLOSE SHOP =====================
async function sendCloseShop(channel) {

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle(`ประกาศขณะนี้ ร้านกำลังปิดรับคิวอยู่น๊าา <:cross:1503070258217484410>
               มาใหม่วันพรุ่งนี้เวลาร้านเปิด`)
    .setDescription(`

**วิธีการสั่งงาน**
ลูกค้าสามารถกดเปิด Ticket ได้ <:Red_Verified:1492952897988722688>
\`\`\`
เวลาเปิดร้าน & รับคิว
• 08:00 - 22:00
เวลาทำงานของทางร้าน
• 20:00 - 00:00
\`\`\`
(หากลูกค้า เปิด Ticket สั่งงาน ทางร้านจะตอบกลับ หรือหาก
เปิดTicketสั่งนอกเวลาดังกล่าว ทางร้านจะมาตอบในเวลา ที่แจ้งไว้ )
`)
    .setImage("https://cdn.discordapp.com/attachments/1446892511514722374/1503069494959018005/Queue_Closed.png")
    .setTimestamp();

  await channel.send({
    content: `<@&${ROLE_ID}>`,
    embeds: [embed],
    allowedMentions: {
      roles: [ROLE_ID]
    }
  });
}

// ===================== MESSAGE COMMANDS =====================
  client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  const isAdmin = message.member?.permissions?.has(
    PermissionsBitField.Flags.Administrator
  );


      if (cmd === "!addpoint") {
    if (!isAdmin) return;

    const userId = args[1];
    const amount = parseInt(args[2]);

    if (!userId || !amount)
    return message.reply("!addpoint <IDลูกค้า> <จำนวนแต้ม>");

    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return message.reply("ไม่พบผู้ใช้");

    const ref = db.collection("users").doc(userId);

    const doc = await ref.get();

    let currentPoint = 0;

    if (doc.exists) {
    currentPoint = doc.data().points || 0;
    }

    currentPoint += amount;

    await ref.set({
    username: user.username,
    points: currentPoint
    }, { merge: true });

    await user.send({
    embeds: [
    new EmbedBuilder()
    .setColor("Green")
    .setTitle("⭐ ได้รับแต้มสะสม")
    .setDescription(
    `ได้รับ +${amount} แต้ม

    แต้มปัจจุบัน : ${currentPoint} แต้ม

    ขอบคุณที่ใช้บริการ SD DESIGN STUDIO 💜`)
    ]
    });

    return message.reply(`เพิ่ม ${amount} แต้มให้ ${user.username} แล้ว`);
    }

    if (cmd === "!mypoint") {

    const ref = db.collection("users").doc(message.author.id);

    const doc = await ref.get();

    const point = doc.exists ? doc.data().points || 0 : 0;

    const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("💎 แต้มสะสมของคุณ")
    .setDescription(`
    ⭐ แต้มปัจจุบัน : ${point} แต้ม

    🎁 ของรางวัล

    10 แต้ม = ลด 10%
    20 แต้ม = ลด 20%
    30 แต้ม = ลด 30%
    `)
    .setTimestamp();

    return message.reply({
embeds:[embed]
});

    }

     if (cmd === "!redeem") {

  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle(" ร้านแลกของรางวัล 🎁")
    .setDescription(`
เลือกคูปองที่ต้องการแลก

100 แต้ม = ลด 10.-
200 แต้ม = ลด 20.-
300 แต้ม = ลด 30.-
`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("reward10")
      .setLabel("🎁 ลด 10.-")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("reward20")
      .setLabel("🎁 ลด 20.-")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("reward30")
      .setLabel("🎁 ลด 30.-")
      .setStyle(ButtonStyle.Danger)
  );

  return message.reply({
    embeds: [embed],
    components: [row]
  });
}


    if (cmd === "!point") {

    if (!isAdmin) return;

    const userId = args[1];

    if (!userId)
    return message.reply("!point <IDลูกค้า>");

    const ref = db.collection("users").doc(userId);

    const doc = await ref.get();

    if (!doc.exists)
    return message.reply("ไม่พบข้อมูล");

    const data = doc.data();

    const embed = new EmbedBuilder()
    .setColor("Yellow")
    .setTitle("📋 ข้อมูลลูกค้า")
    .addFields(
    {
    name:"ชื่อ",
    value:data.username
    },
    {
    name:"แต้ม",
    value:data.points.toString()
    }
    );

    return message.reply({
embeds:[embed]
});

    }
  
    if (cmd === "!allpoint") {

    if (!isAdmin) return;

    const snapshot = await db.collection("users").get();

    let text = "";

    snapshot.forEach(doc=>{

    const data = doc.data();

    text += `👤 ${data.username} - ⭐ ${data.points} แต้ม\n`;

    });

    const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle("💎 รายชื่อลูกค้าทั้งหมด")
    .setDescription(text || "ไม่มีข้อมูล");

    return message.reply({
embeds:[embed]
});

    }

    // ======================================================
// TICKET PANEL
// ======================================================

if (cmd === "!ticketpanel") {

    if (!isAdmin)
        return;

    const embed = new EmbedBuilder()

        .setColor("#7B2CBF")

        .setTitle("📩 SD DESIGN STUDIO")

        .setDescription(`
━━━━━━━━━━━━━━━━━━

**ยินดีต้อนรับเข้าสู่ระบบ Ticket**

หากต้องการสั่งงาน

กรุณากดปุ่มด้านล่าง

ทีมงานจะเข้ามาดูแลคุณทันที

━━━━━━━━━━━━━━━━━━
`)

        .setImage("https://cdn.discordapp......")

        .setFooter({
            text: "SD DESIGN STUDIO"
        });

    const row = new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

                .setCustomId("open_ticket")

                .setLabel("📩 เปิด Ticket")

                .setStyle(ButtonStyle.Primary)

        );

    await message.channel.send({

        embeds: [embed],

        components: [row]

    });

    return;

}

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

    return message.reply("เปิดร้าน + auto 3 ชั่วโมงแล้ว");
  }

  // ===================== !ปิดร้าน =====================
  if (cmd === "!ปิดร้าน") {
    if (!isAdmin) return;

    const channel = await client.channels.fetch(args[1]).catch(() => null);
    if (!channel) return;

    shopOpen = false;
    if (shopInterval) clearInterval(shopInterval);

    await sendCloseShop(channel);

    return message.reply("ปิดร้านแล้ว");
  }

// ===================== !dmall =====================
if (cmd === "!dmall") {
  if (!isAdmin) return;

  const text = args.slice(1).join(" ");
  if (!text) return message.reply("ใส่ข้อความก่อน");

  const guild = message.guild;
  await guild.members.fetch();

  const imageUrls = text.match(/https?:\/\/\S+/g) || [];

  const cleanText = text
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("📢 ประกาศจากร้าน SD DESIGN STUDIO")
    .setDescription(cleanText)
    .setFooter({
      text: "SD DESIGN STUDIO"
    })
    .setTimestamp();

  guild.members.cache.forEach(async (member) => {
    if (member.user.bot) return;

    try {
      // ส่งข้อความก่อน
      await member.send({
        embeds: [embed]
      });

      // ส่งรูป/ไฟล์แยกอีกข้อความ
      if (imageUrls.length > 0 || message.attachments.size > 0) {
        await member.send({
          files: [
            ...imageUrls,
            ...[...message.attachments.values()].map(file => file.url)
          ]
        });
      }

    } catch {}
  });

  return message.reply("ส่ง DM ทุกคนเรียบร้อยแล้ว");
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

  const imageUrls = text.match(/https?:\/\/\S+/g) || [];

  const cleanText = text
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle("📢 ประกาศจากร้าน SD DESIGN STUDIO")
    .setDescription(cleanText)
    .setFooter({
      text: "SD DESIGN STUDIO"
    })
    .setTimestamp();

  try {

    // ส่งข้อความก่อน
    await user.send({
      embeds: [embed]
    });

    // ส่งรูป/ไฟล์แยกอีกข้อความ
    if (imageUrls.length > 0 || message.attachments.size > 0) {
      await user.send({
        files: [
          ...imageUrls,
          ...[...message.attachments.values()].map(file => file.url)
        ]
      });
    }

    return message.reply("ส่ง DM เรียบร้อยแล้ว");

  } catch {
    return message.reply("ไม่สามารถส่ง DM ให้ผู้ใช้นี้ได้");
  }
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

    return message.reply("ลงคิวแล้ว <:Red_Verified:1492952897988722688>");
  }
});

  // ===================== REDEEM BUTTON DISABLE =====================
function disableRedeemButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("reward10")
      .setLabel("🎁 ลด 10%")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId("reward20")
      .setLabel("🎁 ลด 20%")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId("reward30")
      .setLabel("🎁 ลด 30%")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );
}

  // ======================================================
// PAYMENT MENU
// ======================================================

if (interaction.customId === "payment") {

    const embed = new EmbedBuilder()

        .setColor("#2ECC71")

        .setTitle("💰 เลือกผู้รับเงิน")

        .setDescription(`
กรุณาเลือกแอดมินที่ต้องการโอนเงิน

เมื่อเลือกแล้ว
บอทจะแสดง QR พร้อมเพย์ทันที
`);

    const row = new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

                .setCustomId("pay_admin1")

                .setLabel("👤 Admin 1")

                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()

                .setCustomId("pay_admin2")

                .setLabel("👤 Admin 2")

                .setStyle(ButtonStyle.Secondary)

        );

    return interaction.reply({

        embeds:[embed],

        components:[row],

        ephemeral:true

    });

    
// ======================================================
// CLOSE TICKET
// ======================================================

if (interaction.customId === "close_ticket") {

    const embed = new EmbedBuilder()

        .setColor("Red")

        .setTitle("🔒 ปิด Ticket")

        .setDescription(`
คุณต้องการปิด Ticket นี้หรือไม่

หากปิดแล้ว
ห้องนี้จะถูกลบออก
`);

    const row = new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

                .setCustomId("confirm_close")

                .setLabel("✅ ยืนยัน")

                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()

                .setCustomId("cancel_close")

                .setLabel("❌ ยกเลิก")

                .setStyle(ButtonStyle.Secondary)

        );

    return interaction.reply({

        embeds:[embed],

        components:[row],

        ephemeral:true

    });

}

// ======================================================
// CANCEL CLOSE
// ======================================================

if (interaction.customId === "cancel_close") {

    return interaction.update({

        content:"ยกเลิกการปิด Ticket แล้ว",

        embeds:[],

        components:[]

    });

}

// ======================================================
// CONFIRM CLOSE
// ======================================================

if (interaction.customId === "confirm_close") {

    const log = await client.channels.fetch(LOG_CHANNEL_ID).catch(()=>null);

    if(log){

        const embed = new EmbedBuilder()

            .setColor("Red")

            .setTitle("📁 Ticket Closed")

            .addFields(

                {

                    name:"ลูกค้า",

                    value:`${interaction.user.tag}`

                },

                {

                    name:"ห้อง",

                    value:`${interaction.channel.name}`

                }

            )

            .setTimestamp();

        log.send({

            embeds:[embed]

        });

    }

    await interaction.update({

        embeds:[

            new EmbedBuilder()

            .setColor("Green")

            .setTitle("✅ ปิด Ticket สำเร็จ")

            .setDescription("ห้องจะถูกลบภายใน 5 วินาที")

        ],

        components:[]

    });

    setTimeout(()=>{

        interaction.channel.delete().catch(()=>{});

    },5000);

}

// ======================================================
// ADMIN 1
// ======================================================

if (interaction.customId === "pay_admin1") {

    const embed = new EmbedBuilder()

        .setColor("Green")

        .setTitle("💰 ช่องทางชำระเงิน")

        .setDescription(`
**ผู้รับเงิน**

${ADMIN1_NAME}

เลขบัญชี

${ADMIN1_BANK}
`)

        .setImage(QR_ADMIN1);

    return interaction.update({

        embeds:[embed],

        components:[]

    });

}

// ======================================================
// ADMIN 2
// ======================================================

if (interaction.customId === "pay_admin2") {

    const embed = new EmbedBuilder()

        .setColor("Green")

        .setTitle("💰 ช่องทางชำระเงิน")

        .setDescription(`
**ผู้รับเงิน**

${ADMIN2_NAME}

เลขบัญชี

${ADMIN2_BANK}
`)

        .setImage(QR_ADMIN2);

    return interaction.update({

        embeds:[embed],

        components:[]

    });

}

}

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return; 
    

    // ======================================================
// OPEN TICKET
// ======================================================

if (interaction.customId === "open_ticket") {

    const welcomeEmbed = new EmbedBuilder()

    .setColor("#7B2CBF")

    .setTitle("🎨 ยินดีต้อนรับ")

    .setDescription(`
    ยินดีต้อนรับเข้าสู่ระบบ Ticket

    กรุณาอ่านขั้นตอนการสั่งงานด้านล่าง

    หากพร้อมแล้วสามารถกดปุ่ม
    💰 ชำระเงิน

    หรือเมื่อเสร็จแล้วกด

    🔒 ปิด Ticket
    `)

    .setImage(ORDER_IMAGE)

    .setFooter({
    text:"SD DESIGN STUDIO"
    });

    const row = new ActionRowBuilder()

    .addComponents(

    new ButtonBuilder()

    .setCustomId("payment")

    .setLabel("💰 ชำระเงิน")

    .setStyle(ButtonStyle.Success),

    new ButtonBuilder()

    .setCustomId("close_ticket")

    .setLabel("🔒 ปิด Ticket")

    .setStyle(ButtonStyle.Danger)

    );

    await channel.send({

    embeds:[welcomeEmbed],

    components:[row]

    });

    await interaction.reply({

    content:`สร้าง Ticket สำเร็จ\n${channel}`,

    ephemeral:true

    });

    await interaction.reply({

        content: `สร้าง Ticket แล้ว\n${channel}`,

        ephemeral: true

    });

}
    if (
  interaction.customId === "reward10" ||
  interaction.customId === "reward20" ||
  interaction.customId === "reward30"
) {

  await interaction.deferReply({ ephemeral: true }); // ✅ FIX interaction failed

  const ref = db.collection("users").doc(interaction.user.id);
  const doc = await ref.get();

  if (!doc.exists) {
    return interaction.editReply({
      content: "ไม่มีข้อมูลแต้ม"
    });
  }

  let point = doc.data().points || 0;

  let needPoint = 0;
  let reward = "";

  if (interaction.customId === "reward10") {
    needPoint = 100;
    reward = "🎁 ส่วนลด 10.-";
  }

  if (interaction.customId === "reward20") {
    needPoint = 200;
    reward = "🎁 ส่วนลด 20.-";
  }

  if (interaction.customId === "reward30") {
    needPoint = 300;
    reward = "🎁 ส่วนลด 30.-";
  }

  if (point < needPoint) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("❌ แต้มไม่พอ")
          .setDescription(`ต้องใช้ ${needPoint} แต้ม\nแต้มปัจจุบัน : ${point}`)
      ]
    });
  }

  point -= needPoint;

  await ref.update({ points: point });


  // ✅ ปิดปุ่ม (กันพัง)
  try {
    await interaction.message.edit({
      components: [disableRedeemButtons()]
    });
  } catch (err) {
    console.log("edit button error:", err);
  }

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("🎉 แลกของรางวัลสำเร็จ")
    .setDescription(`
${reward}

ใช้แต้ม : ${needPoint}
แต้มคงเหลือ : ${point}
`);

  await interaction.editReply({
    embeds: [embed]
  });

  const logChannel = await client.channels.fetch("1519017976265703636").catch(() => null);

  if (logChannel) {
    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("🎁 มีการแลกของรางวัล")
          .setDescription(`
ลูกค้า : ${interaction.user.tag}

รางวัล : ${reward}
ใช้ ${needPoint} แต้ม
เหลือ ${point} แต้ม
`)
      ]
    });
  }

  return;
}

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

  return interaction.reply({
  content: "ส่งงาน + อัปเดต + DM แล้ว",
  ephemeral: true
    });
});

// ===================== LOGIN =====================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

console.log("TOKEN =", TOKEN ? "FOUND" : "NOT FOUND");

// DEBUG EVENTS
client.on("ready", () => {
  console.log("BOT READY");
});

client.on("error", console.error);

client.on("shardError", err => {
  console.error("Shard Error:", err);
});

client.on("warn", console.warn);

client.on("debug", msg => {
  console.log("DEBUG:", msg);
});

(async () => {
  try {

    console.log("กำลัง Login Discord...");
    console.log("Node Version =", process.version);
    console.log("Discord.js Loaded");
    console.log("START LOGIN");
    console.log("TOKEN CHECK =", TOKEN ? "YES" : "NO");
    console.log("TOKEN SIZE =", TOKEN?.length);

    setTimeout(() => {
  console.log("LOGIN STILL WAITING AFTER 30 SECONDS");
}, 30000);


client.on("ready", () => {
  console.log("READY EVENT FIRED");
});

client.on("shardReady", id => {
  console.log("SHARD READY", id);
});

client.on("shardDisconnect", event => {
  console.log("SHARD DISCONNECT", event.code);
});

client.on("shardReconnecting", () => {
  console.log("SHARD RECONNECTING");
});

client.on("shardResume", () => {
  console.log("SHARD RESUME");
});

const https = require("https");

https.get("https://discord.com/api/v10/users/@me", {
  headers: {
    Authorization: `Bot ${TOKEN}`
  }
}, (res) => {
  console.log("BOT API STATUS =", res.statusCode);

  let data = "";

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("BOT API RESPONSE =", data);
  });
});

await client.login(TOKEN);

    await client.login(TOKEN);
    console.log("LOGIN SUCCESS");

    console.log("Discord Login Success");

  } catch (err) {

    console.error("Discord Login Error:", err);

  }
})();
