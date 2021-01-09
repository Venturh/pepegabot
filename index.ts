import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Client, Message } from "discord.js";

dotenv.config();
const app = express();
const port = 3000;
const Database = require("@replit/database");

app.get("/", (req: Request, res: Response) => res.send("Hello World!"));

app.get("/resetDb", async (req: Request, res: Response) => {
  const all = await db.list();
  all.forEach((d: string) => db.delete(d));
});

app.get("/delete", async (req, res) => {
  try {
    await db.delete(req.query.name);
  } catch (error) {
    return "Error";
  }
});

app.listen(port, () => console.log(`Server started at :${port}`));

const PREFIX = "!";
const bot = new Client();
const db = new Database();

bot.login(process.env.BOT_TOKEN);

bot.on("ready", () => {
  console.log("ready");
  bot.user.setPresence({
    activity: { name: `${bot.users.cache.size} Pepegas`, type: "WATCHING" },
    status: "online",
  });
});

bot.on("message", async (msg) => {
  if (msg.author.bot) return;
  let content = msg.content.substring(PREFIX.length).split(" ");
  switch (content[0]) {
    case "add":
      if (content[1] && content[2]) {
        try {
          await addImage(content[1], content[2]);
          msg.reply("Wurde geadded");
        } catch (error) {
          msg.reply("Die Id gibt es schon");
        }
      }
      break;
    case "e":
      try {
        const img = await searchImage(content[1]);
        msg
          .delete()
          .then((msg) =>
            console.log(`Deleted message from ${msg.author.username}`)
          )
          .catch(console.error);

        msg.channel.send(img);
      } catch (error) {
        msg.channel.send("Nicht gefunden Brudi");
      }
      break;

    case "list":
      msg.channel.send("Bidde? \n" + (await listImages()));
      break;

    case "emotes":
      const emotes = bot.emojis.cache
        .map(({ name, id }) =>
          msg.guild.emojis.cache.get(id) === undefined ? name : null
        )
        .filter((item) => item != null);
      msg.channel.send("Alle Emotes? \n" + emotes);
      break;
    default:
      break;
  }
  emote(msg);
});

const addImage = async (id: string, url: string) => {
  if ((await db.get(id)) !== null) throw new Error();
  return await db.set(id, url);
};

const searchImage = async (id: string) => {
  const image = await db.get(id);
  if (image) return image;
  else throw new Error();
};

const listImages = async () => {
  return await db.list();
};

function emote(msg: Message) {
  let same = false;
  const patt = /:\w+:/g;
  var result = msg.content.match(patt);
  if (!result) return;

  const test = result.map((result) => {
    const name = result.slice(1, -1);
    const emote = bot.emojis.cache.find((emoji) => {
      return emoji.name === name;
    });
    return { name, emote: emote };
  });
  console.log(msg.content);

  if (test.length === 1 && msg.content[0] === ":") {
    msg.channel.send(`${bot.emojis.cache.get(test[0].emote.id)}`);
    msg.delete();
  } else {
    let msgs = msg.content;
    const alreadyIn = [];
    test.forEach((t) => {
      if (
        msg.guild.emojis.cache.find((emoji) => emoji.name === t.name) !==
        undefined
      ) {
        same = true;
      } else if (t.emote !== undefined && !alreadyIn.includes(t.name)) {
        msgs = replaceAll(
          msgs,
          `:${t.name}:`,
          bot.emojis.cache.get(t.emote.id) as any
        );

        alreadyIn.push(t.name);
      }
    });
    if (!same) {
      msg.channel.send(`${msg.author.username.replace("@", "")}: ${msgs}`);
      msg.delete();
    }
  }
}

function replaceAll(str: string, find: string, replace: any) {
  return str.replace(new RegExp(find, "g"), replace);
}
