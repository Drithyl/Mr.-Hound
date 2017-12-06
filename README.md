# Mr.-Hound
Bot created for Discord using discord.js to emulate the combat of Dominions 4 in a text format and with character progression.

"characters" and "vaults" are the folders where the bot stores the information of saved characters and their vaults of currency and items.

All .csv files are the ones that the bot loads up for the content - stats of weapons, armour, forms, etc.

All .js files are the actual working code. The entry point is MrHound.js. It's all kicked off specifically at the "ready" event trigger.

"ecosystem.config.js" and "MrHound - pm2.bat" are files used specifically for integrating the bot in pm2, so not strictly necessary to run the bot.

All files starting with "bot" and without a format "bot.acknowledgements", "bot.commands", etc are information files that the bot parses to send messages in chat. This could have been done much better in other formats, like JSON, but at the time I was unfamiliar with other options and just went with what worked (this is pretty much a staple of the entire project).

The token that the bot uses to log in to Discord has been hidden. The variable can be found in the MrHound.js code file.
