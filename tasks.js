
const ids = require("../../MrHound/Current/ids.js");
const event = require("../../MrHound/Current/emitter.js");
const rw = require("../../MrHound/Current/reader_writer.js");
const currency = require("../../MrHound/Current/currency.js");

var sharesMltpl = 10;

module.exports =
{
  methods:
  {
    [ids.HEALING]:  {resolve: function(character){return restHeal(character);},               factor: function(character){return character.getFinalHealingFactor();}},
    [ids.RECUP]:    {resolve: function(character){return restRecup(character);},              factor: function(character){return character.getRecupFactor();}},
    [ids.GOLD]:     {resolve: function(character){return work(character);},                   factor: function(character){return character.getGoldFactor();}},
    [ids.ATK]:      {resolve: function(character){return train(ids.ATK, character);},         factor: function(character){return character.getTrainFactor(ids.ATK);}},
    [ids.DEF]:      {resolve: function(character){return train(ids.DEF, character);},         factor: function(character){return character.getTrainFactor(ids.DEF);}},
    [ids.PREC]:     {resolve: function(character){return train(ids.PREC, character);},        factor: function(character){return character.getTrainFactor(ids.PREC);}},
    [ids.AIR_G]:    {resolve: function(character){return search(ids.AIR_G, character);},      factor: function(character){return character.getGemFactor(ids.AIR_G);}},
    [ids.ASTRAL_G]: {resolve: function(character){return search(ids.ASTRAL_G, character);},   factor: function(character){return character.getGemFactor(ids.ASTRAL_G);}},
    [ids.BLOOD_G]:  {resolve: function(character){return search(ids.BLOOD_G, character);},    factor: function(character){return character.getGemFactor(ids.BLOOD_G);}},
    [ids.DEATH_G]:  {resolve: function(character){return search(ids.DEATH_G, character);},    factor: function(character){return character.getGemFactor(ids.DEATH_G);}},
    [ids.EARTH_G]:  {resolve: function(character){return search(ids.EARTH_G, character);},    factor: function(character){return character.getGemFactor(ids.EARTH_G);}},
    [ids.FIRE_G]:   {resolve: function(character){return search(ids.FIRE_G, character);},     factor: function(character){return character.getGemFactor(ids.FIRE_G);}},
    [ids.NATURE_G]: {resolve: function(character){return search(ids.NATURE_G, character);},   factor: function(character){return character.getGemFactor(ids.NATURE_G);}},
    [ids.WATER_G]:  {resolve: function(character){return search(ids.WATER_G, character);},    factor: function(character){return character.getGemFactor(ids.WATER_G);}}
  },

  setShares: function(input, character)
  {
  	var shares = input.split("/");
  	var obj = {[ids.SHARES]: {[ids.HEALING]: 0, [ids.RECUP]: 0}};
  	var total = 0;

  	for (var i = 0; i < shares.length; i++)
  	{
  		var share = +shares[i].replace(/\D/g, "");

  		if (isNaN(share))
  		{
  			return "You must include numbers. For example: `?shares set gold 10/healing 20/diamonds 70`.";
  		}

      if (share % sharesMltpl != 0)
      {
        return "Each share must be a multiple of 10.";
      }

  		total += share;

  		if (/(HEAL(ING)?|HP)/.test(shares[i]))
  		{
  			if (share > 50)
  			{
  				return "You can only set your healing to a maximum of 50% (since you already heal a base 50% no matter what).";
  			}

  			obj[ids.SHARES][ids.HEALING] = share;
        obj[ids.SHARES][ids.RECUP] = share;
  		}

  		else if (/(WORK|GOLD)/.test(shares[i])) 	obj[ids.SHARES][ids.GOLD] = share;
  		else if (/ATTACK/.test(shares[i])) 				obj[ids.SHARES][ids.ATK] = share;
  		else if (/DEFEN(C|S)E/.test(shares[i])) 	obj[ids.SHARES][ids.DEF] = share;
  		else if (/PRECISION/.test(shares[i])) 		obj[ids.SHARES][ids.PREC] = share;
  		else if (/BLOODSTONES?/.test(shares[i])) 	obj[ids.SHARES][ids.BLOOD_G] = share;
  		else if (/DIAMONDS?/.test(shares[i])) 		obj[ids.SHARES][ids.AIR_G] = share;
  		else if (/EMERALDS?/.test(shares[i])) 		obj[ids.SHARES][ids.NATURE_G] = share;
  		else if (/ONYXE?S?/.test(shares[i])) 			obj[ids.SHARES][ids.DEATH_G] = share;
  		else if (/PEARLS?/.test(shares[i])) 			obj[ids.SHARES][ids.ASTRAL_G] = share;
  		else if (/RUBY?I?E?S?/.test(shares[i])) 	obj[ids.SHARES][ids.FIRE_G] = share;
  		else if (/SAPPHIRES?/.test(shares[i])) 		obj[ids.SHARES][ids.WATER_G] = share;
  		else if (/TOPAZE?S?/.test(shares[i])) 		obj[ids.SHARES][ids.EARTH_G] = share;
  		else
      {
        return "I could not find the task " + shares[i] + ". You can see all options with the ?tasks command.";
      }
  	}

  	if (total != 100)
  	{
  		return "The sum of all shares must be exactly 100.";
  	}

  	else
  	{
  		character[ids.SHARES] = Object.assign({}, obj[ids.SHARES]);
  		return "Your task shares have been set. You can check the ongoing numbers in `?my tasks`";
  	}
  },

  getFactors: function(character)
  {
    var result = "";

    for (var task in this.methods)
    {
      if (this.methods[task] == null)
      {
        rw.log("The factor for the task " + task + " for player " + character.name + " was not recognized.");
  			result += task + " not found.";
      }

      if (this.methods[task].factor(character) <= 0)
      {
        continue;
      }

      result += task.capitalize() + " (" + this.methods[task].factor(character) + "). ";
    }

    return result;
  },

  resolveTasks: function(character)
  {
    var result = "";

    for (var task in this.methods)
    {
      if (this.methods[task] == null)
      {
        rw.log("The task " + task + " for player " + character.name + " was not recognized.");
  			result += "The task " + task + " was not recognized. Please notify this as a bug.";
      }

      if (this.methods[task].factor(character) <= 0)
      {
        continue;
      }

      if (character[ids.CURR_HP] < 0 && task != ids.HEALING && task != ids.RECUP)
      {
        console.log(task + " not kicking in.");
        continue;
      }

      result += this.methods[task].resolve(character);
    }

  	return result;
  }
}

