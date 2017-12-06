const ids = require("../../MrHound/Current/ids.js");
const dice = require("../../MrHound/Current/dice.js");
const event = require("../../MrHound/Current/emitter.js");
const rw = require("../../MrHound/Current/reader_writer.js");
const encounters = require("../../MrHound/Current/encounters.js");

var limbDmgCap = 0.5;
var etherealChance = 75;

//The area determines how big a chance it adds to it being hit,
//and the height is subtracted from the character's size to see
//if it's reachable by an attacker
var partSizes = {	[ids.HEAD]: {area: 4, height: 0},
									[ids.EYE]: {area: 1, height: 0},
									[ids.BODY]: {area: 10, height: -1},
									[ids.ARM]: {area: 4, height: -2},
									[ids.LEG]: {area: 4, height: -6},
									[ids.WING]: {area: 3, height: 0}	};

module.exports =
{
	combatTest: function(challenger, offender, times = 1, returnStr = false)
	{
		var result = "";
		var wins = {challenger: 0, offender: 0, draw: 0};
		var challengerXP = 0;
		var offenderXP = 0;

		for (var i = 0; i < times; i++)
		{
			encounters.createBattle("spar", challenger, offender);
			var battle = encounters.ongoing[challenger.id];

			while (battle.status != "ended")
			{
				if (battle.turnID == battle.challenger.id)
				{
					var res = resolveRound(battle.challenger, battle.offender, "attack", battle);
					result += (returnStr) ? res : "";
					battle.turnID = battle.offender.id;
					battle.turnNbr++;
				}

				else
				{
					var res = resolveRound(battle.offender, battle.challenger, "attack", battle);
					result += (returnStr) ? res : "";
					battle.turnID = battle.challenger.id;
				}
			}

			if (battle.winner == challenger.id)
			{
				wins.challenger++;
			}

			else if (battle.winner == offender.id)
			{
				wins.offender++;
			}

			else wins.draw++;

			challengerXP += battle.challengerXP;
			offenderXP += battle.offenderXP;
			delete battle.challenger;
			delete battle.offender;
			delete encounters.ongoing[challenger.id];
			delete encounters.ongoing[offender.id];
		}

		rw.log("\nChallenger wins: " + wins.challenger + "\nOffender wins: " + wins.offender + "\nDraws: " + wins.draw);
		return result.replace(/\`\`\`\`\`\`/g, "\n");
	},

	//Takes a GuildMember object
	giftsFromHeaven: function(message, victim)
	{
		if (victim.roles.has(ids.BOT_ID))
		{
			message.reply ("How DARE you try to make me hurt myself?! You shall suffer the consequences, fool!");
			message.channel.send("?GiftsFromHeaven " + message.author);
			return;
		}

		//The TextChannel class has the members property, which specifically contains the members that can SEE the channel.
		//We also filter it by the CheckOnline function which returns only those elements whose .presence property does NOT show offline
		var channelUsers = message.channel.members.array();

		//Find the position within the array of members online
		var victimPos = channelUsers.indexOf(victim);

		//The array that will contain all of the hit members
		var hit = [];

		if (channelUsers.length < 2)
		{
			hit = [victim.user.username];
		}

		else if (victimPos == 0)
		{
			hit = [victim.user.username, channelUsers[victimPos + 1].user.username];
		}

		//Last element of the array
		else if (victimPos == channelUsers.length - 1)
		{
			hit = [victim.user.username, channelUsers[victimPos - 1].user.username];
		}

		else
		{
			hit = [victim.user.username, channelUsers[victimPos - 1].user.username, channelUsers[victimPos + 1].user.username];
		}

		var msg = "A strange whizzing sound emanates from the heavens... The land is crushed under a meteor glowing with astral fire!\n";

		for (var i = 0; i < hit.length; i++)
		{
			var damage = 150 + dice.DRN();

			msg += "\n" + hit[i] + " suffers " + damage + " blunt damage!";
		}

		message.channel.sendCode(null, msg);
	},

	//Takes a GuildMember object
	smite: function(message, victim)
	{
		if (victim.roles.has(ids.BOT_ID))
		{
			message.reply ("How DARE you try to make me hurt myself?! You shall suffer the consequences, fool!");
			message.channel.send("?Smite " + message.author);
			return;
		}

		var dmg = 20 + dice.DRN();
		var msg = victim.user.username + " is smitten by holy fire! " + dmg + " damage!";

		message.channel.sendCode(null, msg);
	},

	challenge: function (type, author, receiver)
	{
		//This is the target of the challenge responding!!
		if (encounters.challenges[receiver.id] && encounters.challenges[receiver.id][author.id])
		{
			var acceptStr;

			encounters.acceptChallenge(type, receiver, author);
			acceptStr = author.name + " (" + author[ids.FORM].findForm().name.capitalize() + ", level " + author[ids.LVL] + ") " +
											"accepted " + receiver.name + "'s (" + receiver[ids.FORM].findForm().name.capitalize() + ", level " + receiver[ids.LVL] + ") " +
											encounters.ongoing[author.id].mode + " offer! The receiver of the challenge gets the first action.";

			if (encounters.ongoing[receiver.id].exposure == "private")
			{
				acceptStr += " Since other ongoing are already ongoing, I will be sending the command results to both of you in private (but keep typing the commands in this channel).";
			}

			return acceptStr;
		}

		else
		{
			encounters.createChallenge(type, author, receiver);

			return author.name + " (" + author[ids.FORM].findForm().name.capitalize() + ", level " + author[ids.LVL] + ") " +
						" challenged " + receiver.name + "'s (" + receiver[ids.FORM].findForm().name.capitalize() + ", level " + receiver[ids.LVL] + ") " +
						" to a " + type + ". Type `?" + type + "` and a mention to the challenger to accept the offer.";
		}
	},

	combat: function(action, actor, target)
	{
		var result = "";
		var battle;

		if (encounters.ongoing[actor.id] == null)
		{
			encounters.createBattle("simulation", actor, target);
		}

		battle = encounters.ongoing[actor.id];

		if ((actor.id !== battle.challenger.id && actor.id !== battle.offender.id) ||
				(target.id !== battle.challenger.id && target.id !== battle.offender.id))
		{
			delete encounters.ongoing[actor.id]; delete encounters.ongoing[target.id];
			return "Something is wrong. At least one of the contenders in this battle is not the correct character. I am cancelling it.";
		}

		result += battle.mode.capitalize() + " (" + battle.challenger.name + " vs. " + battle.offender.name + ")\n";

		if (actor.id == battle.challenger.id)
		{
			result += resolveRound(battle.challenger, battle.offender, action, battle);
		}

		else result += resolveRound(battle.offender, battle.challenger, action, battle);

		if (battle.status == "ended" && battle.mode != "simulation")
		{
			delete battle.challenger;
			delete battle.offender;
			delete encounters.ongoing[actor.id];
			delete encounters.ongoing[target.id];
			event.e.emit("save", [actor.id, target.id]);
			return result;
		}

		else if (battle.mode == "simulation")
		{
			delete battle.challenger;
			delete battle.offender;
			delete encounters.ongoing[actor.id];
			delete encounters.ongoing[target.id];
			return result;
		}

		else
		{
			result += battle.updateTurn();
			return result;
		}
	},
}

/**********************************************************************************************************************
**********************************************END OF EXPOSURE**********************************************************
***********************************************************************************************************************/

function resolveRound(actor, target, action, battle)
{
	var result = "";

	if (actor[ids.PROPS][ids.REGEN])
	{
		result += ("Regeneration. " + actor.heal(actor[ids.PROPS][ids.REGEN])).toBox();
	}

	if (target[ids.PROPS][ids.HEAT_AURA])
	{
		var heatWpn = {[ids.DMG]: 3, [ids.PROPS]: {[ids.STUN]: true}};
		var moddedDmg = applyResistances(heatWpn, ids.FIRE, actor);

		if (moddedDmg > 0)
		{
			result += ("Heat stroke. " + actor.applyDmg(moddedDmg, ids.FIRE, ids.BODY, true)).toBox();
		}
	}

	if (target[ids.PROPS][ids.COLD_AURA])
	{
		var coldWpn = {[ids.DMG]: 3, [ids.PROPS]: {[ids.STUN]: true}};
		var moddedDmg = applyResistances(coldWpn, ids.COLD, actor);

		if (moddedDmg > 0)
		{
			result += ("Extreme cold. " + actor.applyDmg(applyResistances(coldWpn, ids.COLD, actor), ids.COLD, ids.BODY, true)).toBox();
		}
	}

	if (actor[ids.STATUS][ids.POISONED])
	{
		result += actor.tickPoison().toBox();
	}

	if (actor[ids.STATUS][ids.ON_FIRE])
	{
		result += actor.tickFire().toBox();
	}

	if (actor[ids.STATUS][ids.FREEZING])
	{
		result += actor.tickCold().toBox();
	}

	if (actor[ids.STATUS][ids.UNCONSCIOUS])
	{
		if (actor[ids.STATUS][ids.FAT] - 5 - actor.getTtlReinvig() >= 100)
		{
			return (actor.name + " is still unconscious.").toBox() + actor.reinvigorate().toBox() + endRound(actor) + checkIfDead(actor, target, battle);
		}
	}

	if (actor[ids.STATUS][ids.PARALYZED])
	{
		return actor.tickParalysis().toBox() + actor.reinvigorate().toBox() + endRound(actor) + checkIfDead(actor, target, battle);
	}

	if (actor[ids.STATUS][ids.WEBBED])
	{
		return actor.escapeWeb().toBox() + actor.reinvigorate().toBox() + actor.addFatigue(actor.getTtlEnc()).toBox() + endRound(actor) + checkIfDead(actor, target, battle);
	}

	if (action == "attack")
	{
		if (target[ids.PROPS][ids.AWE])
		{
			var moraleRoll = dice.DRN() + actor.getTtlMor(true);
			var difficulty = dice.DRN() + 10 + target[ids.PROPS][ids.AWE];

			if (moraleRoll <= difficulty)
			{
				return (actor.name + " is awe-struck (MRL Roll " + moraleRoll + " vs " + difficulty + ").").toBox() + actor.reinvigorate().toBox() + endRound(actor) + checkIfDead(actor, target, battle);
			}

			else result += (actor.name + " overcomes the awe (MRL Roll " + moraleRoll + " vs " + difficulty + ").").toBox();
		}

		result += actor.reinvigorate().toBox() + attacks(getAttacks(actor.getWeapons()), actor, target, battle) + actor.addFatigue(actor.getTtlEnc()).toBox();
	}

	var endRoundRes = endRound(actor);

	if (endRoundRes.length)
	{
		result += endRoundRes;
	}

	var deadCheckRes = checkIfDead(actor, target, battle);

	if (deadCheckRes.length)
	{
		result += deadCheckRes;
	}

	return result;
}

function endRound(actor)
{
	var result = "";

	return result;
}

function checkIfDead(actor, target, battle)
{
	var result = "";
	var isFinished = false;

	if (actor[ids.CURR_HP] <= 0)
	{
		if (actor[ids.PROPS][ids.SECONDSHAPE])
		{
			result += actor.changeShape(actor[ids.PROPS][ids.SECONDSHAPE], Math.abs(actor[ids.CURR_HP])).toBox() + checkIfDead(actor, target, battle);
		}

		else isFinished = true;
	}

	if (target[ids.CURR_HP] <= 0)
	{
		if (target[ids.PROPS][ids.SECONDSHAPE])
		{
			result += target.changeShape(target[ids.PROPS][ids.SECONDSHAPE], Math.abs(target[ids.CURR_HP])).toBox() + checkIfDead(actor, target, battle);
		}

		else isFinished = true;
	}

	if (isFinished)
	{
		return result += battle.endEncounter();
	}

	else
	{
		return result;
	}
}

function attacks(attempts, atckr, dfndr, battle)
{
	var result = "";
	var attackCount = {nbr: 0};
	var repelCount = {nbr: 0};

	for (var i = 0; i < attempts.length; i++)
	{
		var atkStr = "";
		var weapon = attempts[i];

		var verify = verifyArc(weapon, atckr, dfndr);
		atkStr += verify.descr;

		if (verify.success == false)
		{
			result += atkStr.toBox();
			continue;
		}

		if (weapon.isNotEffect())
		{
			attackCount.nbr++;

			if (dfndr[ids.STATUS][ids.UNCONSCIOUS] == null && dfndr[ids.STATUS][ids.PARALYZED] == null && dfndr[ids.STATUS][ids.WEBBED] == null)
			{
				var repelResults = repels(dfndr.getRepelWeapons(weapon), dfndr, atckr, repelCount);
				atkStr += repelResults.descr;

				if (repelResults.wasRepelled == true)
				{
					result += atkStr.toBox();
					continue;
				}

				else if (atckr[ids.CURR_HP] <= 0 && battle.mode != "simulation")
				{
					result += atkStr.toBox();
					break;
				}
			}

			var hit = hitArc(weapon, atckr, dfndr, attackCount, repelCount, battle);
			atkStr += hit.descr;

			if (hit.success == false)
			{
				result += atkStr.toBox();
				continue;
			}
		}

		if (weapon[ids.ON_HIT] && weapon[ids.ON_HIT] !== "none")
		{
			//Add to the attack attempts array the on_hit effect of this weapon in the following index
			attempts.splice(i + 1, 0, weapon.getOnHitEffect());
		}

		if (weapon.isNotEffect() && dfndr[ids.PROPS][ids.FIRE_SHLD] && weapon[ids.LENGTH] < dfndr[ids.PROPS][ids.FIRE_SHLD])
		{
			var fireshld = (ids.FIRE_SHLD).findItem();
			fireshld[ids.DMG] = dfndr[ids.PROPS][ids.FIRE_SHLD] - weapon[ids.LENGTH];
			var shldDmg = damageArc(fireshld, dfndr, atckr, false);
			atkStr += shldDmg.descr + "\n";
		}

		var affect = affectArc(weapon, atckr, dfndr);
		atkStr += affect.descr;

		if (affect.success == false)
		{
			result += atkStr.toBox();
			continue;
		}

		if (weapon.isNotEffect() && dfndr[ids.PROPS][ids.POISON_BARBS] && weapon[ids.LENGTH] <= 1)
		{
			var barbs = (ids.POISON_BARBS).findItem();
			var barbsDmg = damageArc(barbs, dfndr, atckr, false);
			atkStr += barbsDmg.descr + "\n";
		}

		if (weapon.isNotEffect() && dfndr[ids.PROPS][ids.POISON_SKIN] && weapon[ids.LENGTH] <= 0)
		{
			var skin = (ids.POISON_BARBS).findItem();
			var skinDmg = damageArc(skin, dfndr, atckr, false);
			atkStr += skinDmg.descr + "\n";
		}

		var isShieldHit = (hit) ? hit.isShieldHit : false;
		var damage = damageArc(weapon, atckr, dfndr, isShieldHit);
		atkStr += damage.descr;

		if (damage.success == true && weapon[ids.ON_DMG] && weapon[ids.ON_DMG] !== "none")
		{
			//Add to the attack attempts array the on_dmg effect of this weapon in the following index
			attempts.splice(i + 1, 0, weapon.getOnDmgEffect());
		}

		if (dfndr[ids.CURR_HP] <= 0 || atckr[ids.STATUS][ids.FAT] >= 100)
		{
			result += atkStr.toBox();
			break;
		}

		result += atkStr.toBox();
	}

	return result;
}

function repels(attempts, rpler, atckr, count)
{
	var result = {descr: "", wasRepelled: false};

	for (var i = 0; i < attempts.length; i++)
	{
		count.nbr++;
		var weapon = attempts[i];
		var attackResult = attack(weapon, rpler, atckr, count.nbr, true);
		result.descr += attackResult.descr;

		if (attackResult.diff <= 0)
		{
			continue;
		}

		if (atckr[ids.PROPS][ids.DISPLACEMENT])
		{
			if (Math.floor((Math.random() * 100)) + 1 <= atckr[ids.PROPS][ids.DISPLACEMENT])
			{
				result.descr += "Displacement negates. ";
				continue;
			}
		}

		if (atckr[ids.PROPS][ids.ETHEREAL] && weapon[ids.PROPS][ids.MAGIC] == null)
		{
			if (Math.floor((Math.random() * 100)) + 1 <= etherealChance)
			{
				result.descr += "Ethereal negates. ";
				continue;
			}
		}

		repelResult = repel(rpler, atckr, attackResult.diff);
		result.descr += repelResult.descr;

		//Attack aborted
		if (repelResult.diff <= 0)
		{
			result.wasRepelled = true;
			break;
		}

		var damageCalc = calcDmg(weapon, rpler, atckr, attackResult.isShieldHit, true);
		result.descr += atckr.reduceHP(damageCalc.amnt, damageCalc.type, damageCalc.hitLoc);
	}

	return result;
}

function attack(weapon, atckr, dfndr, attackNbr, isRepel = false)
{
	var parry = dfndr.getTtlParry();
	var dualPen = (weapon[ids.PROPS][ids.BONUS] == null) ? atckr.getDualPen() : 0;
	var multiplePen = (attackNbr - 1) * 2;
	var attackRoll = (isRepel) ? atckr.getTtlAtt(weapon) - dualPen - multiplePen + dice.DRN() : atckr.getTtlAtt(weapon) - dualPen + dice.DRN();
	var defenceRoll = (isRepel) ? dfndr.getTtlDef() + dice.DRN() : dfndr.getTtlDef() - multiplePen + dice.DRN();

	var actionType = (isRepel) ? "RPL" : "ATK"
	var description = rollDescr("\n" + actionType + " (w. " + weapon.name.capitalize() + ") ", attackRoll, defenceRoll + " (" + (defenceRoll + parry) + ")", " DEF");
	var result = {descr: description, diff: attackRoll - defenceRoll, isShieldHit: false};

	if (dualPen != 0)
	{
		result.descr += (isRepel) ? "-" + dualPen + " RPL multi-wielding. " : "-" + dualPen + " ATK multi-wielding. ";
	}

	if (multiplePen != 0)
	{
		result.descr += (isRepel) ? "-" + multiplePen + " RPL. " : "-" + multiplePen + " DEF. ";
	}

	if (result.diff - parry > 0)
	{
		result.descr += "Hit. ";
	}

	else if (parry > 0 && weapon[ids.PROPS][ids.FLAIL] && (result.diff + 2) - parry > 0)
	{
		result.diff += 2;
		result.descr += "Hit. (+2 vs shields) ";
	}

	else if (result.diff > 0)
	{
		result.isShieldHit = true;
		result.descr += "Shield hit. ";
	}

	else
	{
		result.descr += "Miss. ";
	}

	return result;
}

function repel(rpler, atckr, hitDiff)
{
	var moraleRoll = atckr.getTtlMor() + dice.DRN() + (atckr[ids.SIZE] - rpler[ids.SIZE]);
	var threatRoll = Math.floor(10 + hitDiff / 2) + dice.DRN();

	var description = rollDescr("\nMRL (" + atckr.name + ") ", moraleRoll, threatRoll, " THRT");
	var result = {diff: moraleRoll - threatRoll, descr: description};

	result.descr += (result.diff > 0) ? "ATK continues. " : "ATK stopped. ";

	return result;
}

function checkMR(weapon, dfndr)
{
	var description = "";
	var pen = dice.DRN() + 10;
	var mr = dice.DRN() + dfndr.getTtlMR();
	var difference = pen - mr;
	description += rollDescr("\nPEN (w. " + weapon.name + ") ", pen, mr, " MR");

	if (difference > 0)
	{
		description += "Effect goes through. ";
	}

	else description += "Negated. ";
	return {descr: description, diff: difference};
}

function verifyArc(weapon, atckr, dfndr)
{
	var result = {descr: "", success: false};

	if ((weapon[ids.PROPS][ids.REQ_LIFE] && dfndr[ids.PROPS][ids.LIFELESS]) ||
			(weapon[ids.PROPS][ids.REQ_MIND] && dfndr[ids.PROPS][ids.MINDLESS]))
	{
		result.descr += weapon.name + " failed.";
		return result;
	}

	if (weapon[ids.PROPS][ids.RELOAD])
	{
		if (atckr[ids.STATUS][ids.RELOAD] && atckr[ids.STATUS][ids.RELOAD][weapon.id] !== undefined)
		{
			atckr[ids.STATUS][ids.RELOAD][weapon.id]++;

			if (atckr[ids.STATUS][ids.RELOAD][weapon.id] >= weapon[ids.PROPS][ids.RELOAD])
			{
				delete atckr[ids.STATUS][ids.RELOAD][weapon.id];
			}

			result.descr += weapon.name + " is reloading.";
			return result;
		}

		else
		{
			if (atckr[ids.STATUS][ids.RELOAD] == null)
			{
				atckr[ids.STATUS][ids.RELOAD] = {[weapon.id]: 0};
			}

			else atckr[ids.STATUS][ids.RELOAD][weapon.id] = 0;
		}
	}

	result.success = true;
	return result;
}

function repelArc(weapon, rpler, atckr, repelCount, battle)
{
	var result = {descr: "", success: false};
	var attempts = rpler.getRepelWeapons(weapon);

	if (weapon.isNotEffect() == false || weapon[ids.PROPS][ids.UNREPELLED] || !attempts.length ||
		  rpler[ids.STATUS][ids.UNCONSCIOUS] || rpler[ids.STATUS][ids.PARALYZED] || rpler[ids.STATUS][ids.WEBBED])
	{
		return result;
	}

	for (var i = 0; i < attempts.length; i++)
	{
		var rplStr = "";
		var verify = verifyArc(weapon, rpler, atckr);
		rplStr += verify.descr;

		if (verify.success == false)
		{
			result += rplStr;
			continue;
		}

		repelCount.nbr++;
		var hit = hitArc(weapon, rpler, atckr, {nbr: 0}, battle);
		rplStr += hit.descr;

		if (hit.success == false)
		{
			result.descr += rplStr;
			continue;
		}

		var affect = affectArc(weapon, rpler, atckr);
		rplStr += affect.descr;

		if (affect.success == false)
		{
			result.descr += rplStr;
			continue;
		}

		var repelResult = repel(rpler, atckr, hit.diff);
		rplStr += repelResult.descr;

		//Attack aborted
		if (repelResult.diff <= 0)
		{
			result.descr += rplStr;
			return result;
		}

		var isShieldHit = (hit) ? hit.isShieldHit : false;
		var damage = damageArc(weapon, rpler, atckr, isShieldHit, true);
		rplStr += damage.descr;

		if (atckr[ids.CURR_HP] <= 0 || rpler[ids.STATUS][ids.FAT] >= 100)
		{
			result += rplStr;
			break;
		}

		result += rplStr;
	}

	result.success = true;
	return result;
}

function hitArc(weapon, atckr, dfndr, attackCount, battle)
{
	var result = {descr: "", success: false, diff: 0, isShieldHit: false};

	//If the next attempt is an effect and not a weapon, it won't need to do any hit rolls, nor will be repelled
	if (weapon.isNotEffect())
	{
		if (weapon[ids.PROPS][ids.ONCE])
		{
			if (battle.mode == "duel")
			{
				atckr.unequipItem(weapon.id);
			}

			else atckr.dropItem(weapon.id);
		}

		var attackResult = attack(weapon, atckr, dfndr, attackCount.nbr);
		result.descr += attackResult.descr;
		result.diff = attackResult.diff;
		result.isShieldHit = attackResult.isShieldHit;

		//Miss
		if (attackResult.diff <= 0)
		{
			result.descr = result.descr;
			return result;
		}

		if (dfndr[ids.STATUS][ids.GLAMOUR])
		{
			if (Math.floor((Math.random() * 100)) + 1 > 100 / (1 + dfndr[ids.STATUS][ids.GLAMOUR]))
			{
				result.descr = (result.descr + "The target hit was an illusion. ");
				dfndr[ids.STATUS][ids.GLAMOUR]--;

				if (dfndr[ids.STATUS][ids.GLAMOUR] <= 0)
				{
					delete dfndr[ids.STATUS][ids.GLAMOUR];
					result.descr += "All images have been dispelled. ";
				}

				return result;
			}
		}

		if (dfndr[ids.PROPS][ids.DISPLACEMENT])
		{
			if (Math.floor((Math.random() * 100)) + 1 <= dfndr[ids.PROPS][ids.DISPLACEMENT])
			{
				result.descr = (result.descr + "Displacement negated the attack. ");
				return result;
			}
		}
	}

	result.success = true;
	return result;
}

function affectArc(weapon, atckr, dfndr)
{
	var result = {descr: "", success: false};

	if (dfndr[ids.PROPS][ids.ETHEREAL] && weapon[ids.PROPS][ids.MAGIC] == null)
	{
		if (Math.floor((Math.random() * 100)) + 1 <= etherealChance)
		{
			result.descr = "Ethereal negated the attack. ";
			return result;
		}
	}

	if (weapon[ids.PROPS][ids.MRN])
	{
		var MRresult = checkMR(weapon, dfndr);
		result.descr += MRresult.descr;

		if (MRresult.diff <= 0)
		{
			return result;
		}
	}

	result.success = true;
	return result;
}

function damageArc(weapon, atckr, dfndr, isShieldHit, isRepel = false)
{
	var result = {descr: "", success: false};
	var damageCalc = calcDmg(weapon, atckr, dfndr, isShieldHit, isRepel);
	var isStun = (weapon[ids.PROPS][ids.STUN]) ? true : false;

	//Add a separation line after the damage roll to display the end results below
	if (damageCalc.descr !== "")
	{
		result.descr += damageCalc.descr + "\n" + "".width(80, false, "—") + "\n";
	}

	if (damageCalc.amnt > 0)
	{
		if (dfndr[ids.STATUS][ids.TWIST_FATE])
		{
			delete dfndr[ids.STATUS][ids.TWIST_FATE];
			result.descr += "Twist Fate negated the damage. ";
			return result;
		}

		result.success = true;
		result.descr += dfndr.applyDmg(damageCalc.amnt, damageCalc.type, damageCalc.hitLoc, isStun);

		if (damageCalc.type.includes("drain"))
		{
			result.descr += atckr.drain(damageCalc.amnt, damageCalc.type);
		}
	}

	return result;
}

function calcDmg (weapon, atckr, dfndr, isShieldHit, isRepel = false)
{
	var hitLocation = getHitLocation(weapon.length, atckr[ids.SIZE], dfndr);
	var dmgType = weapon.pickDmgType();
	var dmgScore = getDmgScore(weapon, dmgType, isShieldHit, atckr, dfndr);
	var dmgRoll = (dmgType != ids.POISON) ? dice.DRN() + dmgScore : dmgScore;

	var protRoll = (dfndr[ids.STATUS][ids.FAT] >= 50) ? dice.DRN() - 1 : dice.DRN();
	var protectionCalc = calcProt(protRoll, weapon, dfndr, hitLocation, dmgType);

	var diff = dmgRoll - protectionCalc.amnt;
	var result = {amnt: diff, type: dmgType, hitLoc: hitLocation, descr: ""};
	var description = rollDescr("\nDMG (w. " + weapon.name.capitalize() + ") ", dmgRoll, protectionCalc.amnt, " PRT");

	if (dmgType == "web")
	{
		result.amnt = atckr[ids.SIZE];
		return result;
	}

	if (dmgScore <= 0)
	{
		result.amnt = 0;
		return result;
	}

	if (isRepel && diff > 0)
	{
		result.amnt = 1;
		return result;
	}

	if (weapon[ids.PROPS][ids.CAPPED] && diff > 0)
	{
		result.amnt = 1;
		result.descr += description + result.amnt + " " + dmgType + " DMG (" + hitLocation + "). ";
		return result;
	}

	if (diff > 0)
	{
		var isStun = (weapon[ids.PROPS][ids.STUN]) ? true : false;
		modifiedDmg = modDmg(dfndr, diff, dmgType, hitLocation, isStun);
		result.amnt = modifiedDmg.amnt;
		result.descr += description + protectionCalc.descr + modifiedDmg.descr + result.amnt + " " + dmgType + " DMG (" + hitLocation + "). ";
		return result;
	}

	else
	{
		result.descr += description + protectionCalc.descr + "No DMG.";
		return result
	}
}

function getDmgScore(weapon, dmgTypeApplied, isShieldHit, atckr, dfndr)
{
	var total = applyResistances(weapon, dmgTypeApplied, dfndr);

	if (isShieldHit && weapon[ids.PROPS][ids.AN] == null && weapon[ids.PROPS][ids.NO_SHIELDS] == null)
	{
		var shieldProt = dfndr.getTtlShieldProt();
		total -= (weapon[ids.PROPS][ids.AP] == null) ? shieldProt : Math.floor(shieldProt * 0.5);
	}

	if (weapon[ids.PROPS][ids.NO_STR] == null)
	{
		total += atckr.getTtlStr();
	}

	return total.lowerCap(0);
}

function applyResistances(weapon, dmgType, victim)
{
	var res = victim.getTtlRes(dmgType);

	if (res != null && isNaN(res) == false)
	{
		var finalRes = (weapon[ids.PROPS][ids.STUN]) ? res * 2 : res;
		return weapon[ids.DMG] - finalRes;
	}

	else return weapon[ids.DMG];
}

function calcProt (roll, weapon, dfndr, hitLoc, dmgType)
{
	var result = {amnt: 0, descr: ""};
	var isMagicWpn = (weapon[ids.PROPS][ids.MAGIC]) ? true : false;
	result.amnt += dfndr.getTtlProt(hitLoc, isMagicWpn);

	if (weapon[ids.PROPS][ids.AN])
	{
		result.amnt = 0;
		return result;
	}

	if (dmgType == ids.PIERCE)
	{
		result.amnt = Math.floor(result.amnt * 0.8);
		result.descr += "-20% PRT. ";
	}

	if (weapon[ids.PROPS][ids.AP])
	{
		result.amnt = Math.floor(result.amnt * 0.5);
		result.descr += "AP -50% PRT. ";
	}

	if (isCritical(dfndr, roll))	//A critical reduces protection by half after the rest of the calculations on it are done
	{
		result.amnt = Math.floor(result.amnt/2);
		result.descr += "CRIT, -50% final PRT. ";
	}

	result.amnt += roll;
	return result;
}

function modDmg(victim, damage, dmgType, hitLoc, isStun = false)
{
	var result = {amnt: damage, descr: ""};
	var maxLimbDmg = Math.floor(victim[ids.MAX_HP] * 0.5).lowerCap(1);

	if (dmgType == ids.BLUNT && (hitLoc.includes(ids.HEAD) || hitLoc.includes(ids.EYE)))
	{
		result.amnt = Math.floor(damage * 1.5);
		result.descr += "+50% DMG. ";
	}

	else if (dmgType == ids.SLASH)
	{
		result.amnt = Math.floor(damage * 1.25);
		result.descr += "+25% DMG. ";
	}

	if ((dmgType == ids.BLUNT || dmgType == ids.PIERCE || dmgType == ids.SLASH) && victim[ids.PROPS][ids["RES_" + dmgType.toUpperCase()]()])
	{
		result.amnt = Math.floor(result.amnt * 0.5).lowerCap(1);
		result.descr += "-50% DMG. ";
	}

	if ((hitLoc.includes(ids.ARM) || hitLoc.includes(ids.LEG) || hitLoc.includes(ids.WING)) && result.amnt > maxLimbDmg && isStun == false && dmgType != ids.STUN && dmgType != ids.POISON)
	{
		result.amnt = maxLimbDmg;
		result.descr += "Limb caps DMG. ";
	}

	return result;
}

//Calculates the hit location and returns the string of the part name
function getHitLocation(wpnLength, atckrSize, victim)
{
	var form = victim.getForm();
	var arr = [];
	var maxHeight = wpnLength + atckrSize;

  for (var part in form[ids.PARTS])
  {
    var weight = 0;

		if (victim[ids.AFFL]["lost " + part])
		{
			weight = partSizes[part].area * (form[ids.PARTS][part] - victim[ids.AFFL]["lost " + part]);
		}

		else if (victim[ids.AFFL]["lost all " + part + "s"] || maxHeight < victim[ids.SIZE] + partSizes[part].height)
		{
			weight = 0;
		}

		else
		{
			weight = partSizes[part].area * form[ids.PARTS][part];
		}

    for (var i = 0; i < weight; i++)
    {
      arr.push(part);
    }
  }

  return arr[Math.floor((Math.random() * arr.length))];
}

//Checks whether an attack is critical or not based on the victim's fatigue
//prot roll and other conditions that might immobilize him
//returns a bool
function isCritical(dfndr, protDRN)
{
	//Immobilized, will later check for other effects
	if (dfndr[ids.STATUS][ids.UNCONSCIOUS] || dfndr[ids.STATUS][ids.PARALYZED] || dfndr[ids.STATUS][ids.WEBBED])
	{
		if (protDRN <= 4)
		{
			return true;
		}

		else return false;
	}

	else
	{
		if (protDRN <= 2)
		{
			return true;
		}

		else return false;
	}
}

//Finds the total attacks of a group of weapons and arranges them
//in an ordered manner into an array
function getAttacks(wpns)
{
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

function rollDescr(str1, roll1, roll2, str2, result = "", resultStr = "", space1 = 25, rollSpace1 = 2, space2 = 5, spaceRoll2 = 7)
{
	return str1.width(space1) + roll1.toString().width(rollSpace1) + " vs " + roll2.toString().width(spaceRoll2) + str2.width(space2) + " | " + result + resultStr;
}
