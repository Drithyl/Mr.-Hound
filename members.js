
const ids = require("../../MrHound/Current/ids.js");
const dice = require("../../MrHound/Current/dice.js");
const event = require("../../MrHound/Current/emitter.js");
const rw = require("../../MrHound/Current/reader_writer.js");
const currency = require("../../MrHound/Current/currency.js");
const tasks = require("../../MrHound/Current/tasks.js");

var myGuild;
var membersFile = "members";
var vaultFile = "vault";

var decPlaces = 5;

var goldFactor = 0.7;
var gemFactor = 0.1;
var trainFactor = 0.05;
var formTrainFactor = 0.1;
var healingFactor = 15;
var recuperationFactor = 1;

var startingGold = 10;
var startingPoints = 1;
var sellRate = 0.6;

var afflChanceMultiplier = 25;
var afflChanceCap = 33;
var severChance = afflChanceMultiplier * 0.75;
var recupChance = 25;
var healableAffl = {[ids.BATTLE_FRIGHT]: 1, [ids.CHEST_WOUND]: 1, [ids.DISEASED]: 1, [ids.DMGD_ARM()]: 1,
										[ids.DMGD_EYE()]: 1, [ids.DMGD_HEAD()]: 1, [ids.DMGD_WING()]: 1,
										[ids.LIMP]: 1, [ids.WEAKENED]: 1, [ids.TORN_WING()]: 1};

/*These are the values that tweak the XP required for each new level, according to the following formula:
**(current level + 1 * baseXP) to the power of expInc, rounded to the nearestXP**************************
**This is assuming that a character starts at level 0.**************************************************/
var baseXP = 100;
var expInc = 1.3;
var nearestXP = 50;
var pointsPerLvl = 2;

module.exports =
{
	list: {},
	vault: {},
	membersFile: "members",
	vaultFile: "vault",

  init: function(guild)
  {
		myGuild = guild;
		rw.retrieveRecords("characters", defineMember, this.list);
		rw.retrieveRecords("vaults", defineVault, this.vault);
    return this;
  },

	register: function(username, id, form)
	{
		var gold = startingGold;
		var lvlPoints = startingPoints;

		if (form[ids.START_GOLD])
		{
			gold = form[ids.START_GOLD];
		}

		if (form[ids.START_POINTS])
		{
			lvlPoints = form[ids.START_POINTS];
		}

		rw.log(username + " created a " + form.name);
		this.list[id] = applyForm(username, id, form, lvlPoints);
		this.vault[id] = defineVault(gold);
		return this.list[id];
	}
}

/**********************************************************************************************************************
**********************************************END OF EXPOSURE**********************************************************
***********************************************************************************************************************/

function defineMember()
{
	return obj =
	{
		name: 										"",
		id: 											"",
		[ids.LVL]: 								0,
		[ids.XP]: 								0,
		[ids.LVL_POINTS]:					0,
		[ids.TRANSITION_POINTS]:	0,
		[ids.ACTIVE_EFF]:					{},
		[ids.FORM]: 				  		"",
	  [ids.SIZE]:           		0,
		[ids.BASE_FACTORS]:				{[ids.HEALING]: healingFactor, [ids.RECUP]: recuperationFactor, [ids.TRAIN]: trainFactor,
														 	 [ids.GOLD]: goldFactor, [ids.GEMS]: gemFactor},
		[ids.FACTORS]:						{},
		[ids.SHARES]:							{[ids.GOLD]: 100, [ids.HEALING]: 0, [ids.RECUP]: 0},
		[ids.HP_INC]:							0,
	  [ids.MAX_HP]:         		0,
	  [ids.CURR_HP]:        		0,
		[ids.REM_HP]:							0,
		[ids.AFFL]: 							{},
	  [ids.PROT]:    						{},
	  [ids.MR]:             		0,
	  [ids.MRL]: 					  		0,
	  [ids.STR]: 				 				0,
	  [ids.ATK]: 					  		0,
	  [ids.DEF]: 					  		0,
	  [ids.PREC]: 				  		0,
	  [ids.ENC]:        				0,
		[ids.APS]:								0,
	  [ids.PATHS]: 							{},
	  [ids.PROPS]:         			{},
	  [ids.HANDS]:          		null,
		[ids.HEAD]:           		null,
		[ids.BODY]:           		null,
		[ids.FEET]:           		null,
		[ids.MISC]:           		null,

		"abstract": abstract,
		"printCharSheet": printCharSheet,
		"printEquipment": printEquipment,
		"printVault": printVault,
		"printTasks": printTasks,
		"raiseXP": raiseXP,
		"raiseHP": raiseHP,
		"raiseProt": raiseProt,
		"raiseStat": raiseStat,
		"nextLvlXP": nextLvlXP,
		"nextLvlPointCost": nextLvlPointCost,
		"getLevelledProps": getLevelledProps,
		"getForm": getForm,
		"getVault": getVault,
		"hasEnoughCurrency": hasEnoughCurrency,
		"transaction": transaction,
		"buy": buy,
		"sell": sell,
		"equip": equip,
		"prepareIntrinsic": prepareIntrinsic,
		"use": use,
		"dropItem": dropItem,
		"dropSlots": dropSlots,
		"unequipItem": unequipItem,
		"unequipSlots": unequipSlots,
		"cleanSlots": cleanSlots,
		"hasEquipped": hasEquipped,
		"hasInVault": hasInVault,
		"hasHealableAffl": hasHealableAffl,
		"isHealthy": isHealthy,
		"storeInVault": storeInVault,
		"removeFromVault": removeFromVault,
		"lesserRecuperate": lesserRecuperate,
		"recuperate": recuperate,
		"heal": heal,
		"drain": drain,
		"applyDmg": applyDmg,
		"ignite": ignite,
		"tickPoison": tickPoison,
		"tickCold": tickCold,
		"tickFire": tickFire,
		"escapeWeb": escapeWeb,
		"endEffects": endEffects,
		"changeShape": changeShape,
		"revertShape": revertShape,
		"reduceHP": reduceHP,
		"calcAffliction": calcAffliction,
		"loseSlot": loseSlot,
		"addFatigue": addFatigue,
		"reinvigorate": reinvigorate,
		"getSlotsNbr": getSlotsNbr,
		"getWeapons": getWeapons,
		"getRepelWeapons": getRepelWeapons,
		"getAttacks": getAttacks,
		"getRepels": getRepels,
		"getEquippedWeapons": getEquippedWeapons,
		"getIntrinsicWeapons": getIntrinsicWeapons,
		"getUnusableParts": getUnusableParts,
		"getGoldFactor": getGoldFactor,
		"getGemFactor": getGemFactor,
		"getTrainFactor": getTrainFactor,
		"getSharesHealingFactor": getSharesHealingFactor,
		"getFinalHealingFactor": getFinalHealingFactor,
		"getRecupFactor": getRecupFactor,
		"getTtlHP": getTtlHP,
		"getTtlShapeHP": getTtlShapeHP,
		"getTtlProt": getTtlProt,
		"getTtlShieldProt": getTtlShieldProt,
		"getTtlAtt": getTtlAtt,
		"getDualPen": getDualPen,
		"getTtlDef": getTtlDef,
		"getTtlParry": getTtlParry,
		"getTtlStr": getTtlStr,
		"getTtlMR": getTtlMR,
		"getTtlMor": getTtlMor,
		"getTtlPrec": getTtlPrec,
		"getTtlEnc": getTtlEnc,
		"getTtlPath": getTtlPath,
		"getTtlReinvig": getTtlReinvig,
		"getTtlRes": getTtlRes,
		"checkProp": checkProp,
		"printPaths": printPaths
	};
}

function defineAbstractMember()
{
	return obj =
	{
		name: 										"",
		id: 											"",
		[ids.LVL]: 								0,
		[ids.XP]: 								0,
		[ids.LVL_POINTS]:					0,
		[ids.TRANSITION_POINTS]:	0,
		[ids.ACTIVE_EFF]:					{},
		[ids.FORM]: 				  		"",
	  [ids.SIZE]:           		0,
		[ids.HP_INC]:							0,
	  [ids.MAX_HP]:         		0,
	  [ids.CURR_HP]:        		0,
		[ids.REM_HP]:							0,
		[ids.AFFL]: 							{},
	  [ids.PROT]:    						{},
	  [ids.MR]:             		0,
	  [ids.MRL]: 					  		0,
	  [ids.STR]: 				 				0,
	  [ids.ATK]: 					  		0,
	  [ids.DEF]: 					  		0,
	  [ids.PREC]: 				  		0,
	  [ids.ENC]:        				0,
		[ids.APS]:								0,
	  [ids.PATHS]: 							{},
	  [ids.PROPS]:         			{},
	  [ids.HANDS]:          		null,
		[ids.HEAD]:           		null,
		[ids.BODY]:           		null,
		[ids.FEET]:           		null,
		[ids.MISC]:           		null,

		"mergeAbstract": mergeAbstract,
		"battleReady": battleReady,
		"raiseXP": raiseXP,
		"nextLvlXP": nextLvlXP,
		"getForm": getForm,
		"dropItem": dropItem,
		"dropSlots": dropSlots,
		"unequipItem": unequipItem,
		"unequipSlots": unequipSlots,
		"cleanSlots": cleanSlots,
		"hasEquipped": hasEquipped,
		"hasInVault": hasInVault,
		"storeInVault": storeInVault,
		"removeFromVault": removeFromVault,
		"lesserRecuperate": lesserRecuperate,
		"recuperate": recuperate,
		"heal": heal,
		"drain": drain,
		"applyDmg": applyDmg,
		"ignite": ignite,
		"tickPoison": tickPoison,
		"tickCold": tickCold,
		"tickFire": tickFire,
		"escapeWeb": escapeWeb,
		"endEffects": endEffects,
		"changeShape": changeShape,
		"revertShape": revertShape,
		"reduceHP": reduceHP,
		"calcAffliction": calcAffliction,
		"loseSlot": loseSlot,
		"addFatigue": addFatigue,
		"reinvigorate": reinvigorate,
		"getSlotsNbr": getSlotsNbr,
		"getWeapons": getWeapons,
		"getRepelWeapons": getRepelWeapons,
		"getAttacks": getAttacks,
		"getRepels": getRepels,
		"getEquippedWeapons": getEquippedWeapons,
		"getIntrinsicWeapons": getIntrinsicWeapons,
		"getUnusableParts": getUnusableParts,
		"getTtlHP": getTtlHP,
		"getTtlShapeHP": getTtlShapeHP,
		"getTtlProt": getTtlProt,
		"getTtlShieldProt": getTtlShieldProt,
		"getTtlAtt": getTtlAtt,
		"getDualPen": getDualPen,
		"getTtlDef": getTtlDef,
		"getTtlParry": getTtlParry,
		"getTtlStr": getTtlStr,
		"getTtlMR": getTtlMR,
		"getTtlMor": getTtlMor,
		"getTtlPrec": getTtlPrec,
		"getTtlEnc": getTtlEnc,
		"getTtlPath": getTtlPath,
		"getTtlReinvig": getTtlReinvig,
		"getTtlRes": getTtlRes,
		"checkProp": checkProp
	};
}

