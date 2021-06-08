# Mr.-Hound
Bot created for Discord using discord.js to emulate the combat of Dominions 4 in a text format and with character progression.

"characters" and "vaults" are the folders where the bot stores the information of saved characters and their vaults of currency and items.

All .csv files are the ones that the bot loads up for the content - stats of weapons, armour, forms, etc. These tables can all be visioned directly in spreadsheet
form at https://docs.google.com/spreadsheets/d/1GgQXzLLKz5BNNCFGyEBfPuEl1IH9DnlXqmbcQa_Cp8o/edit?usp=sharing

The tree of all possible forms that player characters can become can be viewed here (this is a large image): https://cdn.discordapp.com/attachments/267247109965611009/312317823567396864/Form_tree.png

All .js files are the actual working code. The entry point is MrHound.js. It's all kicked off specifically at the "ready" event trigger.

"ecosystem.config.js" and "MrHound - pm2.bat" are files used specifically for integrating the bot in pm2, so not strictly necessary to run the bot.

All files starting with "bot" and without a format "bot.acknowledgements", "bot.commands", etc are information files that the bot parses to send messages in chat. This could have been done much better in other formats, like JSON, but at the time I was unfamiliar with other options and just went with what worked (this is pretty much a staple of the entire project).

The token that the bot uses to log in to Discord has been hidden. The variable can be found in the MrHound.js code file.


DIRECTORY STRUCTURE

Node.js has to be installed two directories upwards from where all the files sit. This can of course be changed by altering the path of all the 'require' statements in each of the .js files. The starting point of those statements is the MrHound.js file, taken as the root.


KNOWN BUGS:

- It seems that when the characters have progressed enough that their stats get fairly large, something messes up with the save files, likely to do with NaN values and such. I never got around to fixing it since the interest for the arena had already faded and I had already decided to shut down the development.


SAMPLE (LONG) DUEL OUTPUT:

![Round 1](https://ibb.co/v3Dr3df)
![Round 2-3](https://ibb.co/cTqBqBH)
![Round 4](https://ibb.co/WnFjJ4v)
![Round 5](https://ibb.co/myvcg7C)
![Round 6-7](https://ibb.co/2YggJ9z)
![Round 8](https://ibb.co/pj9vGrp)
![Round 9-10](https://ibb.co/tXz7RGr)
![Round 11](https://ibb.co/n6SysMR)
![Round 12](https://ibb.co/R6vY6TF)
![Round 13-end](https://ibb.co/fvyv25y)
