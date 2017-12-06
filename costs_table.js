const ids = require("../../MrHound/Current/ids.js");
const currency = require("../../MrHound/Current/currency.js");
const rw = require("../../MrHound/Current/reader_writer.js");

var baseCurr = {[ids.GOLD]: 0, [ids.AIR_G]: 0, [ids.ASTRAL_G]: 0, [ids.BLOOD_G]: 0, [ids.DEATH_G]: 0, [ids.EARTH_G]: 0, [ids.FIRE_G]: 0, [ids.HOLY_G]: 0, [ids.NATURE_G]: 0, [ids.WATER_G]: 0};
var costsTable =
{
  [ids.SIZE]: function(size) {return {[ids.GOLD]: (size - 1) * 10};},
  [ids.MAX_HP]: function(hp) {return {[ids.GOLD]: hp * 2.5};},
  [ids.PROT]: function(form)
                            {
                              var total = 0;

                              for (var part in form[ids.PROT])
                              {
                                total += (form[ids.PROT][part] / Object.keys(form[ids.PARTS]).length).truncate(5);
                              }

                              return {[ids.GOLD]: total * 2};
                            },

  [ids.MR]: function(mr)    {return {[ids.GOLD]: mr * 0.5};},
  [ids.STR]: function(str)  {return {[ids.GOLD]: str * 2.5};},
  [ids.MRL]: function(mrl)
                          {
                            return {[ids.GOLD]: (mrl * 1).cap(30)};
                          },

  [ids.ENC]: function(enc)
                          {
                            if (enc == 6) return {[ids.GOLD]: 0};
                            if (enc == 5) return {[ids.GOLD]: 5};
                            if (enc == 4) return {[ids.GOLD]: 10};
                            if (enc == 3) return {[ids.GOLD]: 20};
                            if (enc == 2) return {[ids.GOLD]: 35};
                            if (enc == 1) return {[ids.GOLD]: 60};
                            if (enc == 0) return {[ids.GOLD]: 100};
                            else return {[ids.GOLD]: 0};
                          },

  [ids.ATK]: function(atk)
                          {
                            var incs = Math.abs(atk - 10);
                            var cost = (12 * incs) + (0.75 * Math.pow(incs, 2));

                            if (atk >= 10)
                            {
                              return {[ids.GOLD]: Math.ceil(cost)};
                            }

                            else return {[ids.GOLD]: Math.floor(-cost)};
                          },

  [ids.DEF]: function(def)
                          {
                            var incs = Math.abs(def - 10);
                            var cost = (8 * incs) + (0.75 * Math.pow(incs, 2));

                            if (def >= 10)
                            {
                              return {[ids.GOLD]: Math.ceil(cost)};
                            }

                            else return {[ids.GOLD]: Math.floor(-cost)};
                          },

  [ids.PREC]: function(prec)
                          {
                            return {[ids.GOLD]: 0};
                            /*var incs = Math.abs(prec - 10);
                            var cost = ((395 * incs) + (30 * Math.pow(incs, 2)) - (5 * Math.pow(incs, 3))) / 120;

                            if (prec >= 10)
                            {
                              return {[ids.GOLD]: Math.ceil(cost)};
                            }

                            else return {[ids.GOLD]: Math.floor(-cost)};*/
                          },

  [ids.ATKS]: function(form)
                            {
                              var total = {[ids.GOLD]: 0};

                              for (var atk in form[ids.ATKS])
                              {
                                var atkCost = {[ids.GOLD]: 0};
                                var attack = atk.findItem();

                                if (attack == null)
                                {
                                  continue;
                                }

                                atkCost = currency.add(total, attack.cost);

                                if (attack[ids.ON_HIT] !== "")
                                {
                                  var effect = attack[ids.ON_HIT].findItem();

                                  if (effect == null)
                                  {
                                    continue;
                                  }

                                  atkCost = currency.add(atkCost, currency.multiply(effect.cost, attack[ids.NBR_ATKS]));
                                }

                                if (attack[ids.ON_DMG] !== "")
                                {
                                  var effect = attack[ids.ON_DMG].findItem();

                                  if (effect == null)
                                  {
                                    continue;
                                  }

                                  atkCost = currency.add(atkCost, currency.multiply(effect.cost, attack[ids.NBR_ATKS]));
                                }

                                if (attack[ids.PROPS][ids.BONUS] && form[ids.SLOTS][ids.HANDS] == null)
                                {
                                  total[ids.GOLD] -= 10 * attack[ids.NBR_ATKS];
                                }

                                total = currency.add(total, atkCost);
                              }

                              return total;
                            },

  [ids.PATHS]: function(paths)
                              {
                                var total = Object.assign({}, baseCurr);
                                for (var p in paths)
                                {
                                  //total[ids[p.toUpperCase() + "_G"]] = paths[p] * 10;
                                }
                                return total;
                              },

  [ids.SLOTS]: function(slots)
                              {
                                var total = {[ids.GOLD]: 0};
                                for (var slot in slots)
                                {
                                  if (slot == ids.HANDS)
                                  {
                                    total[ids.GOLD] += slots[slot] * 25;
                                  }

                                  else if (slot == ids.HEAD)
                                  {
                                    total[ids.GOLD] += slots[slot] * 10;
                                  }

                                  else if (slot == ids.BODY)
                                  {
                                    total[ids.GOLD] += slots[slot] * 15;
                                  }

                                  else if (slot == ids.FEET)
                                  {
                                    total[ids.GOLD] += slots[slot] * 15;
                                  }

                                  else if (slot == ids.MISCELLANEOUS)
                                  {
                                    total[ids.GOLD] += (slots[slot] - 2) * 15;
                                  }
                                }

                                return total;
                              },

  [ids.PROPS]: function(form)
                              {
                                var total = Object.assign({}, baseCurr);
                                for (var p in form[ids.PROPS])
                                {
                                  if (p == ids.AMBIDEXTROUS)
                                  {
                                    total[ids.GOLD] += this[ids.ATK](10 + Math.ceil(form[ids.PROPS][p] * 0.75))[ids.GOLD];
                                  }

                                  else if (p == ids.AWE && form[ids.PROPS][p] >= 0)
                                  {
                                    total[ids.GOLD] += 10 + (form[ids.PROPS][p] * 5);
                                    total[ids.ASTRAL_G] += 1 + form[ids.PROPS][p];
                                  }

                                  else if (p == ids.BERSERK)
                                  {
                                    total[ids.GOLD] += 5 + (form[ids.PROPS][p] * 5);
                                  }

                                  else if (p == ids.COLD_AURA)
                                  {
                                    total[ids.GOLD] += 15;
                                    total[ids.WATER_G] += 2;
                                  }

                                  else if (p == ids.DISPLACEMENT)
                                  {
                                    total[ids.GOLD] += form[ids.PROPS][p];
                                    total[ids.AIR_G] += 1;
                                    total[ids.ASTRAL_G] += 1;
                                  }

                                  else if (p == ids.ETHEREAL)
                                  {
                                    total[ids.GOLD] += 25;

                                    if (form[ids.PROPS][ids.UNDEAD] || form[ids.CAT].indexOf(ids.UNDEAD) != -1)
                                    {
                                      total[ids.DEATH_G] += 2;
                                    }

                                    else total[ids.ASTRAL_G] += 2;
                                  }

                                  else if (p == ids.FIRE_SHLD)
                                  {
                                    total[ids.GOLD] += form[ids.PROPS][p] * 1.5;
                                    total[ids.FIRE_G] += (form[ids.PROPS][p] / 10) * 2;
                                  }

                                  else if (p == ids.GLAMOUR)
                                  {
                                    total[ids.GOLD] += 10;
                                    total[ids.AIR_G] += 2;
                                  }

                                  else if (p == ids.HEAT_AURA)
                                  {
                                    total[ids.GOLD] += 15;
                                    total[ids.FIRE_G] += 2;
                                  }

                                  else if (p == ids.INVUL)
                                  {
                                    var diff = (form[ids.PROPS][ids.INVUL] - form.getHighestProt()).lowerCap(0);
                                    total[ids.GOLD] += diff * 2;
                                  }

                                  else if (p == ids.POISON_BARBS || p == ids.POISON_SKIN)
                                  {
                                    total[ids.GOLD] += 10;
                                    total[ids.NATURE_G] += 2;
                                  }

                                  else if (p == ids.RECUP)
                                  {
                                    total[ids.GOLD] += 15;
                                    total[ids.NATURE_G] += 2;
                                  }

                                  else if (p == ids.REGEN)
                                  {
                                    total[ids.GOLD] += form[ids.PROPS][p] * 10;
                                    total[ids.NATURE_G] += (form[ids.PROPS][p] / 5) * 2;
                                  }

                                  else if (p == ids.RES_COLD())
                                  {
                                    if (form[ids.PROPS][p] < 0)
                                    {
                                      total[ids.GOLD] -= form[ids.PROPS][p] * 1;
                                    }

                                    else
                                    {
                                      total[ids.GOLD] += form[ids.PROPS][p] * 0.5;
                                      total[ids.WATER_G] += (form[ids.PROPS][p] / 10) * 2;
                                    }
                                  }

                                  else if (p == ids.RES_FIRE())
                                  {
                                    if (form[ids.PROPS][p] < 0)
                                    {
                                      total[ids.GOLD] -= form[ids.PROPS][p] * 1;
                                    }

                                    else
                                    {
                                      total[ids.GOLD] += form[ids.PROPS][p] * 0.5;
                                      total[ids.FIRE_G] += (form[ids.PROPS][p] / 10) * 2;
                                    }
                                  }

                                  else if (p == ids.RES_POISON())
                                  {
                                    if (form[ids.PROPS][p] < 0)
                                    {
                                      total[ids.GOLD] -= form[ids.PROPS][p] * 1;
                                    }

                                    else
                                    {
                                      total[ids.GOLD] += form[ids.PROPS][p] * 0.5;

                                      if ((form[ids.PROPS][ids.UNDEAD] || form[ids.CAT].indexOf(ids.UNDEAD) != -1) &&
                                          (form[ids.PROPS][ids.MAGIC_BEING] == null || form[ids.CAT].indexOf(ids.MAGIC_BEING) == -1))
                                      {
                                        total[ids.DEATH_G] += (form[ids.PROPS][p] / 10) * 2;
                                      }

                                      else if (form[ids.PROPS][ids.ETHEREAL] && form[ids.PROPS][ids.UNDEAD] == null)
                                      {
                                        total[ids.ASTRAL_G] += (form[ids.PROPS][p] / 10) * 2;
                                      }

                                      else if (form[ids.PROPS][ids.STONE])
                                      {
                                        total[ids.EARTH_G] += (form[ids.PROPS][p] / 10) * 2;
                                      }

                                      else total[ids.NATURE_G] += (form[ids.PROPS][p] / 10) * 2;
                                    }
                                  }

                                  else if (p == ids.RES_SHOCK())
                                  {
                                    if (form[ids.PROPS][p] < 0)
                                    {
                                      total[ids.GOLD] -= form[ids.PROPS][p] * 1;
                                    }

                                    else
                                    {
                                      total[ids.GOLD] += form[ids.PROPS][p] * 0.5;
                                      total[ids.AIR_G] += (form[ids.PROPS][p] / 10) * 2;
                                    }
                                  }

                                  else if (p == ids.RES_BLUNT() || p == ids.RES_PIERCE() || p == ids.RES_SLASH())
                                  {
                                    total[ids.GOLD] += 10;

                                    if ((form[ids.PROPS][ids.UNDEAD] || form[ids.CAT].indexOf(ids.UNDEAD) != -1) &&
                                        (form[ids.PROPS][ids.MAGIC_BEING] == null || form[ids.CAT].indexOf(ids.MAGIC_BEING) == -1))
                                    {
                                      total[ids.DEATH_G] += 2;
                                    }

                                    else total[ids.EARTH_G] += 2;
                                  }

                                  else if (p == ids.TRAMPLE)
                                  {
                                    total[ids.GOLD] += (form[ids.SIZE] - 1) * 10;
                                  }
                                }

                                return total;
                              }
}