function defineVault(startGold = startingGold)
{
	return obj =
	{
		currency:			{[ids.GOLD]: startGold},
		armors:				{},
		consumables:	{},
		stables:			{},
		trinkets:			{},
		weapons:			{}
	};
}

function applyForm(username, identifier, form, lvlPoints = startingPoints)
{
	var obj = defineMember();

	obj.name = 									username;
	obj.id = 										identifier;
	obj[ids.LVL_POINTS] =				lvlPoints;
	obj[ids.FORM] = 				    form.id;
  obj[ids.SIZE] =             form[ids.SIZE];
  obj[ids.MAX_HP] =         	form[ids.MAX_HP];
  obj[ids.CURR_HP] =         	form[ids.MAX_HP];
  obj[ids.PROT] =    					Object.assign({}, form[ids.PROT]);
  obj[ids.MR] =               form[ids.MR];
  obj[ids.MRL] = 					  	form[ids.MRL];
  obj[ids.STR] = 				 			form[ids.STR];
  obj[ids.ATK] = 					  	form[ids.ATK];
  obj[ids.DEF] = 					  	form[ids.DEF];
  obj[ids.PREC] = 				  	form[ids.PREC];
  obj[ids.ENC] =        			form[ids.ENC];
	obj[ids.APS] =							form[ids.APS];
  obj[ids.PATHS] = 						form[ids.PATHS];
  obj[ids.PROPS] =         		form[ids.PROPS];

	for (var slot in form[ids.SLOTS])
	{
		obj[slot] = {[ids.EMPTY]: form[ids.SLOTS][slot]};
	}

	obj.cleanSlots([ids.HANDS, ids.HEAD, ids.BODY, ids.FEET, ids.MISCELLANEOUS]);

	return obj;
}

function abstract(t = this)
{
	var absChar = defineAbstractMember();

	for (var key in absChar)
	{
		if (typeof absChar[key] === "function")
		{
			continue;
		}

		if (typeof absChar[key] === "object" && Array.isArray(absChar[key]) == false)
		{
			absChar[key] = Object.assign({}, t[key]);
		}

		else
		{
			absChar[key] = t[key];
		}
	}

	absChar[t.id] = t;

	return absChar;
}

function mergeAbstract(t = this)
{
	var original = t[t.id];
	delete t[t.id];
	delete t[ids.HEAD];
	delete t[ids.BODY];
	delete t[ids.FEET];
	delete t[ids.MISC];

	for (var key in t)
	{
		if (typeof t[key] === "function")
		{
			continue;
		}

		if (key == ids.HANDS && t[key][ids.LOST])
		{
			var originalsLost = original[key][ids.LOST] || 0;
			var diff = t[key][ids.LOST] - originalsLost;
			for (var i = 0; i < diff; i++)
			{
				original.loseSlot(ids.HANDS);
			}
		}

		else if (typeof t[key] === "object" && Array.isArray(t[key]) == false)
		{
			original[key] = Object.assign({}, t[key]);
		}

		else
		{
			original[key] = t[key];
		}
	}

	delete t;
}

function battleReady(heal = false, t = this)
{
	if (heal)
	{
		if (t[ids.PROPS][ids.FIRSTSHAPE])
		{
			changeShape(t[ids.PROPS][ids.FIRSTSHAPE], 0, t);
		}

		t[ids.CURR_HP] = t[ids.MAX_HP];
	}

	t[ids.STATUS] = {[ids.FAT]: 0};

	if (t[ids.PROPS][ids.GLAMOUR])
	{
		t[ids.STATUS][ids.GLAMOUR] = 1 + (Math.floor(t[ids.PATHS][ids.AIR]) || 0);
	}

	if (t[ids.MISC]["t9"])
	{
		t[ids.STATUS][ids.TWIST_FATE] = true;
	}
}

function printCharSheet(spacing = 24, t = this)
{
	var str = "Numbers after a slash ('/') are the total values, with afflictions and equipment taken into account.\n\n";
	var sheetStr = "";
	var attacks = getWeapons(t);

	sheetStr +=

		"Stats:\n" 																									+ "".width(40, false, "—") + "\n\n" +
		("Name: ").width(spacing) 																	+ "<" + t.name + ">\n" +
		("ID: ").width(spacing)																			+ "<" + t.id + ">\n" +
		(ids.LVL.capitalize() + ": ").width(spacing)								+ "<" + t[ids.LVL] + ">\n" +
		(ids.XP.capitalize() + ": ").width(spacing)									+ "<" + t[ids.XP] + "/" + nextLvlXP(t) + ">\n" +
		(ids.LVL_POINTS.capitalize() + ": ").width(spacing)					+ "<" + t[ids.LVL_POINTS] + ">\n" +
		(ids.TRANSITION_POINTS.capitalize() + ": ").width(spacing)	+ "<" + t[ids.TRANSITION_POINTS] + ">\n" +
		("Task factors: ").width(spacing)														+	tasks.getFactors(t) + "\n" +
		(ids.FORM.capitalize() + ": ").width(spacing)								+ "<" + t[ids.FORM].findForm().name + ">\n" +
		(ids.SIZE.capitalize() + ": ").width(spacing)								+ "<" + t[ids.SIZE] + ">\n" +
		("HP: ").width(spacing)																			+ "<" + ((t[ids.CURR_HP] + (t[ids.REM_HP] * Math.pow(10, -1 * decPlaces)).truncate(decPlaces))) + "/" + t[ids.MAX_HP] + " (" + getTtlHP(true, t) + ")>\n" +
		(ids.AFFL.capitalize() + ": ").width(spacing)								+ "<" + rw.printProps(t[ids.AFFL]) + ">\n" +
		("Protection: ").width(spacing);

	for (var part in t[ids.PROT])
	{
		sheetStr += part + " <" + t[ids.PROT][part] + "/" + getTtlProt(part, false, t) + "> ";
	}

	sheetStr += "\n" +

		(ids.MR.capitalize() + ": ").width(spacing)									+ "<" + t[ids.MR]+ "/" + getTtlMR(false, t) + ">\n" +
		(ids.MRL.capitalize() + ": ").width(spacing)								+ "<" + t[ids.MRL]+ "/" + getTtlMor(false, t) + ">\n" +
		(ids.STR.capitalize() + ": ").width(spacing)								+ "<" + t[ids.STR]+ "/" + getTtlStr(false, t) + ">\n" +
		(ids.ATK.capitalize() + ": ").width(spacing)								+ "<" + t[ids.ATK]+ "/" + getTtlAtt(null, false, t) + "> Attacks: ";

	for (var i = 0; i < attacks.length; i++)
	{
		var dualPen = (attacks[i][ids.PROPS][ids.BONUS] == null) ? getDualPen(t) : 0;
		sheetStr += attacks[i].name.capitalize() + " (" + (getTtlAtt(attacks[i], true, t) - dualPen) + ") ";
	}

	sheetStr += "\n" +

		(ids.DEF.capitalize() + ": ").width(spacing)					+ "<" + t[ids.DEF]+ "/" + getTtlDef(false, t) + ">\n" +
		(ids.PREC.capitalize() + ": ").width(spacing)					+ "<" + t[ids.PREC]+ "/" + getTtlPrec(null, false, t) + ">\n" +
		(ids.ENC.capitalize() + ": ").width(spacing)					+ "<" + t[ids.ENC]+ "/" + getTtlEnc(t) + ">\n" +
		(ids.PATHS.capitalize() + ": ").width(spacing)				+ "<" + rw.printProps(t[ids.PATHS]) + ">\n" +
		(ids.PROPS.capitalize() + ": ").width(spacing)				+ "<" + rw.printProps(t[ids.PROPS]) + ">\n" +
		(ids.ACTIVE_EFF.capitalize() + ": ").width(spacing);

	for (var key in t[ids.ACTIVE_EFF])
	{
		var item = key.findItem();
		sheetStr += "<" + item.name + ": " + t[ids.ACTIVE_EFF][key] + "/" + (item[ids.PROPS][ids.DURATION] * 60) + "> ";
	}

	return str + sheetStr.toBox();
}

function printEquipment(spacing = 24, t = this)
{
	var str = "Equipment worn:\n" + "".width(40, false, "—") + "\n\n";
	var slots = {[ids.HANDS]: t[ids.HANDS],
							 [ids.HEAD]: t[ids.HEAD],
							 [ids.BODY]: t[ids.BODY],
							 [ids.FEET]: t[ids.FEET],
							 [ids.MISC]: t[ids.MISC]};

	for (var s in slots)
	{
		str += (s.capitalize() + ": ").width(spacing);

		for (var key in slots[s])
		{
			if (key == ids.EMPTY || key == ids.LOST || key == ids.USED)
			{
				str += "<" + key + " x" + slots[s][key] + ">, ";
				continue;
			}

			var item = key.findItem();

			if (item == null)
			{
				continue;
			}

			str += "<" + item.name.capitalize() + " x" + slots[s][key] + ">, ";
		}

		str = str.slice(0, str.lastIndexOf(", ")) + "\n";
	}

	return str.toBox();
}

function printVault(spacing = 24, t = this)
{
	var vault = module.exports.vault[t.id];
	var str = "Possessions currently in your vault:\n" + "".width(40, false, "—") + "\n\n";

	for (var type in vault)
	{
		str += (type.capitalize() + ": ").width(spacing);

		if (!Object.keys(vault[type]).length)
		{
			str += "\n";
			continue;
		}

		for (var key in vault[type])
		{
			if (type == "currency")
			{
				str += "<" + key.capitalize() + ": " + vault[type][key] + ">, ";
				continue;
			}

			var item = key.findItem();

			if (item == null)
			{
				continue;
			}

			str += "<" + item.name.capitalize() + " x" + vault[type][key] + ">, ";
		}

		str = str.slice(0, str.lastIndexOf(", ")) + "\n";
	}

	return str.toBox();
}

