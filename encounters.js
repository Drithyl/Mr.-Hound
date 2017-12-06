
const ids = require("../../MrHound/Current/ids.js");

var battleExpireTime = 1190000;	//after this amount of time a challenge will expire.
var challengeExpireTime = 59000;	//after this amount of time a challenge will expire.

var postRoundLimit = 20;

var dmgXPRate = 100;
var lifeXPRate = 85;
var dmgXPCap = 1;
var xpAdjCons = 10;
var xpAdjMult = 0.5;
var xpAdjHighCap = 2.5;
var xpAdjLowCap = 0.25;
var xpAdjLvlMult = 1.05;

module.exports =
{
  ongoing: {},
	challenges: {},

  createBattle: function(type, chllngr, offndr)
  {
    var absChallenger = chllngr.abstract();
		var absOffender = offndr.abstract();
		var healed = (type == "duel") ? false : true;
		absChallenger.battleReady(healed);
		absOffender.battleReady(healed);

		this.ongoing[chllngr.id] = defineBattle(type, absChallenger, absOffender);
    this.ongoing[offndr.id] = this.ongoing[chllngr.id];
    this.ongoing[chllngr.id].challenger[ids.STATUS][ids.ENCOUNTER] = this.ongoing[chllngr.id];
    this.ongoing[offndr.id].offender[ids.STATUS][ids.ENCOUNTER] = this.ongoing[chllngr.id];
  },

  createChallenge: function (type, challenger, offender)
	{
		this.challenges[challenger.id] = {[offender.id]: {mode: type, timestamp: Date.now()}};
	},

  acceptChallenge: function (type, challenger, offender)
	{
    this.createBattle(type, challenger, offender);

		delete this.challenges[challenger.id][offender.id];
		if (!Object.keys(this.challenges[challenger.id]).length)
		{
			delete this.challenges[challenger.id];
		}

		setExposure(this.ongoing[challenger.id]);
	},

  cleanChallenges: function()
	{
		for (user in this.challenges)
		{
			for (var offer in this.challenges[user])
			{
				if (Date.now() >= this.challenges[user][offer].timestamp + challengeExpireTime)
				{
					delete this.challenges[user][offer];
				}
			}

			if (!Object.keys(this.challenges[user]).length)
			{
				delete this.challenges[user];
			}
		}
	},

	cleanBattles: function(channel)
	{
		for (match in this.ongoing)
		{
			if (Date.now() >= this.ongoing[match].timestamp + battleExpireTime)
			{
				channel.send(endEncounter(this.ongoing[match]));
				delete this.ongoing[match];
			}
		}
	}
}

function adjustXP(xpEarned, ownLvl, oppLvl)
{
	var multiplier = (((xpAdjMult * oppLvl) + xpAdjCons) / ((xpAdjMult * ((2 * ownLvl) - oppLvl)) + xpAdjCons)).lowerCap(xpAdjLowCap).cap(xpAdjHighCap);
	return Math.floor(xpEarned * multiplier); //* Math.pow(xpAdjLvlMult, ownLvl)
}

function defineBattle(type, chllngr, offndr)
{
  var obj =
  {
    mode: type,
    exposure: null,
    challenger: chllngr,
    offender: offndr,
    challengerHP: chllngr[ids.CURR_HP],
    challengerDmgTaken: 0,
    challengerDmgDealt: 0,
    offenderHP: offndr[ids.CURR_HP],
    offenderDmgTaken: 0,
    offenderDmgDealt: 0,
    turnID: offndr.id,
    turnNbr: 1,
    timestamp: Date.now(),
    winner: "",

    "setExposure": setExposure,
    "updateExposure": updateExposure,
    "updateTurn": updateTurn,
    "endEncounter": endEncounter,
    "getWinner": getWinner,
  }

  obj.setExposure();
  return obj;
}

function setExposure (t = this)
{
  var battlesArr = Object.keys(module.exports.ongoing);
  if (battlesArr.length > 2)
  {
    t.exposure = "private";
  }

  else
  {
    t.exposure = "public";
  }
}

function updateExposure(t = this)
{
  var battlesArr = Object.keys(module.exports.ongoing);

  if (battlesArr.length && battlesArr.length <= 2)
  {
    t.exposure = "public";
  }
}

function updateTurn (t = this)
{
  if (t == null)
  {
    return;
  }

  if (t.offender.id == t.turnID)
  {
    t.turnID = t.challenger.id;
    return t.challenger.name + "'s turn.";
  }

  else
  {
    t.turnNbr++;
    t.turnID = t.offender.id;
    return ("Turn " + t.turnNbr + " starts!").toBox() + t.offender.name + "'s turn.";
  }
}

function endEncounter(t = this)
{
	var result = ("The battle is stopped on turn " + t.turnNbr + "!").toBox() +
								t.challenger.endEffects(postRoundLimit).toBox() +
								t.offender.endEffects(postRoundLimit).toBox();

	if (t.mode == "simulation")
	{
		t.status = "ended";
		return "";
	}

	result += getWinner(t).toBox();
	result += assignXP(t).toBox();

	if (t.mode == "duel")
	{
		delete t.challenger[ids.STATUS];
		delete t.offender[ids.STATUS];
		t.challenger.mergeAbstract();
		t.offender.mergeAbstract();
	}

	t.status = "ended";
	return result;
}

function assignXP(t = this)
{
  var challXP = calcXP(t.challenger, t.offender, t.challengerDmgDealt, t.challengerDmgTaken);
  var offXP = calcXP(t.offender, t.challenger, t.offenderDmgDealt, t.offenderDmgTaken);


  return t.challenger.raiseXP(adjustXP(challXP, t.challenger[ids.LVL], t.offender[ids.LVL])) + " " +
         t.offender.raiseXP(adjustXP(offXP, t.offender[ids.LVL], t.challenger[ids.LVL]));
}

function calcXP(character, opponent, dmgDealt, dmgTaken)
{
  var maxHP = character.getTtlShapeHP();
  var maxOppHP = opponent.getTtlShapeHP();
  return (((dmgDealt.cap(maxOppHP) / maxOppHP) * dmgXPRate) + ((dmgTaken.cap(maxHP) / maxHP) * lifeXPRate));
}

function getWinner(t = this)
{
	if (t.challenger[ids.CURR_HP] <= 0 && t.offender[ids.CURR_HP] <= 0)
	{
		t.winner = 0;
		return "#####IT'S A DRAW!#####";
	}

	else if (t.challenger[ids.CURR_HP] <= 0)
	{
		t.winner = t.offender.id;
		return "#####" + t.offender.name + " IS VICTORIOUS!#####";
	}

	else if (t.offender[ids.CURR_HP] <= 0)
	{
		t.winner = t.challenger.id;
		return "#####" + t.challenger.name + " IS VICTORIOUS!#####";
	}

	else if (t.turnID == t.challenger.id)
	{
		t.winner = t.offender.id;
		return "#####" + t.offender.name + " IS VICTORIOUS!#####";
	}

	else if (t.turnID == t.offender.id)
	{
		t.winner = t.challenger.id;
		return "#####" + t.challenger.name + " IS VICTORIOUS!#####";
	}

	else
	{
		return "#####NO WINNER COULD BE DECIDED! IT'S A DRAW!#####";
	}
}
