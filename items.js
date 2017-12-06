
const rw = require("../../MrHound/Current/reader_writer.js");
const ids = require("../../MrHound/Current/ids.js");
const event = require("../../MrHound/Current/emitter.js");

var armorsFile = "armors.csv";
var consumablesFile = "consumables.csv";
var stablesFile = "stables.csv";
var trinketsFile = "trinkets.csv";
var weaponsFile = "weapons.csv";

//Whenever consumables are used, the
//functions listed here will be called
var consumableFunctions =
{
  [ids.HEALING]: itemHeal,
  [ids.ENHANCED_HEAL]: enhanceHealFactor,
  [ids.RECUP]: itemRecuperation
}

module.exports =
{
  list: {},

  init: function()
  {
    this.list.armors = rw.CSVtoList(armorsFile, defineArmor());
    this.list.consumables = rw.CSVtoList(consumablesFile, defineConsumable());
    this.list.trinkets = rw.CSVtoList(trinketsFile, defineTrinket());
    this.list.weapons = rw.CSVtoList(weaponsFile, defineWeapon());

    for (var type in this.list)
    {
      for (var id in this.list[type])
      {
        ids.store(this.list[type][id].name, id);
      }
    }

    return this;
  },

  //Uses up a consumable item.
  //It can have a duration over time,
  //in which case it will be called via
  //the tracker object, or else used instantly
  trigger: function(character, item)
  {
    var result = "";

    if (item[ids.PROPS][ids.ONCE] && character[ids.ACTIVE_EFF][item.id] == null)
  	{
  		character.removeFromVault(item);
  	}

    if (item[ids.PROPS][ids.DURATION] == null || (item[ids.PROPS][ids.DURATION] && character[ids.ACTIVE_EFF][item.id] == null))
    {
      for (var key in item[ids.INSTANT_EFF])
      {
        result += consumableFunctions[key](character, item).toBox();
      }
    }

    if (character[ids.ACTIVE_EFF][item.id] == null && item[ids.PROPS][ids.DURATION])
    {
      character[ids.ACTIVE_EFF][item.id] = 0;
    }

    else if (character[ids.ACTIVE_EFF][item.id] < item[ids.PROPS][ids.DURATION] * 60)
    {
      character[ids.ACTIVE_EFF][item.id] += 1;
    }

    else
    {
      delete character[ids.ACTIVE_EFF][item.id];
    }

    for (var key in item[ids.ONGOING_EFF])
    {
      result += consumableFunctions[key](character, item).toBox();
    }

    return result;
  },

	find: function(identifier)
	{
    var id = purify(identifier);

    for (type in this.list)
    {
      if (this.list[type][id])
      {
        var obj = Object.assign({}, this.list[type][id]);

        if (obj == null || !Object.keys(obj).length)
        {
          return null;
        }

        else return obj;
      }
    }

    return undefined;
	}
}

/**********************************************************************************************************************
**********************************************END OF EXPOSURE**********************************************************
***********************************************************************************************************************/

function defineArmor()
{
	return obj =
  {
    id: 				       "",
  	name: 			       "",
    cost:              {},
  	[ids.PROT]: 	     {},
  	[ids.PROT_SHLD]:   0,
  	[ids.DEF]: 		     0,
  	[ids.PARRY]:       0,
  	[ids.ENC]:         0,
  	[ids.SLOT]:        "",
    [ids.REQ_SLOTS]:   1,
  	[ids.PROPS]:       {},
    [ids.RAR]:         0,
    [ids.CAT]:         [],

    getType: function()
    {
      return "armors";
    }
  };
}

function defineConsumable()
{
  return obj =
  {
    id: 			          "",
  	name: 		          "",
    cost:               {},
    [ids.INSTANT_EFF]:  {},
    [ids.ONGOING_EFF]:  {},
    [ids.PROPS]:        {},
    [ids.RAR]:          0,
    [ids.CAT]:          [],
    description:        "",

    getType: function()
    {
      return "consumables";
    },

    trigger: function(character)
    {
      return module.exports.trigger(character, this);
    }
  };
}

function defineTrinket()
{
	return obj =
  {
    id: 				       "",
  	name: 			       "",
    cost:              {},
  	[ids.ENC]:         0,
  	[ids.SLOT]:        "",
    [ids.REQ_SLOTS]:   1,
  	[ids.PROPS]:       {},
    [ids.RAR]:         0,
    [ids.CAT]:         [],
    description:      "",

    getType: function()
    {
      return "trinkets";
    }
  };
}