function printTasks(spacing = 30, t = this)
{
	var healFactor = getFinalHealingFactor(t);
	var maxHP = (t[ids.PROPS][ids.FIRSTSHAPE]) ? getTtlShapeHP(true, false, t) : getTtlHP(false, t);
	var currHP = (t[ids.CURR_HP] + (t[ids.REM_HP] * Math.pow(10, -1 * decPlaces)).truncate(decPlaces));

	var trainStats = {[ids.ATK]: "Attack gain (atk/min): ", [ids.DEF]: "Defence gain (def/min): ", [ids.PREC]: "Precision gain (prc/min): "};

	var otherStats = {[ids.GOLD]: "Gold gain (g/min): ", [ids.BLOOD_G]: "Bloodstone chance (%): ", [ids.AIR_G]: "Diamond chance (%): ",
						 [ids.NATURE_G]: "Emerald chance (%): ", [ids.DEATH_G]: "Onyx chance (%): ", [ids.ASTRAL_G]: "Pearl chance (%): ",
						 [ids.FIRE_G]: "Ruby chance (%): ", [ids.WATER_G]: "Sapphire chance (%): ", [ids.EARTH_G]: "Topaz chance (%): "};



	var str = "Healing rate (hp/min): ".width(spacing) + ("<+" + healFactor + "> ").width(15) + "(" + (t[ids.SHARES][ids.HEALING] || 0) + " shares). ";

	if (currHP < 0)
	{
		var ticksToZero = Math.floor(Math.abs(currHP) / healFactor);
		var hoursToZero = Math.floor(ticksToZero / 60);
		var ticksToMax = Math.floor(maxHP / getSharesHealingFactor(t));
		var hoursToMax = Math.floor(ticksToMax / 60);
		str += hoursToZero + "h" + Math.floor(ticksToZero % 60) + "m to resume tasks";

		if (t[ids.AFFL][ids.DISEASED])
		{
			str += ". You will then stop healing naturally until the disease is healed.\n";
		}

		else str += " and an additional " + hoursToMax + "h" + Math.floor(ticksToMax % 60) + "m to heal completely.\n";
	}

	else if (t[ids.AFFL][ids.DISEASED])
	{
		str += "You cannot heal naturally over 0 HP until the disease is healed.\n";
	}

	else
	{
		var ticksToMax = Math.floor((maxHP - currHP) / healFactor);
		var hoursToMax = Math.floor(ticksToMax / 60);
		str += hoursToMax + "h" + Math.floor(ticksToMax % 60) + "m to heal completely.\n";
	}

	str += "Recuperation chance (%): ".width(spacing) + ("<+" + tasks.methods[ids.RECUP].factor(t) + "> ").width(15) + "(^).\n\n";

	for (var key in trainStats)
	{
		str += trainStats[key].width(spacing) + ("<+" + tasks.methods[key].factor(t) + "> ").width(15) + "(" + (t[ids.SHARES][key] || 0) + " shares). " +
					 daysToStat(t[key], Math.floor(t[key] + 1), tasks.methods[key].factor(t)) + "d" +
					 Math.floor(hoursToStat(t[key], Math.floor(t[key] + 1), tasks.methods[key].factor(t)) % 24) + "h" +
					 Math.floor(ticksToStat(t[key], Math.floor(t[key] + 1), tasks.methods[key].factor(t)) % 60) + "m left to raise your " + key + ".\n\n";
	}

	for (var key in otherStats)
	{
		str += otherStats[key].width(spacing) + ("<+" + tasks.methods[key].factor(t) + "> ").width(15) + "(" + (t[ids.SHARES][key] || 0) + " shares).\n\n";
	}

	return str.toBox();
}

function ticksToStat(currentStat, goal, factor)
{
	if (factor == 0)
	{
		return 0;
	}

	return Math.floor(((goal) - currentStat) / factor);
}

function hoursToStat(currentStat, goal, factor)
{
	if (factor == 0)
	{
		return 0;
	}

	return Math.floor(Math.floor(((goal) - currentStat) / factor) / 60);
}

function daysToStat(currentStat, goal, factor)
{
	if (factor == 0)
	{
		return 0;
	}

	return Math.floor(Math.floor(Math.floor(((goal) - currentStat) / factor) / 60) / 24);
}

function cleanVault(vault)
{
	for (var type in vault)
	{
		for (var key in vault[type])
		{
			if (key == ids.GOLD)
			{
				continue;
			}

			if (vault[type][key] <= 0)
			{
				delete vault[type][key];
			}
		}
	}
}

function raiseXP(gain, t = this)
{
	var currLvl = t[ids.LVL];

	if (gain <= 0)
	{
		return "";
	}

	t[ids.XP] += gain;

	while (t[ids.XP] >= nextLvlXP(t))
	{
		t[ids.LVL]++;
		t[ids.LVL_POINTS]++;
		t[ids.TRANSITION_POINTS]++;
	}

	if (t[ids.LVL] > currLvl)
	{
		return t.name + " earned " + gain + " xp and reached level " + t[ids.LVL] + "!";
	}

	else
	{
		return t.name + " earned " + gain + " xp.";
	}
}

function raiseHP(t = this)
{
	var form = t[ids.FORM].findForm();
	var gain = form.getHPIncrement();
	var cost = nextLvlPointCost(t[ids.HP_INC], 0, t);

	if (t[ids.LVL_POINTS] < cost)
	{
		return "You need " + (cost - t[ids.LVL_POINTS]) + " more points to raise your HP.";
	}

	t[ids.HP_INC]++;
	t[ids.MAX_HP] += gain;
	t[ids.CURR_HP] += gain;
	t[ids.LVL_POINTS] -= cost;
	return "Your HPs have been raised by " + gain + ". You now have " + t[ids.MAX_HP] + " HPs.";
}

function raiseProt(t = this)
{
	var form = t[ids.FORM].findForm();
	var cost = nextLvlPointCost(t[ids.PROT][ids.BODY], form[ids.PROT][ids.BODY], t);

	if (t[ids.LVL_POINTS] < cost)
	{
		return "You need " + (cost - t[ids.LVL_POINTS]) + " more points to raise your natural protection.";
	}

	if (form[ids.SLOTS][ids.FEET] || form[ids.CAT].indexOf(ids.ANIMAL) == -1)
	{
		return "Only beasts can raise their natural protection.";
	}

	for (var part in t[ids.PROT])
	{
		t[ids.PROT][part]++;
	}

	t[ids.LVL_POINTS] -= cost;
	return "Your natural protection has been raised by 1.";
}

function raiseStat(stat, t = this)
{
	var form = t[ids.FORM].findForm();
	var cost = nextLvlPointCost(t[stat], form[stat], t);

	if (t[ids.LVL_POINTS] < cost)
	{
		return "You need " + (cost - t[ids.LVL_POINTS]) + " more points to raise your " + stat + ".";
	}

	if (t[stat] == null)
	{
		return "I couldn't find this stat, make sure you spelled it correctly.";
	}

	t[stat]++;
	t[ids.LVL_POINTS] -= cost;
	return "Your " + stat + " has been raised by 1. You now have " + t[stat] + " " + stat + ".";
}

function getLevelledProps(t = this)
{
	var currForm = t[ids.FORM].findForm();
  var levelledProps = {};

  for (var prop in t[ids.PROPS])
  {
    if (currForm[ids.PROPS][prop] == null)
    {
      levelledProps[prop] = t[ids.PROPS][prop];
      continue;
    }

    if (isNaN(t[ids.PROPS][prop]) == false && t[ids.PROPS][prop] > currForm[ids.PROPS][prop])
    {
      levelledProps[prop] = t[ids.PROPS][prop] - currForm[ids.PROPS][prop];
    }
  }

	return levelledProps;
}

function getForm(t = this)
{
	return t[ids.FORM].findForm();
}

function getVault(t = this)
{
	return module.exports.vault[t.id];
}

function hasEnoughCurrency(cost, t = this)
{
	var vlt = module.exports.vault[t.id];

	for (var type in cost)
	{
		if (vlt.currency[type] == null || isNaN(vlt.currency[type]) || vlt.currency[type] < cost[type])
		{
			return false;
		}
	}

	return true;
}

function transaction(amount, discount = 1, t = this)
{
	var currInVault = module.exports.vault[t.id].currency;

	for (var type in amount)
	{
		if (isNaN(amount[type]))
		{
			continue;
		}

		var gain = amount[type] * discount;

		if (currInVault[type])
		{
			currInVault[type] += gain;
			currency.objTruncate(currInVault, type, decPlaces);
		}

		else if (currInVault[type] == null && gain > 0)
		{
			currInVault[type] = gain;
			currency.objTruncate(currInVault, type, decPlaces);
		}

		else rw.log("Something went wrong for " + t.name + ". It gained " + gain + " " + type + " currency but couldn't grant it.");
	}
}

function buy(input, t = this)
{
	var item = input.findItem();
	var vlt = module.exports.vault[t.id];

	if (item == null)
	{
		return "Sorry, I do not have that in my database. You can type `?armours`, `?trinkets`, or `?weapons` in a private message to me to get a list of what's currently available.";
	}

	if (item.name.toLowerCase() == "fist" || item.name.toLowerCase() == "useless kick")
	{
		return "You cannot buy natural weapons, these come attached to a form.";
	}

	if (item.rarity > 0)
	{
		return "That item is a rarity, I'm afraid we do not sell it.";
	}

	if (hasEnoughCurrency(item.cost, t) == false)
	{
		var missingCurr = currency.subtract(item.cost, vlt.currency);
		return "You don't have enough currency to buy the " + item.name + ". You are missing the following amounts:\n\n" + rw.printStats(missingCurr, 15).toBox();
	}

	storeInVault(item, 1, t);
	transaction(item.cost, -1, t);
	return ("The " + item.name + " has been bought.").toBox();
}

function sell(input, t = this)
{
	var item = input.findItem();
	var vlt = module.exports.vault[t.id];

	if (item == null)
	{
		return "Sorry, I do not have that in my database. You can type `?armours`, `?trinkets`, or `?weapons` in a private message to me to get a list of what's currently available.";
	}

	if (item.name.toLowerCase() == "fist" || item.name.toLowerCase() == "useless kick")
	{
		return "You cannot sell bodyparts (yet).";
	}

	if (hasInVault(item.id, 1, t))
	{
		removeFromVault(item, 1, t);
	}

	else if (hasEquipped(item.id, t) != -1)
	{
		dropItem(item.id, t);
	}

	else
	{
		return "You do not have this item equipped nor in your vault.";
	}

	transaction(item.cost, sellRate, t);
	return ("The " + item.name + " has been sold.").toBox();
}

