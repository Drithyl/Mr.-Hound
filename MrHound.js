
//Dependencies
const Discord = require("discord.js");
const fs = require("fs");
const event = require("../../MrHound/Current/emitter.js");
const ids = require("../../MrHound/Current/ids.js");
const dice = require("../../MrHound/Current/dice.js");
const rw = require("../../MrHound/Current/reader_writer.js");
const dom4 = require("../../MrHound/Current/dom4.js");
const members = require("../../MrHound/Current/members.js");
const tasks = require("../../MrHound/Current/tasks.js");
const currency = require("../../MrHound/Current/currency.js");
const costsTable = require("../../MrHound/Current/costs_table.js");
const encounters = require("../../MrHound/Current/encounters.js");
const items = require("../../MrHound/Current/items.js").init();
const forms = require("../../MrHound/Current/forms.js").init();
const tracker = require("../../MrHound/Current/tracker.js").init();

//The Bot
const bot = new Discord.Client();

Number.prototype.truncate = function(places)
{
	if (this == null || isNaN(this))
	{
		return this;
	}

	if (Math.floor(this) == this)
	{
		return this;
	}

	else if (this.toString().split(".")[1].length > places)
	{
		return +this.toString().slice(0, this.toString().indexOf(".") + (places + 1));
	}

	else
	{
		return this;
	}
}

Number.prototype.cap = function(limit)
{
	if (this > limit)
	{
		return limit;
	}

	else return this;
}

Number.prototype.lowerCap = function(limit)
{
	if (this < limit)
	{
		return limit;
	}

	else return this;
}