function defineWeapon()
{
	return obj =
  {
    id: 				       "",
  	name: 			       "",
    cost:              {},
  	[ids.DMG]: 		     0,
  	[ids.ATK]: 		     0,
  	[ids.DEF]: 	       0,
  	[ids.LENGTH]: 		 0,
  	[ids.NBR_ATKS]:    0,
  	[ids.DMG_TYPE]:    {},
    [ids.ON_HIT]:      "",
    [ids.ON_DMG]:      "",
  	[ids.CAN_REPEL]:   false,
  	[ids.SLOT]:        "",
    [ids.REQ_SLOTS]:   1,
  	[ids.PROPS]:       {},
    [ids.RAR]:         0,
    [ids.CAT]:         [],

    getType: function()
    {
      return "weapons";
    },

    pickDmgType: function()
    {
    	var arr = Object.keys(this[ids.DMG_TYPE]);
    	return arr[Math.floor((Math.random() * arr.length))];
    },

    isNotEffect: function()
    {
      if (this[ids.CAT].indexOf("effects") == -1 || this[ids.CAT].indexOf("intrinsic") != -1)
      {
        return true;
      }

      else return false;
    },

    isIntrinsic: function()
    {
      if (this[ids.CAT].indexOf("intrinsic") == -1)
      {
        return false;
      }

      else return true;
    },

    getOnHitEffect: function()
    {
      if (this[ids.ON_HIT] == null || this[ids.ON_HIT] == "")
      {
        return undefined;
      }

      return module.exports.find(this[ids.ON_HIT]);
    },

    getOnDmgEffect: function()
    {
      if (this[ids.ON_DMG] == null || this[ids.ON_DMG] == "")
      {
        return undefined;
      }

      return module.exports.find(this[ids.ON_DMG]);
    }
  };
}

function itemHeal(character, item)
{
  return item.name.capitalize() + ": " + character.heal(item[ids.INSTANT_EFF][ids.HEALING]);
}

function enhanceHealFactor(character, item)
{
  if (character[ids.ACTIVE_EFF][item.id] == null)
  {
    character[ids.FACTORS][ids.HEALING] -= item[ids.ONGOING_EFF][ids.ENHANCED_HEAL];
    return item.name.capitalize() + ": the enhanced healing has worn off. ";
  }

  //Just triggered!
  if (character[ids.ACTIVE_EFF][item.id] == 0)
  {
    character[ids.FACTORS][ids.HEALING] = character[ids.FACTORS][ids.HEALING] + item[ids.ONGOING_EFF][ids.ENHANCED_HEAL] || item[ids.ONGOING_EFF][ids.ENHANCED_HEAL];
    return "Your healing factor has been enhanced by " + item[ids.ONGOING_EFF][ids.ENHANCED_HEAL] + "%/h for the next " + item[ids.PROPS][ids.DURATION] + " hours. ";
  }

  return "";
}

function itemRecuperation(character, item)
{
  character[ids.FACTORS][ids.RECUP] = character[ids.FACTORS][ids.RECUP] + character[ids.BASE_FACTORS][ids.RECUP] || character[ids.BASE_FACTORS][ids.RECUP];

  if (character[ids.ACTIVE_EFF][item.id] == null)
  {
    var form = character[ids.FORM].findForm();

    if (form[ids.PROPS][ids.RECUP] == null)
    {
      delete character[ids.PROPS][ids.RECUP];
    }

    return item.name.capitalize() + ": the recuperation has worn off. ";
  }

  //Just triggered!
  if (character[ids.ACTIVE_EFF][item.id] == 0)
  {
    character[ids.PROPS][ids.RECUP] = ids.RECUP;
    return "The " + item.name + " allows you to heal all afflictions and at a faster rate for " + item[ids.PROPS][ids.DURATION] + " hours. ";
  }

  return "";
}

//Extracts an item name or ID from the input given by a user (to filter out spaces, underscores, etc)
function purify(input)
{
  var str = input.toString().toLowerCase();
  str = str.replace(/(\?\S+)/, "").trim();

  if (/\S+/.test(str) == false)
  {
    return undefined;
  }

	if (/^\w\d+$/.test(str))
	{
    return str;
  }

  str = str.replace(/_/g, " ");
  str = str.replace(/\s\s/g, "");

	var i = str.indexOf("sword");			//If the user writes a weapon containing the word 'sword' all together, like broadsword, the bot will read it as broad sword, the dom4 name

	if (i != -1 && str[i - 1] != " ")
	{
		str = str.slice(0, i) + " " + str.slice(i);
	}

  return ids[str];
}