function use(input, t = this)
{
	var item = input.findItem();

	if (item == null)
	{
		return "Sorry, I do not have that item in my database. You can type `?armours`, `?trinkets`, or `?weapons` to me to get a list of what's currently available.";
	}

	if (item.getType() != "consumables")
	{
		return "This item is not a consumable.";
	}

	if (hasInVault(item.id, 1, t) == false)
	{
		return "You don't have this item in your vault.";
	}

	if (item[ids.PROPS][ids.DURATION] && t[ids.ACTIVE_EFF][item.id])
	{
		return "This item's effect is already ongoing, wait until the previous use wears off.";
	}

	return item.trigger(t);
}

function equip(input, t = this)
{
	var item = input.findItem();
	var form = t[ids.FORM].findForm();

	if (item == null)
	{
		return "Sorry, I do not have that item in my database. You can type `?armours`, `?trinkets`, or `?weapons` to me to get a list of what's currently available.";
	}

	if ((form[ids.CAT].indexOf(ids.ANIMAL) != -1 && form[ids.SLOTS][ids.FEET] <= 0) &&
			 item[ids.CAT].indexOf(ids.ANIMAL) == -1 && item[ids.SLOT] != ids.MISC)
	{
		return "Only humanoid forms can equip this item.";
	}

	if (item[ids.CAT].indexOf(ids.ANIMAL) != -1 && form[ids.CAT].indexOf(ids.ANIMAL) == -1)
	{
		return "Only animals can equip this item.";
	}

	if (t[item[ids.SLOT]][ids.EMPTY] == null || item[ids.REQ_SLOTS] > t[item[ids.SLOT]][ids.EMPTY])
	{
		return "You don't have enough slots free to use this item.";
	}

	if (item[ids.NBR_ATKS] && item.isIntrinsic())
	{
		return prepareIntrinsic(item, t);
	}

	if (hasInVault(item.id, 1, t) == false)
	{
		return "You don't have this item in your vault.";
	}

	removeFromVault(item, 1, t);
	t[item[ids.SLOT]][ids.EMPTY] -= item[ids.REQ_SLOTS];
	t[item[ids.SLOT]][item.id] = ++t[item[ids.SLOT]][item.id] || 1;
	t[item[ids.SLOT]][ids.USED] = t[item[ids.SLOT]][ids.USED] + item[ids.REQ_SLOTS] - 1 || item[ids.REQ_SLOTS] - 1;

	cleanSlots([item[ids.SLOT]], t);
	return (t.name + " equipped the " + item.name + ".").toBox();
}

function prepareIntrinsic(item, t = this)
{
	var form = t[ids.FORM].findForm();

	if (form[ids.ATKS][item.id] == null)
	{
		return "Your current form does not possess this kind of weapon.";
	}

	if (hasEquipped(item.id, t) >= form[ids.ATKS][item.id])
	{
		return "You already have prepared the maximum number of this intrinsic attack that your current form allows.";
	}

	t[item[ids.SLOT]][ids.EMPTY] -= item[ids.REQ_SLOTS];
	t[item[ids.SLOT]][item.id] = ++t[item[ids.SLOT]][item.id] || 1;
	t[item[ids.SLOT]][ids.USED] = t[item[ids.SLOT]][ids.USED] + item[ids.REQ_SLOTS] - 1 || item[ids.REQ_SLOTS] - 1;

	cleanSlots([item[ids.SLOT]], t);
	return t.name + " prepared its " + item.name + ".";
}

function dropItem(input, t = this)
{
	var item = input.findItem();

	if (item && t[item[ids.SLOT]][item.id])
	{
		freeUsedSlot(item, 1, t);
	}
}

function dropSlots(slots, t = this)
{
	for (var i = 0; i < slots.length; i++)
	{
		if (t[slots[i]] == null)
		{
			continue;
		}

		for (var key in t[slots[i]])
		{
			if (key != ids.LOST && key != ids.EMPTY && key != ids.USED)
			{
				var item = key.findItem();
				freeUsedSlot(item, t[slots[i]][key], t);
			}
		}
	}
}

function unequipItem(input, t = this)
{
	var item = input.findItem();

	if (item == null || t[item[ids.SLOT]][item.id] == null)
	{
		return "You don't have that item equipped. Make sure you spelled it properly or gave the right ID.";
	}

	freeUsedSlot(item, 1, t);

	if (item.getType() == "weapons" && item.isIntrinsic())
	{
		return t.name + " no longer has the " + item.name + " prepared.";
	}

	storeInVault(item, 1, t);
	return t.name + " unequipped the " + item.name + ".";
}

function unequipSlots(slots, t = this)
{
	for (var i = 0; i < slots.length; i++)
	{
		if (t[slots[i]] == null)
		{
			continue;
		}

		for (var key in t[slots[i]])
		{
			if (key != ids.LOST && key != ids.EMPTY && key != ids.USED)
			{
				var amnt = t[slots[i]][key];
				var item = key.findItem();

				if ((item.getType() == "weapons" && item.isIntrinsic() == false) || item.getType() != "weapons")
				{
					storeInVault(item, amnt, t);
				}

				freeUsedSlot(item, amnt, t);
			}
		}
	}

	return t.name + " dropped the equipment worn.";
}

function cleanSlots(slots, t = this)
{
	for (var i = 0; i < slots.length; i++)
	{
		if (t[slots[i]] == null)
		{
			delete t[slots[i]];
			continue;
		}

		for (var key in t[slots[i]])
		{
			if (t[slots[i]][key] <= 0)
			{
				delete t[slots[i]][key];
			}
		}
	}
}

function hasEquipped(id, t = this)
{
	var slots = [ids.HANDS, ids.HEAD, ids.BODY, ids.FEET, ids.MISC];

	while (slots.length)
	{
		var slot = slots.shift();

		for (var key in t[slot])
		{
			if (key == id && t[slot][key] >= 1)
			{
				return t[slot][key];
			}
		}
	}

	return -1;
}

function hasInVault(id, amnt = 1, t = this)
{
	var vlt = module.exports.vault[t.id];

	if (vlt == null)
	{
		return false;
	}

	for (var type in vlt)
	{
		for (var item in vlt[type])
		{
			if (item == id && vlt[type][item] >= amnt)
			{
				return true;
			}
		}
	}

	return false;
}

function hasHealableAffl(t = this)
{
	if (t[ids.AFFL] == null || !Object.keys(t[ids.AFFL]).length)
	{
		return false;
	}

	var afflArr = Object.keys(t[ids.AFFL]).filter(function(aff){return healableAffl[aff] != null;});

	if (afflArr.length >= 1)
	{
		return true;
	}

	else return false;
}

function isHealthy(t = this)
{
	var maxHP = getTtlHP(false, t);

	if (t[ids.CURR_HP] < maxHP)
	{
		return false;
	}

	if (t[ids.PROPS][ids.FIRSTSHAPE])
	{
		return false;
	}

	if (Object.keys(t[ids.AFFL]).length >= 1 && (hasHealableAffl(t) || t[ids.PROPS][ids.RECUP]))
	{
		return false;
	}

	return true;
}

function storeInVault(item, amnt = 1, t = this)
{
	var vlt = module.exports.vault[t.id];
	vlt[item.getType()][item.id] = vlt[item.getType()][item.id] + amnt || amnt;
}

function removeFromVault(item, amnt = 1, t = this)
{
	var vlt = module.exports.vault[t.id];
	vlt[item.getType()][item.id] -= amnt;
	cleanVault(vlt);
}

function lesserRecuperate(chance = recupChance, t = this)
{
	var roll = Math.random() * 101;
	var afflArr = Object.keys(t[ids.AFFL]).filter(function(aff){return healableAffl[aff] != null;});

	if (roll > chance)
	{
		var share = (t[ids.CURR_HP] < 0) ? 1 : ((t[ids.SHARES][ids.RECUP] * 0.01 + 0.5) || 0.5);
		var addedChance = t[ids.BASE_FACTORS][ids.RECUP] * share;
		t[ids.FACTORS][ids.RECUP] = t[ids.FACTORS][ids.RECUP] + addedChance || addedChance;
		currency.objTruncate(t[ids.FACTORS], ids.RECUP, 5);
		return "";
	}

	var afflHealed = "";

	if (afflArr.indexOf(ids.DISEASED) != -1)
	{
		afflHealed = ids.DISEASED;
	}

	else afflHealed = afflArr[Math.floor(Math.random() * afflArr.length)];

	t[ids.AFFL][afflHealed]--;
	updateAfflictions(t);
	delete t[ids.FACTORS][ids.RECUP];
	return afflHealed.toString().capitalize() + " was healed. ";
}

function recuperate(chance = recupChance, t = this)
{
	var roll = Math.random() * 101;
	var afflArr = Object.keys(t[ids.AFFL]);

	if (roll > chance)
	{
		var share = (t[ids.CURR_HP] < 0) ? 1 : ((t[ids.SHARES][ids.RECUP] * 0.01 + 0.5) || 0.5);
		var addedChance = (t[ids.BASE_FACTORS][ids.RECUP] * share) * 2;
		t[ids.FACTORS][ids.RECUP] = t[ids.FACTORS][ids.RECUP] + addedChance || addedChance;
		currency.objTruncate(t[ids.FACTORS], ids.RECUP, 5);
		return "";
	}

	var afflHealed = "";

	if (afflArr.indexOf(ids.DISEASED) != -1)
	{
		afflHealed = ids.DISEASED;
	}

	else afflHealed = afflArr[Math.floor(Math.random() * afflArr.length)];

	var afflHealed = afflArr[Math.floor(Math.random() * afflArr.length)];
	t[ids.AFFL][afflHealed]--;
	updateAfflictions(t);
	delete t[ids.FACTORS][ids.RECUP];
	return afflHealed.toString().capitalize() + " was healed. ";
}

