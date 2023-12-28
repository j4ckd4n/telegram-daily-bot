import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';
import * as dotenv from 'dotenv';
import * as fs from "fs";

dotenv.config();
import { logUnauthorizedAccess, logError, logInfo } from "./tools/log";
import { UserData } from "./interfaces/userdata";

const bot_token = process.env.BOT_TOKEN;
const user_states: Record<number, {awaiting_address?: boolean, pending_overwrite?: boolean}> = {};
const trusted_user_ids = process.env.TRUSTED_IDS?.split(",");

var user_data: {[user_id: number]: UserData} = {};

if (!bot_token) {
  console.error('BOT_TOKEN is not defined in your environment.');
  process.exit(1);
}

if (!trusted_user_ids) {
  console.error("TRUSTED_IDS are not configured. Please specify them for security reasons.");
  process.exit(2);
}

const bot = new Telegraf(bot_token);

bot.use((ctx, next) => {
  const user_id = ctx.message?.from.id;

  if(!user_id){
    logError("Failed to get user_id.");
    return;
  }

  if (trusted_user_ids.includes(user_id.toString())) {
    return next();
  } else {
    const user_name = ctx.message?.from.first_name;
    logUnauthorizedAccess(user_id, user_name);
  }
});

bot.start((ctx) => {
  ctx.reply('Welcome to the Daily Bot. Please view menu for more information on available commands!');
});

bot.command("set_home", (ctx) => {
  const user_id = ctx.message.from.id;
  if (user_data[user_id] && user_data[user_id].home){
    ctx.replyWithMarkdownV2(`You already set a home address\\.\n\nCurrent Address: \n  \`${user_data[user_id].home}\` \n\nDo you wish to overwrite it?`);
    user_states[user_id] = {pending_overwrite: true};
  } else {
    user_states[user_id] = {awaiting_address: true};
    ctx.reply('Please enter your home address');
  }
});

bot.command("get_traffic_data", (ctx) => {
  ctx.reply("You see, I would give you this data but it seems like there are no public APIs that would just give that data for free 😔.\n\nScraping it is a potential other option with is TBD.");
});

bot.command("get_forecast", (ctx) => {
  ctx.reply("Still pending integration. Likelihood of utilizing: https://open-meteo.com/en/docs#forecast_days=3");
});

bot.on(message('text'), (ctx) => {
  const user_id = ctx.message.from.id;
  const name = ctx.message.from.first_name;
  logInfo(`${name} (${user_id}): ${ctx.message.text}`);

  if (user_states[user_id]){
    if(user_states[user_id].pending_overwrite) {
      const response = ctx.message.text.toLowerCase();

      if(response === 'yes') {
        user_states[user_id].pending_overwrite = false;
        user_states[user_id].awaiting_address = true;
        ctx.reply("Please enter your new home address:");
      } else if (response == 'no') {
        user_states[user_id].pending_overwrite = false;
        ctx.reply('Operation cancelled. Address was not updated!');
      } else {
        ctx.reply('Invalid response. Please type "yes" or "no"');
      }
    } else if(user_states[user_id].awaiting_address) {
      const address = ctx.message.text;
      // Store the address in a JSON file.
      storeAddress(user_id, "home", address);
      user_data[user_id].home = address;
      ctx.reply(`Address set to: ${address}`);
      user_states[user_id].awaiting_address = false;
    }
  }
});

function storeAddress(user_id: number, type: string, address: string) {
  const data = {
    [user_id]: { 
      [type]: address,
    }
  };

  const json_data = JSON.stringify(data, null, 2);
  
  fs.writeFileSync('user_data.json', json_data);
}

// load user config if it exists
if (fs.existsSync("user_data.json")){
  const user_file_contents = fs.readFileSync("user_data.json", 'utf-8');
  user_data = JSON.parse(user_file_contents);
  logInfo("loaded `user_data.json` into memory.");
}

bot.launch();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));