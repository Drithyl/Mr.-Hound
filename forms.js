
const rw = require("../../MrHound/Current/reader_writer.js");
const event = require("../../MrHound/Current/emitter.js");
const ids = require("../../MrHound/Current/ids.js");
const currency = require("../../MrHound/Current/currency.js");
const costsTable = require("../../MrHound/Current/costs_table.js");

var formsFile = "forms.csv";

/*HP will be raised in increments. Each increment will yield the ceiled amount
of Log(2) of form's MAX_HP. For example, a hoburg of hp 5 will get 2.32 hp,
so ceiled to 3*/
var hpIncBase = 2;
var hpLogOf = 10;
var statLogOf = 2;
var baseTransitionCost = 10;

module.exports =
{
  list: {},

  init: function()
  {
    this.list = rw.CSVtoList(formsFile, defineForm());

    for (var id in this.list)
    {
      ids.store(this.list[id].name, id);
    }

    return this;
  },

  transition: function(player, input)
  {
    var hasRequirements = true;
    var reqStr = "The following requirements aren't met:\n\n";
    var newForm = this.find(input);
    var currForm = this.find(player[ids.FORM]);
    var carriedStats = {[ids.MR]: player[ids.MR], [ids.MRL]: player[ids.MRL],
                        [ids.STR]: player[ids.STR], [ids.ATK]: player[ids.ATK], [ids.DEF]: player[ids.DEF],
                        [ids.PREC]: player[ids.PREC], [ids.ENC]: player[ids.ENC], [ids.APS]: player[ids.APS]};

    if (newForm == null)
    {
      return "I cannot find this form in my database. Make sure you spelled it correctly or that you have the right id.";
    }

    if (newForm.id == currForm.id)
    {
      return "You cannot transition into your own form.";
    }

    if (newForm[ids.CAT].indexOf("starting form") != -1)
    {
      return "You cannot transition into a starting form.";
    }

    if (currForm[ids.TRANSITIONS].indexOf(newForm.id) == -1)
    {
      return "The new form chosen is not a valid transition for your current form. Check the transitioning tree!";
    }

    var transitionPCost = calculateTransitionCost(player, currForm, newForm);
    var totalCost = calculateCurrCost(player, currForm, newForm);

    if (player[ids.TRANSITION_POINTS] < transitionPCost)
    {
      hasRequirements = false;
      reqStr += "- You need " + (transitionPCost - player[ids.TRANSITION_POINTS]) + " more transition point(s).\n";
    }

    if (player.hasEnoughCurrency(totalCost) == false)
    {
      hasRequirements = false;
      var missingCurr = currency.subtract(totalCost, player.getVault().currency);
      reqStr += "- You don't have enough currency. You are missing the following amounts:\n\n" + rw.printStats(missingCurr, 15).toBox();
    }

    if (hasRequirements == false)
    {
      return reqStr;
    }

    player[ids.AFFL] = {};
    player[ids.SIZE] = newForm[ids.SIZE];
    player[ids.MAX_HP] = newForm[ids.MAX_HP] + newForm.getHPIncrement() * player[ids.HP_INC];
    player[ids.CURR_HP] = player[ids.MAX_HP];
    player[ids.REM_HP] = 0;

    for (var part in player[ids.PROT])
    {
      if (newForm[ids.PARTS][part] == null)
      {
        delete player[ids.PROT][part];
        continue;
      }

      if (player[ids.PROT][part] > currForm[ids.PROT][part])
      {
        var amntRaised = player[ids.PROT][part] - currForm[ids.PROT][part];
        player[ids.PROT][part] = newForm[ids.PROT][part] + amntRaised;
      }

      else
      {
        player[ids.PROT][part] = newForm[ids.PROT][part];
      }
    }

    for (var stat in carriedStats)
    {
      if (carriedStats[stat] > currForm[stat])
      {
        var amntRaised = carriedStats[stat] - currForm[stat];
        player[stat] = newForm[stat] + amntRaised;
      }

      else player[stat] = newForm[stat];
    }

    transferSlots(player, newForm);
  	transferProperties(player, newForm);
    player[ids.FORM] = newForm.id;
    player.transaction(totalCost, -1);
    player[ids.TRANSITION_POINTS] -= transitionPCost;
    return "You have successfully transitioned! You have now become a " + newForm.name.capitalize() + ". All the items you had equipped have been placed back into your vault. The ritual also healed all of your previous form's afflictions and your full HP. Make sure to redistribute your healing shares.";
  },

  price: function(form = null)
  {
    var data = {};

    if (form)
    {
      var costs = costsTable.calc(form);
      costs.name = form.name;
      data[form.name] = costs;
      return rw.printTable(data, null, ["name", ids.TRANSITION_POINTS, ids.GOLD].concat(currency.gems));
    }

    for (var f in this.list)
    {
      var costs = costsTable.calc(this.list[f]);
      costs.name = this.list[f].name;
      data[this.list[f].name] = costs;
    }

    return rw.printTable(data, null, ["name", ids.TRANSITION_POINTS, ids.GOLD].concat(currency.gems));
  },

  priceCSVTable: function()
  {
    for (var form in this.list)
    {
      var newCost = costsTable.calc(this.list[form]);

      this.list[form][ids.TRANSITION_POINTS] = newCost[ids.TRANSITION_POINTS] || 0;
      delete newCost[ids.TRANSITION_POINTS];

      this.list[form].cost = {};
      this.list[form].cost = Object.assign({}, newCost);

    }

    rw.saveTableToCSV("newForms.csv", this.list);
  },

	find: function(identifier)
	{
    var id = purify(identifier);
    var obj = Object.assign({}, this.list[id]);

    if (obj == null || !Object.keys(obj).length)
    {
      return null;
    }

    else return obj;
	}
}