function heal(amnt, isPercentage = false, setAt = false, t = this)
{
	var maxHP = getTtlHP(false, t);

	if (amnt <= 0)
	{
		return "";
	}

	if (isPercentage)
	{
		amnt = (amnt * 0.01) * maxHP;
	}

	if (setAt)
	{
		t[ids.CURR_HP] = Math.floor(amnt);
		t[ids.REM_HP] = 0;
		currency.objTruncate(t, ids.REM_HP, decPlaces);
	}

	else
	{
		t[ids.REM_HP] += amnt * Math.pow(10, decPlaces);
		currency.objTruncate(t, ids.REM_HP, decPlaces);

		if (t[ids.REM_HP] > Math.pow(10, decPlaces))
		{
			t[ids.CURR_HP] += Math.floor(t[ids.REM_HP] / Math.pow(10, decPlaces));
			t[ids.REM_HP] %= Math.pow(10, decPlaces);
			currency.objTruncate(t, ids.REM_HP, decPlaces);
		}
	}

	if (t[ids.CURR_HP] > maxHP || (t[ids.CURR_HP] == maxHP && t[ids.REM_HP] > 0))
	{
		if (t[ids.PROPS][ids.FIRSTSHAPE])
		{
			revertShape(t[ids.PROPS][ids.FIRSTSHAPE], t[ids.CURR_HP] - maxHP, t);
			return t.name + " reverts back to the original shape at " + t[ids.CURR_HP] + " hp. ";
		}

		else
		{

			t[ids.CURR_HP] = maxHP;
			t[ids.REM_HP] = 0;
		}
	}

	return t.name + ": +" + amnt + " hp (now at " + t[ids.CURR_HP] + " hp). ";
}

function drain(dmg, type, t = this)
{
	dmg = (type.includes("partial")) ? dmg.cap(5) : dmg;
	var hpDrain = Math.floor(dmg * 0.5);
	var fatDrain = dmg * 2;
	return heal(hpDrain, t) + reinvigorate(fatDrain, t);
}

function applyDmg(dmg, type, hitLoc, isStun, t = this)
{
	if (type == ids.WEB)
	{
		t[ids.STATUS][ids.WEBBED] = {[ids.SIZE]: dmg};
		return t.name + " is webbed.";
	}

	else if (type == ids.STUN || isStun)
	{
		if (type == ids.COLD || type == ids.FIRE)
		{
			return addFatigue(dmg, t) + ignite(dmg, type, t);
		}

		else return addFatigue(dmg, t);
	}

	else if (type == ids.POISON)
	{
		var poisonApplied = ((t[ids.STATUS][ids.POISONED] || 0) + dmg).cap(Math.floor(t[ids.MAX_HP]));
		t[ids.STATUS][ids.POISONED] = poisonApplied;
		return t.name + ": +" + dmg + " " + ids.POISON + " (" + t[ids.STATUS][ids.POISONED] + " TTL). ";
	}

	else if (type == ids.COLD || type == ids.FIRE)
	{
		return reduceHP(dmg, type, hitLoc, true, t) + ignite(dmg, type, t);
	}

	else if (type == ids.PARALYSIS)
	{
		var ttl = Math.floor((dmg - t[ids.SIZE]) * 0.5);

		if (t[ids.STATUS][ids.PARALYZED])
		{
			ttl = (t[ids.STATUS][ids.PARALYZED] > ttl) ? Math.floor(t[ids.STATUS][ids.PARALYZED] * 0.5).cap(5) : Math.floor(ttl * 0.5).cap(5);
		}

		if (ttl > 0)
		{
			t[ids.STATUS][ids.PARALYZED] = t[ids.STATUS][ids.PARALYZED] + ttl || ttl;
			return t.name + ": +" + ttl + " " + ids.PARALYSIS + "(" + t[ids.STATUS][ids.PARALYZED] + " TTL). ";
		}

		else return "";
	}

	else
	{
		return reduceHP(dmg, type, hitLoc, true, t);
	}
}

function ignite(dmg, type, t = this)
{
	var igniteChance = dmg * 5;
	var roll = Math.floor((Math.random() * 100)) + 1;

	if (roll > igniteChance)
	{
		return "";
	}

	if (type == ids.FIRE)
	{
		t[ids.STATUS][ids.ON_FIRE] = true;
		return t.name + " is on fire. ";
	}

	else if (type == ids.COLD)
	{
		t[ids.STATUS][ids.FREEZING] = true;
		return t.name + " is freezing. ";
	}

	else return "";
}

function tickPoison(t = this)
{
	if (t[ids.STATUS][ids.POISONED] == null || t[ids.STATUS][ids.POISONED] <= 0)
	{
		return "";
	}

	var dmg = Math.floor(t[ids.STATUS][ids.POISONED] * 0.1).lowerCap(1);
	t[ids.STATUS][ids.POISONED] -= dmg;

	if (t[ids.STATUS][ids.POISONED] <= 0)
	{
		delete t[ids.STATUS][ids.POISONED];
	}

	return "Poison. " + reduceHP(dmg, ids.POISON, ids.BODY, true, t);
}

function tickCold(t = this)
{
	var dmg = Math.floor((Math.random() * 11)) + 2;
	var result = t.name + " is freezing. " + addFatigue(dmg, t);
	var thawChance = (t[ids.PROPS][ids.RES_COLD]) ? 25 + (t[ids.PROPS][ids.RES_COLD] * 5) : 25;
	var roll = Math.floor((Math.random() * 100)) + 1;

	if (roll <= thawChance)
	{
		delete t[ids.STATUS][ids.FREEZING];
		result += "The ice thawed. ";
	}

	return result;
}

function tickFire(t = this)
{
	var dmg = Math.floor(Math.random() * t[ids.SIZE]) + 1;
	var result = t.name + " is burning. " + reduceHP(dmg, ids.FIRE, ids.BODY, true, t);
	var extinguishChance = (t[ids.PROPS][ids.RES_FIRE]) ? 25 + (t[ids.PROPS][ids.RES_FIRE] * 5) : 25;
	var roll = Math.floor((Math.random() * 100)) + 1;

	if (roll <= extinguishChance)
	{
		delete t[ids.STATUS][ids.ON_FIRE];
		result += "The fire was extinguished. ";
	}

	return result;
}

function tickParalysis(t = this)
{
	var rounds = t[ids.STATUS].paralysis--;

	if (t[ids.STATUS].paralysis <= 0)
	{
		delete t[ids.STATUS].paralysis;
	}

	return t.name + " is paralyzed, " + rounds + " left.";
}

function escapeWeb(t = this)
{
	var strRoll = dice.DRN() + getTtlStr(true, t) + t[ids.SIZE];
	var difficulty = 18 + t[ids.STATUS][ids.WEBBED][ids.SIZE];

	if (strRoll >= difficulty)
	{
		delete t[ids.STATUS][ids.WEBBED];
		return t.name + " escapes the web (STR Roll " + strRoll + " vs " + difficulty + ").";
	}

	else return t.name + " is still webbed (STR Roll " + strRoll + " vs " + difficulty + ").";
}

function endEffects(roundLimit = 20, t = this)
{
	var result = "";

	if (t[ids.STATUS] == null)
	{
		rw.log("No status object found for " + t.name);
		return "";
	}

	if (t[ids.STATUS][ids.POISONED])
	{
		if (Math.floor(t[ids.STATUS][ids.POISONED] * 0.5) > 0)
		{
			result += reduceHP(Math.floor(t[ids.STATUS][ids.POISONED] * 0.5), ids.POISON, ids.BODY, false, t);
		}

		delete t[ids.STATUS][ids.POISONED];
	}

	if (t[ids.STATUS][ids.ON_FIRE])
	{
		var rounds = 0;
		while (t[ids.STATUS][ids.ON_FIRE])
		{
			rounds++;

			if (rounds > roundLimit)
			{
				break;
			}

			result += tickFire(t);
		}
	}

	if (t[ids.STATUS][ids.FREEZING])
	{
		var rounds = 0;
		while (t[ids.STATUS][ids.FREEZING])
		{
			rounds++;

			if (rounds > roundLimit)
			{
				break;
			}

			result += tickCold(t);
		}
	}

	return result;
}

function changeShape(newShapeID, dmgCarried = 0, t = this)
{
	var currShape = t[ids.FORM].findForm();
	var newShape = ("f" + newShapeID).findForm();

	for (var stat in newShape)
	{
		if (isNaN(newShape[stat]) || stat == "id" || isNaN(t[stat]))
		{
			continue;
		}

		t[stat] = newShape[stat] + (t[stat] - currShape[stat]).lowerCap(0);
	}

	for (var slot in currShape[ids.SLOTS])
	{
		if (newShape[ids.SLOTS][slot] == null)
		{
			if (t[slot][ids.LOST] != null)
			{
				var slotsLost = t[slot][ids.LOST];
				t[slot] = {[ids.LOST]: slotsLost};
			}

			else delete t[slot];
			t[t.id].unequipSlots([slot]);
		}
	}

	t[ids.FORM] = newShape.id;
	delete t[ids.PROPS];
	t[ids.PROPS] = Object.assign({}, newShape[ids.PROPS]);
	t[ids.MAX_HP] = newShape[ids.MAX_HP] + (newShape.getHPIncrement() * t[ids.HP_INC]);
	t[ids.CURR_HP] = t[ids.MAX_HP] - dmgCarried;
	return t.name + " turns into a " + newShape.name + ". ";
}

function revertShape(originalShapeID, currHP = 1, t = this)
{
	var currShape = t[ids.FORM].findForm();
	var originalShape = ("f" + originalShapeID).findForm();

	for (var stat in originalShape)
	{
		if (isNaN(originalShape[stat]) || isNaN(t[stat]) || stat == "id")
		{
			continue;
		}

		t[stat] = originalShape[stat] + (t[stat] - currShape[stat]).lowerCap(0);
	}

	for (var slot in originalShape[ids.SLOTS])
	{
		if (currShape[ids.SLOTS][slot] == null)
		{
			if (t[slot] && t[slot][ids.LOST] && originalShape[ids.SLOTS][slot] > t[slot][ids.LOST])
			{
				t[slot][ids.EMPTY] = originalShape[ids.SLOTS][slot] - t[slot][ids.LOST];
			}

			else if (t[slot] == null)
			{
				t[slot] = {[ids.EMPTY]: originalShape[ids.SLOTS][slot]};
			}
		}
	}

	t[ids.FORM] = originalShape.id;
	delete t[ids.PROPS];
	t[ids.PROPS] = Object.assign({}, originalShape[ids.PROPS]);
	t[ids.CURR_HP] = currHP;
	t[ids.MAX_HP] = originalShape[ids.MAX_HP] + (originalShape.getHPIncrement() * t[ids.HP_INC]);
}