String.prototype.capitalize = function()
{
	return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.toBox = function()
{
	if (this !== "" && this != null && this.length && /\S+/.test(this))
	{
		return "```" + this + "```";
	}

	else return this;
}

String.prototype.width = function (space, spaceFirst = false, char = " ")
{
	var arrL = space - this.length + 1;
	if (arrL < 1)	arrL = 1;

	if (spaceFirst) return Array(arrL).join(char) + this;
	else 						return this + Array(arrL).join(char);
}

String.prototype.findItem = function ()
{
	var item = items.find(this);

	if (item)
	{
		return item;
	}

	else return null;
}

String.prototype.findForm = function ()
{
	var form = forms.find(this);

	if (form)
	{
		return form;
	}

	else return null;
}

var token = "MjY0MzIwOTMzNDI5MjQ4MDAz.C1JsAA.xLemhXHLcIlh7T5FOADAzC0U2Uo";

var introFile = "introduction.info";

var owner;
var myGuild;
var botRole;
var adminRole;
var modRole;
var prophetRole;
var celestialRole;
var houndsRole;
var arenaChannel;

var didNotReconnect = false;
var reconnectInterval = 120000;

var greetings = [];
var acknowledgements = [];

//Stuff starts to happen after the 'ready' event is sent, so code is put here. Kinda like a constructor or main function.
bot.on("ready", () =>
{
	rw.log("I am ready!");
	didNotReconnect = false;
	owner = bot.users.get(ids.OWNER_ID);

	if (owner)
	{
		owner.send("I am ready!");
	}

	myGuild = bot.guilds.get(ids.GUILD_ID);

	if (myGuild)
	{
		rw.log ("I am working for the " + myGuild.name + "!");
		members.init(myGuild);
		houndsRole = myGuild.roles.get(ids.HOUNDS_ID);
		arenaChannel = myGuild.channels.get(ids.ARENA_ID);
		rw.log ("Getting Hounds Role object by its id: " + houndsRole);
	}

	rw.log ("Incorporating acknowledgements and greetings module!");
	acknowledgements = fs.readFileSync ("bot.acknowledgements", "utf8").split("\n");
	greetings = fs.readFileSync ("bot.greetings", "utf8").split("\n");
});

bot.on("disconnect", () =>
{
	didNotReconnect = true;
	rw.log ("I have been disconnected!");
	setTimeout (reconnect.bind(null, token), reconnectInterval);

	if (owner)
	{
		owner.send("I have been disconnected!");
	}
});

bot.on("reconnecting", () =>
{
	rw.log ("Trying to reconnect...");

	if (owner)
	{
		owner.send("Trying to reconnect...");
	}
});

bot.on("warn", warning =>
{
	rw.log("WARN: " + warning);
});

bot.on("error", err =>
{
	rw.log("An error occurred. This is from the 'on.error' event.");

	if (owner)
	{
		owner.send("Something went wrong! " + err);
	}
});

bot.on("debug", info =>
{
	rw.log("DEBUG: " + info);
});

//This simple piece of code catches those pesky unhelpful errors and gives you the line number that caused it!
process.on("unhandledRejection", err =>
{
  rw.log ("Unhandled rejection: \n" + err.stack.toString());

	if (owner)
	{
		owner.send("Unhandled rejection: \n" + err.stack.toString());
	}

	if (err.stack.toString().includes("ECONNRESET"))
	{
		//VerifyLastMessages();
	}
});

//On messages sent to channels
bot.on('message', message =>
{
	//Convert them all to uppercase to ignore capitals or lowercases
	var input = message.content.toUpperCase();
	var member = verifyMember(message.author);

	if (member == null || member.highestRole < houndsRole.position)
	{
		return;
	}

	//All input caught must be written in capitals because of the previous conversion.
	if (input.indexOf("?") != 0)
	{
		return;
	}

	if (input === "?COMMANDS")
	{
		message.author.send("You can find the list of commands in this file I'm sending you. I recommend opening it with a text processor that is code-friendly like Notepad++ or Atom, as otherwise the spacing will appear messed up.", {files: [{attachment: "bot.commands", name: "commands.txt"}]});
	}

	else if (message.channel.type == "dm")	//commands that only work in pms
	{
		var player = members.list[message.author.id];

		if (/^\?CREATE\s+\w+/.test(input))
		{
			var form = forms.find(input);

			if (player)
			{
				message.author.send("You already have a character created! If you would like to delete it, type `?delete this character`. **BE ADVISED, this is permanent.** The command also does not ask for confirmation!");
				return;
			}

			if (form == null)
			{
				message.author.send("Sorry, something went wrong. I might not have that form available. To create a character, type `?create <name of the form>`. You can also type `?forms` to me to get a list of what's currently available, or `?starting form` to get specifically the starting ones.");
				return;
			}

			if (form[ids.CAT].indexOf("starting form") == -1)
			{
				message.author.send("Sorry, that form isn't available to start with. To create a character, type `?create <name of the form>`. You can also type `?forms` to me to get a list of what's currently available, or `?starting form` to get specifically the starting ones.");
				return;
			}

			//var member = myGuild.members.get(message.author.id);
			//member.addRole(ids.GLADIATOR_ID);
			var character = members.register(message.author.username, message.author.id, form);
			var data = fs.readFileSync(introFile, "utf8");

			if (data == null)
			{
				message.author.send("Below is your character sheet: " + character.printCharSheet());
			}

			else
			{
				message.author.send(data);
				message.author.send(character.printCharSheet());
			}

			saveData([character.id]);
		}

		else if (/^\?ARMOU?RS?$/.test(input))
		{
			var data = rw.printTable(items.list.armors, null, ["cost", "id", "name", ids.PROT, ids.PROT_SHLD, ids.PARRY, ids.DEF, ids.ENC, ids.RAR, ids.PROPS, ids.CAT]);
			writeAndSend(message, data, "armors.txt");
		}

		else if (/^\?FORMS?$/.test(input))
		{
			var data = rw.printTable(forms.list, null, ["cost", "id", "name", ids.SIZE, ids.MAX_HP, ids.PROT, ids.MR, ids.MRL, ids.STR, ids.ATK, ids.DEF, ids.PREC, ids.ENC, ids.APS, ids.ATKS, ids.PATHS, ids.PROPS, ids.SLOTS, ids.PARTS, ids.CAT]);
			writeAndSend(message, data, "forms.txt");
		}

		else if (/^\?WEAPONS?$/.test(input))
		{
			var data = rw.printTable(items.list.weapons, null, ["cost", "id", "name", ids.DMG, ids.ATK, ids.DEF, ids.LENGTH, ids.NBR_ATKS, ids.DMG_TYPE, ids.CAN_REPEL, ids.REQ_SLOTS, ids.RAR, ids.ON_HIT, ids.ON_DMG, ids.PROPS, ids.CAT]);
			writeAndSend(message, data, "weapons.txt");
		}

		else if (/^\?(AXES|DAGGERS|EFFECTS|INTRINSICS|MACES|MISCELLANEOUS|POLEARMS|STAVES|SWORDS|WHIPS)$/.test(input))
		{
			var category = input.slice(1).toLowerCase();
			var data = rw.printTable(items.list.weapons, category, ["cost", "id", "name", ids.DMG, ids.ATK, ids.DEF, ids.LENGTH, ids.NBR_ATKS, ids.DMG_TYPE, ids.CAN_REPEL, ids.REQ_SLOTS, ids.RAR, ids.ON_HIT, ids.ON_DMG, ids.PROPS]);
			writeAndSend(message, data, category + ".txt");
		}

		else if (/^\?STARTING FORM$/.test(input))
		{
			var category = input.slice(1).toLowerCase();
			var data = rw.printTable(forms.list, category, ["id", "name", ids.START_GOLD, ids.START_POINTS, ids.SIZE, ids.MAX_HP, ids.PROT, ids.MR, ids.MRL, ids.STR, ids.ATK, ids.DEF, ids.PREC, ids.ENC, ids.APS, ids.ATKS, ids.PATHS, ids.PROPS, ids.SLOTS, ids.PARTS]);
			writeAndSend(message, data, category + ".txt");
		}

		else if (/^\?(AMPHIBIAN|ANIMAL|COLD-BLOODED|DEMON|INANIMATE|MAGIC BEING|TAGLESS|UNDEAD)$/.test(input))
		{
			var category = input.slice(1).toLowerCase();
			var data = rw.printTable(forms.list, category, ["cost", ids.LVL_POINTS, "id", "name", ids.SIZE, ids.MAX_HP, ids.PROT, ids.MR, ids.MRL, ids.STR, ids.ATK, ids.DEF, ids.PREC, ids.ENC, ids.APS, ids.ATKS, ids.PATHS, ids.PROPS, ids.SLOTS, ids.PARTS]);
			writeAndSend(message, data, category + ".txt");
		}

		else if (/^\?(ANIMALS|HEAVY ARMORS|HELMETS|LIGHT ARMORS|MEDIUM ARMORS)$/.test(input))
		{
			var category = input.slice(1).toLowerCase();
			var data = rw.printTable(items.list.armors, category, ["cost", "id", "name", ids.PROT, ids.DEF, ids.ENC, ids.RAR, ids.PROPS]);
			writeAndSend(message, data, category + ".txt");
		}

		else if (/^\?SHIELDS$/.test(input))
		{
			var category = input.slice(1).toLowerCase();
			var data = rw.printTable(items.list.armors, category, ["cost", "id", "name", ids.PROT_SHLD, ids.DEF, ids.PARRY, ids.ENC, ids.RAR, ids.PROPS]);
			writeAndSend(message, data, category + ".txt");
		}

		else if (/^\?TRINKETS$/.test(input))
		{
			var data = rw.printTable(items.list.trinkets, null, ["cost", "id", "name", ids.ENC, ids.RAR, ids.PROPS, "description"]);
			writeAndSend(message, data, "trinkets.txt");
		}

		else if (/^\?CONSUMABLES$/.test(input))
		{
			var data = rw.printTable(items.list.consumables, null, ["cost", "id", "name", ids.DURATION, ids.ONCE, ids.HEALING, ids.RAR, "description"]);
			writeAndSend(message, data, "consumables.txt");
		}

		else if (/^\?STATS\s*\w+/.test(input))
		{
			var item = items.find(input) || forms.find(input);

			if (item == null)
			{
				message.channel.send("Could not find that item or form. Make sure you spelled it correctly or that you gave the proper id. IDs start with a letter (a for armors, f for form, t for trinkets, and w for weapons) plus a number attached, like w28.");
				return;
			}

			message.channel.send("Here are the stats of the **" + item.name + "**:\n\n" + rw.printStats(item, 20).toBox());
		}

		else if (/^\?PRICE\s*\w*/.test(input))
		{
			writeAndSend(message, forms.price(input.findForm()), "costs.txt");
		}

		else if (/^\?CSV$/.test(input))
		{
			forms.priceCSVTable();
		}

		else if (input === "?TEST")
		{
			/*fs.writeFile("trinkets.csv", rw.tableToCSV(items.list.trinkets), (err) =>
	  	{
	  		if (err)
	  		{
	  			if (owner)
	  			{
	  				owner.sendMessage ("Something went wrong when trying to update the following file: " + filePath + "\nThe error given is: " + err);
	  			}

	  			this.log("Updating failed for the following file: " + filePath + "\nThe error given is: " + err);
	  			return;
	  		}
	  	});*/

			//writeAndSend(message, dom4.combatTest(members.list["170866063246884864"], members.list["111244660667600896"], 1, true), "Combat Test.txt");
			//console.log(dom4.combatTest(player, members.list["170866063246884864"], 100));
		}

		else if (player == null)
		{
			message.author.send("I see you have not yet created a character. To do so, type `?create <name of the starting form>`. You can check the starting forms available, as well as their stats, using `?starting form`.");
			return;
		}

		else if (/^\?SELF$/.test(input))
		{
			message.author.send(player.printCharSheet());
			message.author.send(player.printEquipment());
		}

		else if (/^\?VAULT$/.test(input))
		{
			message.author.send(player.printVault());
		}

		else if (/^\?(LEVEL\s*\-*UP)|(RAISE)$/.test(input))
		{
			var form = forms.find(player[ids.FORM]);
			var intro = "You have " + player[ids.LVL_POINTS] + " level-up points to level up. Below are your level up choices:\n\n";
			var msg = ("+1 HP increment (" + form.getHPIncrement().toString() + " HP): ").width(32) + player.nextLvlPointCost(player[ids.HP_INC], 0) + " point(s) (raised " + player[ids.HP_INC] + " times).\n";

			if (form[ids.CAT].indexOf(ids.ANIMAL) != -1 && form[ids.SLOTS][ids.FEET] == null)
			{
				msg += "+1 Nat. Protection: ".width(32) + player.nextLvlPointCost(player[ids.PROT][ids.BODY], form[ids.PROT][ids.BODY]) + " point(s) (raised " + (player[ids.PROT][ids.BODY] - form[ids.PROT][ids.BODY]) + " times).\n";
			}

			msg += "+1 MR: ".width(32) + player.nextLvlPointCost(player[ids.MR], form[ids.MR]) + " point(s) (raised " + (player[ids.MR] - form[ids.MR]) + " times).\n" +
						 "+1 Morale: ".width(32) + player.nextLvlPointCost(player[ids.MRL], form[ids.MRL]) + " point(s) (raised " + (player[ids.MRL] - form[ids.MRL]) + " times).\n" +
						 "+1 Strength: ".width(32) + player.nextLvlPointCost(player[ids.STR], form[ids.STR]) + " point(s) (raised " + (player[ids.STR] - form[ids.STR]) + " times).\n";

			message.author.send(intro + msg.toBox());
		}

		else if (encounters.ongoing[player.id])
		{
			message.author.send("You must finish your ongoing duel or spar before you can do this (ongoing battles will expire after an hour).");
			return;
		}

		else if (/^\?DELETE THIS CHARACTER$/.test(input))
		{
			rw.log(player.name + " (id " + player.id + ") deleted the character.");
			//var member = myGuild.members.get(player.id);
			//member.removeRole(ids.GLADIATOR_ID);
			delete members.list[player.id];
			delete members.vault[player.id];
			fs.unlink("vaults/" + player.id);
			fs.unlink("characters/" + player.id);

			message.author.send("Your character has been deleted. You can create a new one using the `?create <name or id of starting form>` as usual.");
		}

		else
		{
			try
			{
				if (/^\?RAISE\s/.test(input))
				{
					var form = forms.find(player[ids.FORM]);
					rw.log(player.name + " (id " + player.id + ") tried to raise: " + input);

					if (input.includes("HP"))
					{
						message.author.send(player.raiseHP());
					}

					else if (input.includes("PROTECTION"))
					{
						message.author.send(player.raiseProt());
					}

					else if (input.includes(ids.MR.toUpperCase()) || input.includes(ids.MRL.toUpperCase()) || input.includes(ids.STR.toUpperCase()))
					{
						var stat = input.slice(input.indexOf(" ") + 1).toLowerCase();
						message.author.send(player.raiseStat(stat));
					}
				}

				else if (/^\?TRANSITION\s/.test(input))
				{
					rw.log(player.name + " (id " + player.id + ") tried to transition: " + input);
					message.channel.send(forms.transition(player, input));
				}

				else if (/^\?(MY)?\s?TASKS$/.test(input))
				{
					rw.log(player.name + " (id " + player.id + ") displayed his shares.");
					message.author.send(player.printTasks());
				}

				else if (/^\?(MY)?\s?TASKS\s/.test(input))
				{
					message.author.send(tasks.setShares(input, player));
				}

				else if (/^\?(BUY|SELL|EQUIP|USE)/.test(input))
				{
					rw.log(player.name + " (id " + player.id + ") used the command: " + input);
					message.channel.send(processPlayerCommands(player, input.split("?", 10)));
					return;
				}

				else if (/^\?(UNEQUIP)$/.test(input))
				{
					rw.log(player.name + " (id " + player.id + ") unequipped all.");
					message.channel.send(player.unequipSlots([ids.HANDS, ids.HEAD, ids.BODY, ids.FEET, ids.MISC]).toBox());
				}

				else if (/^\?(UNEQUIP)/.test(input))
				{
					rw.log(player.name + " (id " + player.id + ") unequipped: " + input);
					var exp = new RegExp(ids.HANDS + "|" + ids.HEAD + "|" + ids.BODY + "|" + ids.FEET + "|" + ids.MISC);
					var slots = input.toLowerCase().match(exp);

					if (slots)
					{
						message.channel.send(player.unequipSlots([slots[0]]).toBox());
					}

					else
					{
						message.channel.send(player.unequipItem(input).toBox());
					}
				}
			}

			catch (err)
			{
				rw.log("An error was caught while processing the following input: " + input + "\n\n" + err);
				message.author.send("There was an error processing your request. Contact an Admin to help solve the issue.");
			}
		}
	}

	else if (message.channel.type == "text")	//commands that only work in textchannels
	{
		if (/^\?(HI|YO|HEY|HELLO|GREETINGS?|SALUTATIONS?)/.test(input))
		{
			rw.log (message.author.username + " greeted me.");

			//Get a random line from the greetings array
			var rndm = Math.floor((Math.random() * greetings.length));

			message.reply(greetings[rndm]);
		}

		else if (/^\?(THANKS?|THX)/.test(input))
		{
			rw.log (message.author.username + " thanked me.");

			//Get a random line from the greetings array
			var rndm = Math.floor((Math.random() * acknowledgements.length));

			message.reply(acknowledgements[rndm]);
		}

		else if (/^\?HELP/.test(input))
		{
			rw.log (message.author.username + " requested help.");
			message.author.send("Hey! You can find some general information about me and this group in this file I'm sending you!", {files: [{attachment: "bot.help", name: "bot.help.txt"}]});
		}

		//?XdY format, to roll a dice
		else if (/^\?(ROLL\s*)?\d+D\d+/.test(input))
		{
			var commands = input.split("?", 10);
			var l = commands.length;
			var str = "";

			//Starts at 1 cause the first split element is before the command
			for (var i = 1; i < l; i++)
			{
				str += processRolls(commands[i]).toBox();
			}

			message.channel.send(str);
		}

		else if (message.channel == arenaChannel && message.member.highestRole.position >= houndsRole.position)
		{
			var player = members.list[message.author.id];

			if (/^\?GIFTS?\s*(FROM|OF)\s*HEAVENS?/.test(input))
			{
				var target = verifyMember(message.mentions.users.first());

				if (target == null)
				{
					message.reply("Sorry, I could not find this member.");
					return;
				}

				rw.log (message.author.username + " requested a gift of heaven.");
				dom4.giftsFromHeaven(message, target);
			}

			else if (/^\?SMITE/.test(input))
			{
				var target = verifyMember(message.mentions.users.first());

				if (target == null)
				{
					message.reply("Sorry, I could not find this member.");
					return;
				}

				dom4.smite(message, target);
			}

			else if (player == null)
			{
				message.author.send("I see you have not yet created a character. To do so, type `?create <name of the starting form>`. You can check the starting forms available, as well as their stats, using `?starting form`.");
				return;
			}

			else if (/^\?(SPAR|DUEL)\s/.test(input))
			{
				var target = verifyMember(message.mentions.users.first());
				var battleType = input.slice(input.indexOf("?") + 1, input.indexOf(" ")).toLowerCase();

				if (target == null)
				{
					message.reply("Sorry, I could not find this member.");
					return;
				}

				if (target.id == ids.BOT_ID)
				{
					return;
				}

				if (members.list[target.id] == null)
				{
					message.reply("This member has not yet created a character. I will PM him the instructions to create one.");
					target.user.send(player.name + " has challenged you to a " + battleType + ", but I see that you have not yet created a character. To do so, type `?create <name of the starting form>`. You can check all starting forms available, as well as their stats, using `?starting form`");
					return;
				}

				if (player.id == target.id)
				{
					message.reply("You cannot challenge yourself.");
					return;
				}

				if (player[ids.CURR_HP] < 1 && input.includes("SPAR") == false)
				{
					message.reply("You must tend to your wounds before attempting another challenge.");
					return;
				}

				if (encounters.challenges[player.id])
				{
					message.reply("You already sent a challenge. Wait for that one to be accepted or to expire (every minute).");
					return;
				}

				if (encounters.ongoing[player.id])
				{
					message.reply("You already have an ongoing duel or spar, finish that one first.");
					return;
				}

				if (members.list[target.id][ids.CURR_HP] < 1 && input.includes("SPAR") == false)
				{
					message.reply("You cannot challenge the agonizing, you monster.");
					return;
				}

				rw.log(player.name + " challenged " + target.user.username + " to a " + battleType + ".");
				message.channel.send(dom4.challenge(battleType, player, members.list[target.id]));
			}

			else if (/^\?AT+ACKS?\s/.test(input))
			{
				var target = verifyMember(message.mentions.users.first());
				var battle = encounters.ongoing[player.id];

				if (target == null)
				{
					message.reply("Sorry, I could not find this member.");
					return;
				}

				if (target.id == ids.BOT_ID)
				{
					return;
				}

				if (members.list[target.id] == null)
				{
					message.reply("This member has not yet created a character. I will PM him the instructions to create one.");
					target.user.send(player.name + " tried to attack you! However, you have not yet created a character. To do so, type `?create <name of the starting form>`. You can check all forms available, as well as their stats, using `?forms`");
					return;
				}

				if (player.id == target.id)
				{
					message.reply("You cannot attack yourself.");
					return;
				}

				if (battle)
				{
					if (player.id != battle.turnID)
					{
						message.reply("Please wait for your turn.");
						return;
					}

					if (target.id != battle.offender.id && target.id != battle.challenger.id)
					{
						message.reply("You can only attack your battle opponent in the middle of a spar or duel.");
						return;
					}

					battle.updateExposure();

					if (battle.exposure == "private")
					{
						rw.log(player.name + " attacked " + target.user.username + " in private.");
						var pvtMsg = dom4.combat("attack", player, members.list[target.id]);
						message.author.send(pvtMsg);
						target.user.send(pvtMsg);
						return;
					}
				}

				rw.log(player.name + " attacked " + target.user.username + ".");
				message.channel.send(dom4.combat("attack", player, members.list[target.id]));
			}
		}
	}
});

event.e.on("minute", () =>
{
	encounters.cleanChallenges();
	encounters.cleanBattles(arenaChannel);

	for (var id in members.list)
	{
		var result = "";
		var player = members.list[id];
		var member = myGuild.members.get(id);
		var originalHP = player[ids.CURR_HP];

		if (encounters.ongoing[player.id] == null || encounters.ongoing[player.id].mode != "duel")
		{
			if (player[ids.ACTIVE_EFF] && Object.keys(player[ids.ACTIVE_EFF]).length)
			{
				for (var item in player[ids.ACTIVE_EFF])
				{
					result += items.trigger(player, items.find(item));
				}
			}

			result += tasks.resolveTasks(player);

			if (player[ids.CURR_HP] >= 0 && originalHP < 0)
			{
				result += "You have now healed enough to resume your occupations. ".toBox();
			}

			if (member)
			{
				if ((result !== "" || result != null) && result.length)
				{
					member.send(result);
				}
			}

			backupData(id);
		}
	}
});

event.e.on("hour", () =>
{
	rw.log("An hour has passed. Looping through players to update them.");
	var d = new Date();

	for (var id in members.list)
	{
		try
		{
			var result = "";
			var player = members.list[id];
			var member = myGuild.members.get(id);

			if (d.getHours() == 0)
			{
				rw.log("'tis Midnight. The time of gold has come.");
				player.transaction({[ids.GOLD]: 3});
				result += "'tis Midnight. You receive your basic income of 3 gold pieces. ";
			}

			if (member)
			{
				if (result !== "" && result.length)
				{
					member.send(result);
				}
			}

			backupData(id);
		}

		catch (error)
		{
			rw.log("An error occurred when doing the hourly update for player " + player.name + " (id " + player.id + "):\n\n" + error);
		}
	}
});

event.e.on("save", function(ids)
{
	if (Array.isArray(ids) && ids.length)
	{
		for (var i = 0; i < ids.length; i++)
		{
			backupData(ids[i]);
		}
	}
});

function writeAndSend(message, data, filename, path = "")
{
	message.author.send("I am processing your request, this might take a bit. Make sure to keep this file for future reference to avoid using this command too often.");

	fs.writeFile(path + filename, data, (err) =>
	{
		if (err)
		{
			rw.log("Failed writing file " + filename + ". The error given is:\n\n" + err);
			message.author.send("An error occurred when preparing the file. Please contact an Administrator.");
			return ;
		}

		message.author.send("You can find the list requested in this file. I recommend using a text processor with fixed char sizes, like Notepad++ or Atom; Windows Notepad or text processors with page formats will display the format incorrectly.", {files: [{attachment: path + filename, name: filename}]});
	});
}

function testCharData(character)
{
	if (typeof character.name !== "string")
	{
		rw.log("This character's name has been corrupted: " + character);
		return false;
	}

	if (typeof character.id !== "string")
	{
		rw.log("This character's id has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.LVL]))
	{
		rw.log("This character's level has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.XP]))
	{
		rw.log("This character's XP has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.LVL_POINTS]))
	{
		rw.log("This character's level points have been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.TRANSITION_POINTS]))
	{
		rw.log("This character's transition points have been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.ACTIVE_EFF] !== "object" || character[ids.ACTIVE_EFF] == null)
	{
		rw.log("This character's active effects object has been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.FORM] !== "string" || character[ids.FORM].includes("f") == false)
	{
		rw.log("This character's form has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.SIZE]))
	{
		rw.log("This character's size has been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.BASE_FACTORS] !== "object" || character[ids.BASE_FACTORS] == null)
	{
		rw.log("This character's base factors object has been corrupted: " + character);
		return false;
	}

	else if (isNaN(character[ids.BASE_FACTORS][ids.HEALING]))
	{
		rw.log("This character's healing base factor has been corrupted: " + character);
		return false;
	}

	else if (isNaN(character[ids.BASE_FACTORS][ids.RECUP]))
	{
		rw.log("This character's recuperation base factor has been corrupted: " + character);
		return false;
	}

	else if (isNaN(character[ids.BASE_FACTORS][ids.TRAIN]))
 	{
		rw.log("This character's training base factor has been corrupted: " + character);
		return false;
	}

	else if (isNaN(character[ids.BASE_FACTORS][ids.GOLD]))
	{
		rw.log("This character's gold base factor has been corrupted: " + character);
		return false;
	}

	else if (isNaN(character[ids.BASE_FACTORS][ids.GEMS]))
	{
		rw.log("This character's gems base factor has been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.FACTORS] !== "object")
	{
		rw.log("This character's factors object has been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.SHARES] !== "object" || character[ids.SHARES] == null)
	{
		rw.log("This character's shares object has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.HP_INC]))
	{
		rw.log("This character's HP increments have been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.MAX_HP]))
	{
		rw.log("This character's max HP have been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.CURR_HP]))
	{
		rw.log("This character's current HP have been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.REM_HP]))
	{
		rw.log("This character's remainder HP have been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.AFFL] !== "object" || character[ids.AFFL] == null)
	{
		rw.log("This character's affliction object has been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.PROT] !== "object" || character[ids.PROT] == null)
	{
		rw.log("This character's protection object has been corrupted: " + character);
		return false;
	}

	else
	{
		for (key in character[ids.PROT])
		{
			if (isNaN(character[ids.PROT][key]))
			{
				rw.log(key + "'s protection has been corrupted: " + character);
				return false;
			}
		}
	}

	if (isNaN(character[ids.MR]))
	{
		rw.log("This character's MR has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.MRL]))
	{
		rw.log("This character's morale has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.STR]))
	{
		rw.log("This character's strength has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.ATK]))
	{
		rw.log("This character's attack has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.DEF]))
	{
		rw.log("This character's defence has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.PREC]))
	{
		rw.log("This character's precision has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.ENC]))
	{
		rw.log("This character's encumbrance has been corrupted: " + character);
		return false;
	}

	if (isNaN(character[ids.APS]))
	{
		rw.log("This character's APs have been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.PATHS] !== "object")
	{
		rw.log("This character's paths object has been corrupted: " + character);
		return false;
	}

	if (typeof character[ids.PROPS] !== "object")
	{
		rw.log("This character's properties object has been corrupted: " + character);
		return false;
	}

	else
	{
		for (key in character[ids.PROPS])
		{
			if (isNaN(character[ids.PROPS][key]) && typeof character[ids.PROPS][key] !== "string")
			{
				rw.log("Property " + key + " has been corrupted: " + character);
				return false;
			}
		}
	}

	return true;
}

function testVaultData(vault)
{
	if (typeof vault.currency !== "object" || vault.currency == null)
	{
		rw.log("This vault's currency object has been corrupted: " + vault);
		return false;
	}

	else
	{
		for (key in vault.currency)
		{
			if (isNaN(vault.currency[key]))
			{
				rw.log("This vault's " + key + " has been corrupted: " + vault);
				return false;
			}
		}
	}

	if (typeof vault.armors !== "object" || typeof vault.consumables !== "object" ||
			typeof vault.trinkets !== "object" || typeof vault.weapons !== "object")
	{
		rw.log("This vault's object has been corrupted.");
		rw.log(vault);
		return false;
	}

	for (key in vault.armors)
	{
		if (testItemData(key, vault.armors) == false)
		{
			rw.log("Full vault object below.");
			rw.log(vault);
			return false;
		}
	}

	for (key in vault.consumables)
	{
		if (testItemData(key, vault.consumables) == false)
		{
			rw.log("Full vault object below.");
			rw.log(vault);
			return false;
		}
	}

	for (key in vault.trinkets)
	{
		if (testItemData(key, vault.trinkets) == false)
		{
			rw.log("Full vault object below.");
			rw.log(vault);
			return false;
		}
	}

	for (key in vault.weapons)
	{
		if (testItemData(key, vault.weapons) == false)
		{
			rw.log("Full vault object below.");
			rw.log(vault);
			return false;
		}
	}

	return true;
}

function testItemData(key, object)
{
	if (/^[actw]\d+/.test(key) == false)
	{
		rw.log("Item key " + key + " has been corrupted.");
		return false;
	}

	else if (isNaN(object[key]))
	{
		rw.log("Item " + key + " amount has been corrupted.");
		return false;
	}

	else return true;
}

function saveData(ids)
{
	if (Array.isArray(ids) && ids.length)
	{
		for (var i = 0; i < ids.length; i++)
		{
			rw.log("Saving data for " + ids[i]);
			if (testCharData(members.list[ids[i]]) == false)
			{
				if (owner)
				{
					owner.send(ids[i] + "'s char data is corrupted, check the log!");
				}

				continue;
			}

			if (testVaultData(members.vault[ids[i]]) == false)
			{
				if (owner)
				{
					owner.send(ids[i] + "'s vault data is corrupted, check the log!");
				}

				continue;
			}

			rw.saveCharData("vaults/" + ids[i], members.vault[ids[i]]);
			rw.saveCharData("characters/" + ids[i], members.list[ids[i]]);
		}
	}
}

function backupData(id)
{
	if (id == null)
	{
		return;
	}

	fs.access("vaults/" + id, fs.constants.R_OK | fs.constants.W_OK, (err) =>
	{
		if (err)
		{
			rw.log("Cannot access vaults/" + id + ": " + err);
			return;
		}

		rw.copyFile("vaults/" + id, "vaults.backup/" + id, save);
	});

	fs.access("characters/" + id, fs.constants.R_OK | fs.constants.W_OK, (err) =>
	{
		if (err)
		{
			rw.log("Cannot access characters/" + id + ": " + err);
			return;
		}

		rw.copyFile("characters/" + id, "characters.backup/" + id, save);
	});

	function save(err)
	{
		if (err)
		{
			rw.log("There was an error while trying to back up the player " + id + ":\n\n" + err);
			return;
		}

		rw.log("Saving data for " + id);
		if (testCharData(members.list[id]) == false)
		{
			if (owner)
			{
				owner.send(id + "'s char data is corrupted, check the log!");
			}

			return;
		}

		if (testVaultData(members.vault[id]) == false)
		{
			if (owner)
			{
				owner.send(id + "'s vault data is corrupted, check the log!");
			}

			return;
		}

		rw.saveCharData("vaults/" + id, members.vault[id]);
		rw.saveCharData("characters/" + id, members.list[id]);
	}
}

function saveAll()
{
	for (var id in members.list)
	{
		rw.log("Saving char data for " + id);
		if (testCharData(members.list[id]) == false)
		{
			if (owner)
			{
				owner.send(id + "'s char data is corrupted, check the log!");
			}

			continue;
		}

		rw.saveCharData("characters/" + id, members.list[id]);
	}

	for (var id in members.vault)
	{
		rw.log("Saving vault data for " + id);
		if (testVaultData(members.vault[id]) == false)
		{
			if (owner)
			{
				owner.send(id + "'s vault data is corrupted, check the log!");
			}

			continue;
		}

		rw.saveCharData("vaults/" + id, members.vault[id]);
	}
}

function processPlayerCommands(player, commands)
{
	var l = commands.length;
	var str = "";

	//Starts at 1 cause the first split element is before the command
	for (var i = 1; i < l; i++)
	{
		var fn = commands[i].slice(0, commands[i].indexOf(" ")).toLowerCase();
		var input = commands[i].slice(commands[i].indexOf(" "));
		str += player[fn](input);
	}

	return str;
}

function processRolls(input)
{
	var d = input.toLowerCase().replace(/\?|roll|\+|\s/g, "").split("d");
	var num = d[0] || 0;
	var max = d[1] || 0;
	var explode = (input.includes("+")) ? true : false;

	if (isNaN(+num) || isNaN(+max))
	{
		return "Make sure you introduce only numbers separated by a 'd', like `?5d6`. Use a + to roll exploding dice.";
	}

	if (+num <= 0 || +num > 20  || +max <= 0 || +max > 100)
	{
		return "The number of dice must be between 1 and 20 and the dice sides must be between 1 and 100";
	}

	return dice.roll(+num, +max, explode);
}

//Checks whether the member exists, and several other options like whether he's online, if it can be the bot
//or higher up members (for targetting), and returns the GuildMember object
function verifyMember(user, canBeOffline = true)
{
	if (user == null)
	{
		return undefined;
	}

	var member = myGuild.members.get(user.id);

	if (member == null)
	{
		return undefined;
	}

	if (member.presence.status == "offline" && canBeOffline == false)
	{
		return undefined;
	}

	return member;
}

function reconnect(token)
{
	if (didNotReconnect == true)
	{
		bot.login(token);
		rw.log("Manual attempt to reconnect...");
	}
}

//Login to the server, always goes at the end of the document, don't ask me why
bot.login(token);