function restHeal(character)
{
  if (character[ids.CURR_HP] < character.getTtlHP())
  {
    character.heal(character.getFinalHealingFactor());

    if (character.isHealthy() == true)
    {
      redistributeShares(character);
      return "You are now as healthy as you can get. Your healing shares have been redistributed among your other active tasks.";
    }
  }

  return "";
}

function restRecup(character)
{
  var result = "";

  if (Object.keys(character[ids.AFFL]).length >= 1)
  {
    if (character[ids.PROPS][ids.RECUP])
    {
      result += character.recuperate(character.getRecupFactor());

      if (character.isHealthy() == true)
      {
        result += "You are now as healthy as you can get. Your healing shares have been redistributed among your other active tasks.";
        redistributeShares(character);
      }
    }

    else if (character.hasHealableAffl())
    {
      result += character.lesserRecuperate(character.getRecupFactor());

      if (character.isHealthy() == true)
      {
        result += "You are now as healthy as you can get. Your healing shares have been redistributed among your other active tasks.";
        redistributeShares(character);
      }
    }
  }

  return result;
}

function work(character)
{
  character.transaction({[ids.GOLD]: character.getGoldFactor()});
  return "";
}

function search(type, character)
{
  var roll = Math.random() * 101;
  var chance = character.getGemFactor(type);

  if (chance <= 0)
  {
    return "";
  }

  if (roll > chance)
  {
    var addedChance = character[ids.BASE_FACTORS][ids.GEMS] * (character[ids.SHARES][type] * 0.01) || 0;
    character[ids.FACTORS][type] = character[ids.FACTORS][type] + addedChance || addedChance;
    currency.objTruncate(character[ids.FACTORS], type, 5);
    return "";
  }

  character.transaction({[type]: 1});
  delete character[ids.FACTORS][type];
  return "After much searching, you finally find a(n) " + ids[type + "_1"] + ". ";
}

function train(stat, character)
{
  var currStat = character[stat];
  character[stat] += character.getTrainFactor(stat);
  currency.objTruncate(character, stat, 5);

  if (Math.floor(currStat) != Math.floor(character[stat]))
  {
    return "After much training, you finally improve your " + stat + "!";
  }

  else return "";
}

function redistributeShares(character)
{
  var otherTasks = Object.keys(character[ids.SHARES]);

  while (character[ids.SHARES][ids.HEALING] > 0)
  {
    for (var i = 0; i < otherTasks.length; i++)
    {
      if (otherTasks[i] == ids.HEALING || otherTasks[i] == ids.RECUP)
      {
        continue;
      }

      if (character[ids.SHARES][ids.HEALING] < sharesMltpl)
      {
        character[ids.SHARES][ids.HEALING] = 0;
        character[ids.SHARES][ids.RECUP] = 0;
        return;
      }

      character[ids.SHARES][otherTasks[i]] += sharesMltpl;
      character[ids.SHARES][ids.HEALING] -= sharesMltpl;
      character[ids.SHARES][ids.RECUP] -= sharesMltpl;
    }
  }
}

//Will always set the timestamp in milliseconds, going back to the last o'clock hour
function setTimestamp()
{
  var d = new Date();
  d.setMinutes(0);
  d.setSeconds(0);
  return d.getTime();
}