function reduceHP(dmg, type, hitLoc, afflicts = true, t = this)
{
	var finalDmg = dmg;
	var result = "";

	var remainingHP = Math.floor(t[ids.CURR_HP]) - finalDmg;

	if (t[ids.PROPS][ids.FIRSTSHAPE] || t[ids.PROPS][ids.SECONDSHAPE])
	{
		var combinedHP = getTtlShapeHP(false, true, t);

		if (remainingHP < combinedHP * -1)
		{
			remainingHP = combinedHP * -1;
		}
	}

	else if (remainingHP < t[ids.MAX_HP] * -1)
	{
		remainingHP = t[ids.MAX_HP] * -1;
	}

	var result = (remainingHP > 0) ? 	result + t.name + ": -" + finalDmg + " hp (" + remainingHP + " hp left). " :
																		result + t.name + ": -" + finalDmg + " hp, KOed at " + remainingHP + " hp. ";

	if (finalDmg <= 0)
	{
		return "";
	}

	if (t[ids.PROPS][ids.BERSERK] && t[ids.STATUS][ids.BERSERK] == null)
	{
		var moraleRoll = dice.DRN() + getTtlMor(true, t);
		var difficulty = dice.DRN() + 12;

		if (moraleRoll > difficulty)
		{
			t[ids.STATUS][ids.BERSERK] = t[ids.PROPS][ids.BERSERK];
			result += t.name + " goes berserk (" + t[ids.STATUS][ids.BERSERK] + ").";
		}
	}

	if (t[ids.STATUS] && t[ids.STATUS][ids.ENCOUNTER])
	{
		var battle = t[ids.STATUS][ids.ENCOUNTER];

		if (t.id == battle.challenger.id)
		{
			battle.challengerDmgTaken += finalDmg;
			battle.offenderDmgDealt += finalDmg;
		}

		else if (t.id == battle.offender.id)
		{
			battle.offenderDmgTaken += finalDmg;
			battle.challengerDmgDealt += finalDmg;
		}
	}

	t[ids.CURR_HP] = remainingHP;

	if (afflicts)
	{
		//Uses the damage before applying limb caps to calculate afflictions
		result += calcAffliction(dmg, type, hitLoc, t);
	}

	return result;
}

function calcAffliction(dmg, type, hitLoc, t = this)
{
	var chance = Math.floor((dmg / Math.floor(t[ids.MAX_HP])) * afflChanceMultiplier);
	var roll = Math.floor((Math.random() * 100)) + 1;
	var form = t[ids.FORM].findForm();
	var result = "AFFL: ";

	if (chance > afflChanceCap)
	{
		chance = afflChanceCap;
	}

	if (roll > chance)
	{
		return "";
	}

	/*if (hitLoc.includes(ids.HEAD))
	{
		var arr = [ids.MUTE, ids.DEMENTIA, ids.FEEBLEMINDED];
		var nbr = Math.floor((Math.random() * arr.length));
		t[ids.AFFL][arr[nbr]] = 1;
		result += arr[nbr].capitalize() + ". ";
	}

	else*/ if (hitLoc.includes(ids.EYE))
	{
		result += ids.DMGD_EYE().capitalize() + ". ";
		t[ids.AFFL][ids.DMGD_EYE()] = ++t[ids.AFFL][ids.DMGD_EYE()] || 1;
	}

	else if (hitLoc.includes(ids.ARM))
	{
		if (type == ids.SLASH && chance >= severChance)
		{
			loseSlot(ids.HANDS, t);
			result += ids.DMGD_ARM().capitalize() + ". ";
			t[ids.AFFL][ids.DMGD_ARM()] = ++t[ids.AFFL][ids.DMGD_ARM()] || 1;
		}

		else
		{
			result += ids.WEAKENED.capitalize() + ". ";
			t[ids.AFFL][ids.WEAKENED] = 1;
		}
	}

	/*else if (hitLoc.includes(ids.WING))
	{
		if (type == ids.SLASH && chance >= severChance)
		{
			result += ids.DMGD_WING().capitalize() + ". ";
			t[ids.AFFL][ids.DMGD_WING()] = ++t[ids.AFFL][ids.DMGD_WING()] || 1;
		}

		else
		{
			result += ids.TORN_WING().capitalize() + ". ";
			t[ids.AFFL][ids.TORN_WING()] = 1;
		}
	}*/

	else if (hitLoc.includes(ids.LEG))
	{
		if (type == ids.SLASH && chance >= severChance || t[ids.AFFL][ids.LIMP])
		{
			result += ids.CRIPPLED.capitalize() + ". ";
			delete t[ids.AFFL][ids.LIMP];
			t[ids.AFFL][ids.CRIPPLED] = 1;
		}

		else
		{
			result += ids.LIMP.capitalize() + ". ";
			t[ids.AFFL][ids.LIMP] = 1;
		}
	}

	else if (hitLoc.includes(ids.BODY))
	{
		var arr = [ids.DISEASED, ids.CHEST_WOUND, ids.BATTLE_FRIGHT, ids.NEVER_HEAL_WOUND];
		var nbr = Math.floor((Math.random() * arr.length));
		t[ids.AFFL][arr[nbr]] = 1;
		result += arr[nbr].capitalize() + ". ";
	}

	updateAfflictions(t);
	return result;
}

function updateAfflictions(t = this)
{
	var form = t[ids.FORM].findForm();
	var armsLost = getUnusableParts(ids.ARM, t);

	for (var key in t[ids.AFFL])
	{
		if (t[ids.AFFL][key] <= 0)
		{
			delete t[ids.AFFL][key];
			continue;
		}

		if (key.includes(ids.DMGD) && t[ids.AFFL][key] > 1)
		{
			var part = key.slice(8);
			t[ids.AFFL][ids.LOST + " " + part] = ++t[ids.AFFL][ids.LOST + " " + part] || 1;
			delete t[ids.AFFL][key];
		}
	}

	if (form[ids.SLOTS][ids.HANDS] && t[ids.HANDS] && t[ids.HANDS][ids.LOST] && armsLost < t[ids.HANDS][ids.LOST])
	{
		var diff = t[ids.HANDS][ids.LOST] - armsLost;
		t[ids.HANDS][ids.LOST] = armsLost;
		t[ids.HANDS][ids.EMPTY] = t[ids.HANDS][ids.EMPTY] + diff || diff;
		cleanSlots([ids.HANDS], t);
	}
}

function loseSlot(slot, t = this)
{
	for (var key in t[slot])
	{
		if (t[slot][ids.EMPTY] && t[slot][ids.EMPTY] > 0)
		{
			t[slot][ids.EMPTY]--;
			t[slot][ids.LOST] = ++t[slot][ids.LOST] || 1;
			cleanSlots([slot], t);
			return;
		}

		else if (key != ids.LOST && key != ids.USED)
		{
			var item = key.findItem();
			unequipItem(item.id, t);
			t[slot][ids.EMPTY]--;
			t[slot][ids.LOST] = ++t[slot][ids.LOST] || 1;
			cleanSlots([slot], t);
			return;
		}
	}
}

function addFatigue(amnt, t = this)
{
	if (amnt <= 0)
	{
		return "";
	}

	t[ids.STATUS][ids.FAT] += amnt;

	if (t[ids.STATUS][ids.FAT] > 200)	//every fatigue point over 200 is instead a hit point damage
	{
		var dmg = t[ids.STATUS][ids.FAT] - 200;
		t[ids.STATUS][ids.FAT] = 200;

		return "Fatigue is over 200. " + reduceHP(dmg, ids.FAT, ids.BODY, false, t);
	}

	var str = t.name + " takes " + amnt + " fatigue (now at " + t[ids.STATUS][ids.FAT] + "). ";

	if (t[ids.STATUS][ids.FAT] >= 100)
	{
		delete t[ids.PROPS][ids.BERSERK];
		t[ids.STATUS][ids.UNCONSCIOUS] = true;
		str += t.name + " falls unconscious.";
	}

	return str;
}

function reinvigorate(amnt = 0, t = this)
{
	if (t[ids.STATUS][ids.FAT] <= 0)
	{
		t[ids.STATUS][ids.FAT] = 0;
		return "";
	}

	var result = "";
	amnt += getTtlReinvig(t);
	var originalFat = t[ids.STATUS][ids.FAT];

	if (t[ids.STATUS][ids.FAT] >= 100)
	{
		amnt += 5; //Reinvigorate 5 if it's unconscious
	}

	if (amnt != 0)
	{
		t[ids.STATUS][ids.FAT] -= amnt;

		if (t[ids.STATUS][ids.FAT] <= 0)
		{
			t[ids.STATUS][ids.FAT] = 0;
		}

		if (t[ids.STATUS][ids.FAT] < 100 && originalFat >= 100)
		{
			delete t[ids.STATUS][ids.UNCONSCIOUS];
			result += "No longer unconscious. ";
		}

		return t.name + ": -" + amnt + " fatigue (now at " + t[ids.STATUS][ids.FAT] + "). " + result;
	}

	else return "";
}

function getSlotsNbr(slot, t = this)
{
	var total = 0;

	for (var key in t[slot])
	{
		if (key != ids.LOST)
		{
			total += t[slot][key];
		}
	}

	return total;
}

function getWeapons(t = this)
{
	var arr = getEquippedWeapons(t).concat(getIntrinsicWeapons(t));

	if (!arr.length)
	{
		if (t[ids.HANDS] && t[ids.HANDS][ids.EMPTY])
		{
			arr.push("e92".findItem());
		}

		else arr.push("e346".findItem());
	}

	return arr;
}

function getRepelWeapons(atkWpn, t = this)
{
	var arr = [];
	var nextLength = 0;
	//Sort them by longer to lower lengths
	var weapons = getWeapons(t).sort(function(a, b){return b[ids.LENGTH]-a[ids.LENGTH]});

	for (var i = 0; i < weapons.length; i++)
	{
		if (weapons[i][ids.LENGTH] - nextLength <= atkWpn[ids.LENGTH] || weapons[i][ids.CAN_REPEL] == false)
		{
			continue;
		}

		nextLength++;
		arr.push(weapons[i]);
	}

	return arr;
}

function getAttacks(t = this)
{
	var wpns = getWeapons(t);
	var arr = [];

	for (var i = 0; i < wpns.length; i++)
	{
		for (var j = 0; j < wpns[i][ids.NBR_ATKS]; j++)
		{
			arr.push(wpns[i]);
		}
	}

	return arr;
}

