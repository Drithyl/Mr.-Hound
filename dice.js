
module.exports =
{
  roll: function(diceNum, max, explosive = false, giveAvg = true)
  {
  	var str = "";
  	var total = 0;

  	for (var i = 0; i < diceNum; i++)
  	{
  		var result = Math.floor((Math.random() * max) + 1);

  		if (explosive == true && result == max)
      {
        result += explodeDie(max);
      }

  		total += result;

  		if (diceNum == 1)
      {
        str += result;
      }

  		else if (i == diceNum - 1)
      {
        str += result + " = " + total;
      }

  		else str += result + " + ";
  	}

    if (giveAvg)
    {
      var avg = ((max + 1) * 0.5) * diceNum;
      str += " (Avg: " + avg.toFixed(0) + ")";
    }

  	return str + ".";
  },

  //The Dom4 DRN is a 2d6 roll in which a result of 6 is exploded, but substracting 1 from it.
  DRN: function()
  {
  	return explodeDRN() + explodeDRN();
  },

  DRNvsDRN: function(atkMod = 0, defMod = 0)
  {
    drn1 = DRN();
    drn2 = DRN();
  	return {roll1: drn1 + atkMod, natRoll1: drn1, roll2: drn2 + defMod, natRoll2: drn2, diff: (drn1 + atkMod) - (drn2 + defMod)};
  }
}

function explodeDie(max)
{
	var rndm = Math.floor((Math.random() * max) + 1);

	if (rndm == max)
	{
		rndm += explodeDie(max);
	}

	return rndm;
}

function explodeDRN()
{
  var rndm = Math.floor((Math.random() * 6) + 1);

  if (rndm == 6)
  {
    rndm += -1 + explodeDRN();
  }

  return rndm;
}