module.exports =
{
  calc: function(form, isShapechange = false)
  {
    var total = Object.assign({}, baseCurr);
    var totalGems = 0;

    if (form[ids.PROPS][ids.FIRSTSHAPE] && isShapechange == false)
    {
      return {};
    }

    for (var key in costsTable)
    {
      if (form[key] == null)
      {
        continue;
      }

      if (key == ids.PROT || key == ids.ATKS || key == ids.PROPS)
      {
        total = currency.add(total, costsTable[key](form));
      }

      else total = currency.add(total, costsTable[key](form[key]));
    }

    if (form[ids.PROPS][ids.SECONDSHAPE])
    {
      var secondForm = ("f" + form[ids.PROPS][ids.SECONDSHAPE]).findForm();
      var secondCost = this.calc(secondForm, true);
      var totalHP = form[ids.MAX_HP] + secondForm[ids.MAX_HP];
      var originalShare = form[ids.MAX_HP] / totalHP;
      var secondShare = secondForm[ids.MAX_HP] / totalHP;
      total = currency.add(currency.multiply(total, originalShare), currency.multiply(secondCost, secondShare));
    }

    else if (form[ids.PROPS][ids.SHAPECHANGE] && isShapechange == false)
    {
      var secondForm = ("f" + form[ids.PROPS][ids.SHAPECHANGE]).findForm();
      var secondCost = this.calc(secondForm, true);
      total = currency.chooseHigher(total, secondCost);
    }

    for (var type in total)
    {
      if (type == ids.GOLD)
      {
        continue;
      }

      if (Math.floor(total[type]) != total[type])
      {
        var decimals = total[type] - Math.floor(total[type]);
        total[type] = Math.floor(total[type]);
        totalGems += total[type];
        total[ids.GOLD] = total[ids.GOLD] + (decimals * 7.5) || decimals * 7.5;
        currency.objTruncate(total, ids.GOLD, 5);
      }

      if (total[type] <= 0)
      {
        delete total[type];
      }
    }

    if (isShapechange == false)
    {
      total = currency.subtract(total, {[ids.GOLD]: 172});

      if (form[ids.CAT].indexOf(ids.STARTER) != -1)
      {
        total[ids.TRANSITION_POINTS] = 0;
      }

      /*else if (form[ids.PROPS][ids.UNDEAD] || form[ids.PROPS][ids.STONE])
      {
        total[ids.TRANSITION_POINTS] = 999;
      }*/

      else total[ids.TRANSITION_POINTS] = Math.round((total[ids.GOLD] || 0) / 50 + totalGems / 10);
    }

    if (total[ids.GOLD])
    {
      total[ids.GOLD] = Math.round(total[ids.GOLD]);
    }

    return total;
  }
}