function getRepels(atkWpn, t = this)
{
	var wpns = getRepelWeapons(atkWpn, t);
	var arr = [];

	for (var i = 0; i < wpns.length; i++)
	{
		for (var j = 0; j < wpns[i][ids.NBR_ATKS]; j++)
		{
			arr.push(wpns[i]);
		}
	}

	return arr;
}

function getEquippedWeapons(t = this)
{
	var arr = [];

	for (var wpn in t[ids.HANDS])
	{
		var weapon = wpn.findItem();

		//Check the number of attacks to filter out shields or other
		//hand-held items that are not really weapons
		if (weapon == null || weapon[ids.NBR_ATKS] == null)
		{
			continue;
		}

		for (var i = 0; i < t[ids.HANDS][wpn]; i++)
		{
			arr.push(weapon);
		}
	}

	return arr;
}

function getIntrinsicWeapons(t = this)
{
	var arr = [];
	var form = t[ids.FORM].findForm();
	var emptyHands = (t[ids.HANDS] && t[ids.HANDS][ids.EMPTY]) ? t[ids.HANDS][ids.EMPTY] : 0;
	for (var atk in form[ids.ATKS])
	{
		var attack = atk.findItem();
		//If the form's attack is intrinsic (bonus) then it is added regardless of how many empty hands there are
		var amnt = form[ids.ATKS][atk];

		if (attack == null || attack[ids.NBR_ATKS] == null)
		{
			continue;
		}

		var alreadyEquipped = hasEquipped(attack.id);

		//If the character has explicitly equipped all those intrinsics then don't add them again
		if (attack[ids.PROPS][ids.BONUS] == null && alreadyEquipped >= form[ids.ATKS][atk])
		{
			continue;
		}

		//If some are already equipped then reduce the amount of the intrinsics that can be used
		else if (alreadyEquipped > 0)
		{
			amnt -= alreadyEquipped;
		}

		//If the original form has no hands slots then it will always use its intrinsics at full
		if (attack[ids.PROPS][ids.BONUS] == null && form[ids.SLOTS][ids.HANDS] != null)
		{
			//If no free hands at all, no intrinsic used
			if (emptyHands == null || emptyHands <= 0 || amnt <= 0)
			{
				continue;
			}

			//If less empty hands than the number of this intrinsic then use all
			else if (emptyHands < amnt)
			{
				amnt = emptyHands;
				emptyHands = 0;
			}

			//Else use the max amount of intrinsics and subtract it from the emptyHands for the next loop
			else emptyHands -= amnt;
		}

		if (t[ids.MISC]["t1"] && (attack.id == "e322" || attack.id == "e20"))
		{
			attack[ids.DMG_TYPE] = {[ids.PIERCE]: ids.PIERCE};
		}

		for (var i = 0; i < amnt; i++)
		{
			arr.push(attack);
		}
	}

	return arr;
}

function getUnusableParts(bodypart, t = this)
{
	var unusable = (t[ids.AFFL][ids.LOST + " " + bodypart]) ? t[ids.AFFL][ids.LOST + " " + bodypart] : 0;
	unusable += (t[ids.AFFL][ids.DMGD + " " + bodypart]) ? t[ids.AFFL][ids.DMGD + " " + bodypart] : 0;
	return unusable;
}

function getHitLocation(atkReach, t = this)
{
	var form = t[ids.FORM].findForm();
	var arr = [];

  for (var part in t[ids.PARTS])
  {
    var weight = 0;

		weight = t[ids.PARTS][part].area * (form[ids.PARTS][part] - t[ids.PARTS][part][ids.NUMBER]);

    for (var i = 0; i < weight; i++)
    {
      arr.push(part);
    }
  }

  return arr[Math.floor((Math.random() * arr.length))];
}

function getGoldFactor(t = this)
{
	var baseFactor = t[ids.BASE_FACTORS][ids.GOLD];
	var addedFactor = t[ids.FACTORS][ids.GOLD] || 0;
	var share = t[ids.SHARES][ids.GOLD] * 0.01 || 0;

	if (t[ids.CURR_HP] < 0)
	{
		return 0;
	}

	return (((baseFactor + addedFactor) / 60) * share).truncate(decPlaces);
}

function getGemFactor(type, t = this)
{
	var baseFactor = t[ids.BASE_FACTORS][ids.GEMS];
	var addedFactor = t[ids.FACTORS][type] || 0;

	if (t[ids.CURR_HP] < 0 || t[ids.SHARES][type] == null || t[ids.SHARES][type] <= 0)
	{
		return 0;
	}

	return ((baseFactor + addedFactor) / 60).truncate(decPlaces);
}

function getTrainFactor(stat, t = this)
{
	var form = t[ids.FORM].findForm();
	var share = t[ids.SHARES][stat] * 0.01 || 0;
	var baseFactor = t[ids.BASE_FACTORS][ids.TRAIN];
	var addedFactor = t[ids.FACTORS][stat] || 0;
	var total = (((baseFactor + addedFactor) / 60) * share).truncate(decPlaces);

	//Diminishing return from already trained stat
	total = total / Math.floor(1 + (t[stat] - form[stat]));

	if (t[ids.MISC]["t8"])
	{
		total += 0.00004;
	}

	if (t[ids.CURR_HP] < 0)
	{
		return 0;
	}

	return total;
}

function getSharesHealingFactor(t = this)
{
	var baseFactor = t[ids.BASE_FACTORS][ids.HEALING];
	var addedFactor = t[ids.FACTORS][ids.HEALING] || 0;
	var share = (t[ids.SHARES][ids.HEALING] + 50) * 0.01 || 0.5;
	var healing = ((baseFactor + addedFactor) / 100) * getTtlShapeHP(false, false, t);

	if (t[ids.PROPS][ids.REGEN])
	{
		healing += (t[ids.PROPS][ids.REGEN]);
	}

	return ((healing / 60) * share).truncate(decPlaces);
}

function getFinalHealingFactor(t = this)
{
	var baseFactor = t[ids.BASE_FACTORS][ids.HEALING];
	var addedFactor = t[ids.FACTORS][ids.HEALING] || 0;
	var share = (t[ids.SHARES][ids.HEALING] + 50) * 0.01 || 0.5;

	if (t[ids.AFFL][ids.DISEASED] && t[ids.CURR_HP] >= 0)
	{
		baseFactor = 0;
	}

	var healing = ((baseFactor + addedFactor) / 100) * getTtlShapeHP(false, false, t);

	if (t[ids.PROPS][ids.REGEN])
	{
		healing += (t[ids.PROPS][ids.REGEN]);
	}

	if (t[ids.CURR_HP] < 0)
	{
		share = 1;
	}

	return ((healing / 60) * share).truncate(decPlaces);
}

function getRecupFactor(t = this)
{
	var baseFactor = t[ids.BASE_FACTORS][ids.RECUP];
	var addedFactor = t[ids.FACTORS][ids.RECUP] || 0;
	return ((baseFactor + addedFactor) / 60).truncate(decPlaces);
}

function getTtlShapeHP(withAfflictions = false, floored = true, t = this)
{
	var total = t[ids.MAX_HP];

	if (t[ids.PROPS][ids.SECONDSHAPE])
	{
		var secondForm = ("f" + t[ids.PROPS][ids.SECONDSHAPE]).findForm();
		total += secondForm[ids.MAX_HP] + (secondForm.getHPIncrement() * t[ids.HP_INC]);
	}

	else if (t[ids.PROPS][ids.FIRSTSHAPE])
	{
		var originalForm = ("f" + t[ids.PROPS][ids.FIRSTSHAPE]).findForm();
		total += originalForm[ids.MAX_HP] + (originalForm.getHPIncrement() * t[ids.HP_INC]);
	}

	if (t[ids.AFFL] && t[ids.AFFL][ids.NEVER_HEAL_WOUND] && withAfflictions)
	{
		total = Math.floor(total * 0.8);
	}

	if (floored)
	{
		return Math.floor(total);
	}

	else return total;
}

function getTtlHP(floored = true, t = this)
{
	var total = t[ids.MAX_HP];

	if (t[ids.AFFL] && t[ids.AFFL][ids.NEVER_HEAL_WOUND])
	{
		total = Math.floor(total * 0.8);
	}

	if (floored)
	{
		return Math.floor(total);
	}

	else return total;
}

function getTtlProt(part, vsMagic = false, t = this)
{
	var form = t[ids.FORM].findForm();
	var natural = t[ids.PROT][part] || 0;
	var equipped = 0;
	var total = 0;

	for (var slot in form[ids.SLOTS])
	{
		for (var item in t[slot])
		{
			var itemObj = item.findItem();

			if (itemObj && itemObj[ids.PROT])
			{
				equipped += itemObj[ids.PROT][part] || 0;
			}
		}
	}

	if (checkProp(ids.BARKSKIN, t))
	{
		if (t[ids.PROT][part] < 10)
		{
			natural = 10;
		}

		else natural++;
	}

	if (t[ids.PROPS][ids.INVUL] && vsMagic == false && natural < t[ids.PROPS][ids.INVUL])
	{
		natural = t[ids.PROPS][ids.INVUL];
	}

	if (t[ids.STATUS])
	{
		if (t[ids.STATUS][ids.BERSERK])
		{
			total += t[ids.STATUS][ids.BERSERK];
		}
	}

	total += (natural > 0) ? natural + equipped - ((natural * equipped) / 40) : equipped;
	return Math.floor(total);
}

function getTtlShieldProt(t = this)
{
	return Math.floor(getSlotStat(t[ids.HANDS], ids.PROT_SHLD));
}