function defineForm()
{
	return obj =
  {
    name: 							      "",
  	id: 								      "",
    cost:                     {},
    [ids.START_GOLD]:		      0,
    [ids.START_POINTS]:	      0,
    [ids.TRANSITION_POINTS]:  0,
    [ids.SIZE]:               2,
    [ids.MAX_HP]:             0,
    [ids.PROT]:               {},
    [ids.MR]:                 0,
    [ids.MRL]: 					      0,
    [ids.STR]: 				 	      0,
    [ids.ATK]: 					      0,
    [ids.DEF]: 					      0,
    [ids.PREC]: 				      0,
    [ids.ENC]:        	      0,
  	[ids.APS]:					      0,
    [ids.ATKS]:               {},
    [ids.PATHS]: 				      {},
    [ids.PROPS]: 				      {},
    [ids.SLOTS]: 				      {},
    [ids.PARTS]: 				      {},
    [ids.TRANSITIONS]:        [],
    [ids.CAT]: 					      [],

    getHPIncrement: function()
    {
      if (this[ids.PROPS][ids.SECONDSHAPE])
      {
        var secondForm = module.exports.find("f" + this[ids.PROPS][ids.SECONDSHAPE]);
        var totalHP = this[ids.MAX_HP] + secondForm[ids.MAX_HP];
        var originalShare = this[ids.MAX_HP] / totalHP;
        return ((Math.log(totalHP) / Math.log(hpIncBase)) * originalShare).truncate(5);
      }

      else if (this[ids.PROPS][ids.FIRSTSHAPE])
      {
        var originalForm = module.exports.find("f" + this[ids.PROPS][ids.FIRSTSHAPE]);
        var totalHP = this[ids.MAX_HP] + originalForm[ids.MAX_HP];
        var secondShare = this[ids.MAX_HP] / totalHP;
        return ((Math.log(totalHP) / Math.log(hpIncBase)) * secondShare).truncate(5);
      }

      else return ((Math.log(this[ids.MAX_HP]) / Math.log(hpIncBase))).truncate(5).lowerCap(3);
    },

    getHighestProt: function()
    {
      var highest = 0;

      for (var part in this[ids.PROT])
      {
        if (this[ids.PROT][part] > highest)
        {
          highest = this[ids.PROT][part];
        }
      }

      return highest;
    }
  };
}

function transferSlots(player, newForm)
{
  player.unequipSlots([[ids.HANDS], [ids.HEAD], [ids.BODY], [ids.FEET], [ids.MISC]]);
  delete player[ids.HANDS];
  delete player[ids.HEAD];
  delete player[ids.BODY];
  delete player[ids.FEET];
  delete player[ids.MISC];

  for (var slot in newForm[ids.SLOTS])
	{
		player[slot] = {[ids.EMPTY]: newForm[ids.SLOTS][slot]};
	}
}

function calculateTransitionCost (player, currForm, newForm)
{
  var cost = newForm[ids.TRANSITION_POINTS] - currForm[ids.TRANSITION_POINTS];

  if (cost > 0)
  {
    return cost;
  }

  else return 0;
}

function calculateCurrCost(player, currForm, newForm)
{
  var totalCost = currency.subtract(newForm.cost, currForm.cost);

  if (totalCost[ids.GOLD] == null || totalCost[ids.GOLD] < baseTransitionCost)
  {
    totalCost[ids.GOLD] = baseTransitionCost;
  }

  return totalCost;
}

function transferProperties(player, newForm)
{
  var levelledProps = player.getLevelledProps();
  delete player[ids.PROPS];
  player[ids.PROPS] = {};

  for (var prop in newForm[ids.PROPS])
  {
    if (levelledProps[prop])
    {
      player[ids.PROPS][prop] = newForm[ids.PROPS][prop] + levelledProps[prop];
      delete levelledProps[prop];
    }

    else player[ids.PROPS][prop] = newForm[ids.PROPS][prop];
  }

  for (var prop in levelledProps)
  {
    player[ids.PROPS][prop] = levelledProps[prop];
    delete levelledProps[prop];
  }
}

//Extracts an item name or ID from the input given by a user (to filter out spaces, underscores, etc)
function purify(input)
{
  if (input == null)
  {
    return undefined;
  }

  var str = input.toString().toLowerCase();

  if (/\S+/.test(str) == false)
  {
    return undefined;
  }

  //Replace the command part of the input
  str = str.replace(/\?\S+/, "").trim();

  if (/^f\d+$/.test(str))
	{
    return str;
  }

  str = str.replace(/_/g, " ");
  str = str.replace(/\s\s/g, "");

  return ids[str];
}