function getTtlAtt(wpnUsed, floored = true, t = this)
{
	var form = t[ids.FORM].findForm();
	var lostEyes = getUnusableParts(ids.EYE, t);
	var total = 0;

	if (t[ids.STATUS])
	{
		if (t[ids.STATUS][ids.FAT])
		{
			total -= Math.floor(t[ids.STATUS][ids.FAT] / 20).lowerCap(0);
		}

		if (t[ids.STATUS][ids.BERSERK])
		{
			total += t[ids.STATUS][ids.BERSERK];
		}
	}

	if(t[ids.AFFL])
	{
		if (t[ids.AFFL][ids.LIMP])
		{
			total -= 1;
		}

		if (t[ids.AFFL][ids.CRIPPLED])
		{
			total -= 4;
		}

		if (lostEyes >= form[ids.PARTS][ids.EYE])
		{
			total -= 9;
		}

		else if (lostEyes > 0)
		{
			total -= 2;
		}
	}

	if (wpnUsed)
	{
		total += wpnUsed[ids.ATK];
	}

	total += t[ids.ATK] + getSlotStat(t[ids.HEAD], ids.ATK) + getSlotStat(t[ids.BODY], ids.ATK) + getSlotStat(t[ids.MISC], ids.ATK);
	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getDualPen(t = this)
{
	var pen = 0;
	var weapons = getEquippedWeapons(t).filter(function (wpn)
																											{return wpn.isIntrinsic() == false;});
	weapons = weapons.filter(function (wpn)
																		{return wpn[ids.PROPS][ids.BONUS] == null;});

	if (weapons.length == null || weapons.length <= 1)
	{
		return 0;	//a single weapon gives no dual wielding penalty
	}

	for (var i = 0; i < weapons.length; i++)
	{
		pen += weapons[i][ids.LENGTH];
	}

	return (pen - (t[ids.PROPS][ids.AMBIDEXTROUS] || 0)).lowerCap(0);
}

function getTtlDef(floored = true, t = this)
{
	var form = t[ids.FORM].findForm();
	var lostEyes = getUnusableParts(ids.EYE, t);
	var total = 0;

	if (t[ids.STATUS])
	{
		if (t[ids.STATUS][ids.FAT])
		{
			total -= Math.floor(t[ids.STATUS][ids.FAT] / 10).lowerCap(0);
		}

		if (t[ids.STATUS][ids.BERSERK])
		{
			total -= t[ids.STATUS][ids.BERSERK];
		}
	}

	if (t[ids.STATUS] && (t[ids.STATUS][ids.PARALYZED] || t[ids.STATUS][ids.UNCONSCIOUS] || t[ids.STATUS][ids.WEBBED]))
	{
		return 0;
	}

	if (t[ids.AFFL])
	{
		if (t[ids.AFFL][ids.LIMP])
		{
			total -= 1;
		}

		if (t[ids.AFFL][ids.CRIPPLED])
		{
			total -= 4;
		}

		if (lostEyes >= form[ids.PARTS][ids.EYE])
		{
			total -= 9;
		}

		else if (lostEyes > 0)
		{
			total -= 2;
		}
	}

	total += t[ids.DEF] + getSlotStat(t[ids.HANDS], ids.DEF) + getSlotStat(t[ids.HEAD], ids.DEF) + getSlotStat(t[ids.BODY], ids.DEF) + getSlotStat(t[ids.MISC], ids.DEF);
	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getTtlParry(t = this)
{
	return getSlotStat(t[ids.HANDS], ids.PARRY);
}

function getTtlStr(floored = true, t = this)
{
	var total = 0;

	if (t[ids.STATUS])
	{
		if (t[ids.STATUS][ids.BERSERK])
		{
			total += t[ids.STATUS][ids.BERSERK];
		}
	}

	if (t[ids.AFFL])
	{
		if (t[ids.AFFL][ids.CHEST_WOUND])
		{
			total -= 1;
		}

		if (t[ids.AFFL][ids.WEAKENED])
		{
			total -= 4;
		}
	}

	total += t[ids.STR] + getSlotStat(t[ids.HANDS], ids.STR) + getSlotStat(t[ids.HEAD], ids.STR) + getSlotStat(t[ids.BODY], ids.STR) + getSlotStat(t[ids.FEET], ids.STR) + getSlotStat(t[ids.MISC], ids.STR);
	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getTtlMR(floored = true, t = this)
{
	var total = 0;

	if (t[ids.AFFL] && t[ids.AFFL][ids.DEMENTIA])
	{
		total -= 2;
	}

	total += t[ids.MR] + getSlotStat(t[ids.HANDS], ids.MR) + getSlotStat(t[ids.HEAD], ids.MR) + getSlotStat(t[ids.BODY], ids.MR) + getSlotStat(t[ids.MISC], ids.MR);
	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getTtlMor(floored = true, t = this)
{
	var total = 0;

	if (t[ids.STATUS])
	{
		if (t[ids.STATUS][ids.BERSERK])
		{
			return 99;
		}
	}

	if (t[ids.AFFL] && t[ids.AFFL][ids.BATTLE_FRIGHT])
	{
		total -= 5;
	}

	total += t[ids.MRL] + getSlotStat(t[ids.HANDS], ids.MRL) + getSlotStat(t[ids.HEAD], ids.MRL) + getSlotStat(t[ids.BODY], ids.MRL) + getSlotStat(t[ids.MISC], ids.MRL);
	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getTtlPrec(wpnUsed, floored = true, t = this)
{
	var total = 0;
	var form = t[ids.FORM].findForm();
	var lostEyes = getUnusableParts(ids.EYE, t);

	if (t[ids.AFFL])
	{
		if (lostEyes >= form[ids.PARTS][ids.EYE])
		{
			total -= 9;
		}

		else if (lostEyes > 0)
		{
			total -= 3;
		}
	}

	if (wpnUsed)
	{
		total += wpnUsed[ids.PREC];
	}

	total += t[ids.PREC] + getSlotStat(t[ids.MISC], ids.PREC);
	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getTtlEnc(t = this)
{
	var form = t[ids.FORM].findForm();
	var total = 0;

	if (form[ids.ENC] <= 0)
	{
		return 0;
	}

	if (t[ids.STATUS])
	{
		if (t[ids.STATUS][ids.BERSERK])
		{
			total += 2;
		}
	}

	total += (t[ids.AFFL] && t[ids.AFFL][ids.CHEST_WOUND]) ? 5 : 0;
	return total += t[ids.ENC] + getSlotStat(t[ids.HANDS], ids.ENC) + getSlotStat(t[ids.HEAD], ids.ENC) + getSlotStat(t[ids.BODY], ids.ENC) + getSlotStat(t[ids.FEET], ids.ENC) + getSlotStat(t[ids.MISC], ids.ENC);
}

function getTtlPath(path, floored = true, t = this)
{
	var total = t[ids.PATHS][path] || 0;
	var form = t[ids.FORM].findForm();

	if (form[ids.PATHS][path])
	{
		total += form[ids.PATHS][path] * 0.5;
	}

	if (t[ids.AFFL])
	{
		var tempTtl = total;

		if (t[ids.AFFL][ids.DEMENTIA])
		{
			tempTtl -= total * 0.5;
		}

		if (t[ids.AFFL][ids.MUTE])
		{
			tempTtl -= total * 0.5;
		}

		if (t[ids.AFFL][ids.FEEBLEMINDED])
		{
			tempTtl = 0;
		}

		total = tempTtl;
	}

	total = (floored) ? Math.floor(total) : total;
	return total;
}

function getTtlReinvig(t = this)
{
	var total = t[ids.PROPS][ids.REINVIG] || 0;

	total += getSlotStat(t[ids.HANDS], ids.REINVIG) + getSlotStat(t[ids.HEAD], ids.REINVIG) +
					 getSlotStat(t[ids.BODY], ids.REINVIG) + getSlotStat(t[ids.FEET], ids.REINVIG) +
					 getSlotStat(t[ids.MISC], ids.REINVIG);

	return 	total;
}

function getTtlRes(type, t = this)
{
	var res = "RES_" + type.toUpperCase();

	if (ids[res] == null)
	{
		return 0;
	}

	var total = (t[ids.PROPS][ids[res]()] != null) ? t[ids.PROPS][ids[res]()] : 0;

	total += getSlotStat(t[ids.HANDS], ids[res]()) + getSlotStat(t[ids.HEAD], ids[res]()) +
					 getSlotStat(t[ids.BODY], ids[res]()) + getSlotStat(t[ids.FEET], ids[res]()) +
					 getSlotStat(t[ids.MISC], ids[res]());

	return 	total;
}

function checkProp(prop, t = this)
{
	var carriedSlots = {[ids.HANDS]: t[ids.HANDS], [ids.HEAD]: t[ids.HEAD],
											[ids.BODY]: t[ids.BODY], [ids.FEET]: t[ids.FEET],
											[ids.MISC]: t[ids.MISC]};

	for (var slot in carriedSlots)
	{
		for (var key in carriedSlots[slot])
		{
			var item = key.findItem();

			if (item == null)
			{
				continue;
			}

			if (item[ids.PROPS] && item[ids.PROPS][prop])
			{
				return true;
			}
		}
	}

	return false;
}

function printPaths(t = this)
{
	var str = "";

	for (var p in t[ids.PATHS])
	{
		var val = getTtlPath(p, false, t);

		if (val <= 0)
		{
			continue;
		}

		else
		{
			str += p + ": " + t[ids.PATHS][p] + ", ";
		}
	}

	return str.slice(0, str.length - 2);
}

function nextLvlXP(t = this)
{
	var xpReq = Math.pow((t[ids.LVL] + 1) * baseXP, expInc);
	return Math.round(xpReq / nearestXP) * nearestXP;
}

function nextLvlPointCost(stat, formStat, t = this)
{
	return Math.floor((stat - formStat) / 4) + 1;
}

function freeUsedSlot(item, amount, character)
{
	character[item[ids.SLOT]][item.id] -= amount;
	character[item[ids.SLOT]][ids.EMPTY] = character[item[ids.SLOT]][ids.EMPTY] + item[ids.REQ_SLOTS] * amount || item[ids.REQ_SLOTS] * amount;
	character[item[ids.SLOT]][ids.USED] = character[item[ids.SLOT]][ids.USED] - (item[ids.REQ_SLOTS] - 1) * amount || 0;
	cleanSlots([item[ids.SLOT]], character);
}

//Get the stat in a member's slot, which could be an array or not
//Hence the need for the function. Uses getStat as auxiliary
function getSlotStat(slot, stat)
{
	if (slot != undefined)
	{
		var total = 0;
		for (var item in slot)
		{
			if (item != ids.EMPTY && item != ids.USED && item != ids.LOST)
			{
				if (stat == ids.DEF || stat == ids.PARRY)
				{
					//In the case of defence, stack the bonuses for multiple identical items
					total += getStat(item, stat) * slot[item];
				}

				else total += getStat(item, stat);
			}
		}

		return total;
	}

	else return 0;
}

//Get the value of a stat within an item/slot
//Done to assist getSlotStat
function getStat(input, stat)
{
	var item = input.findItem();

	if (item)
	{
		if (item[stat])
		{
			return item[stat];
		}

		else if (item[ids.PROPS][stat] || item[ids.PROPS][ids.ENHANCE + " " + stat])
		{
			return item[ids.PROPS][stat] || item[ids.PROPS][ids.ENHANCE + " " + stat];
		}

		else return 0;
	}

	else return 0;
}
