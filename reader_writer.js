const fs = require("fs");
const ids = require("../../MrHound/Current/ids.js");
const event = require("../../MrHound/Current/emitter.js");

Number.isFloat = function(n)
{
	return Number(n) === n && n % 1 !== 0;
}

module.exports =
{
	copyFile: function(source, target, cb)
	{
		var cbCalled = false;

		var rd = fs.createReadStream(source);
		rd.on("error", function(err)
		{
		  done(err);
		});

		var wr = fs.createWriteStream(target);
		wr.on("error", function(err)
		{
		  done(err);
		});

		wr.on("close", function(ex)
		{
		  done();
		});

		rd.pipe(wr);
		function done(err)
		{
		  if (!cbCalled)
			{
		    cb(err, source);
		    cbCalled = true;
		  }
		}
	},

	retrieveRecords: function(dirPath, dfltObj, storageObj, callback = null, fieldEnd = ",", tagSeparator = ":", tagChar = '"')
	{
		fs.readdir(dirPath, "utf8", (err, files) =>
	 	{
			if (err)
			{
				this.log(err);
				return {};
			}

			while (files.length)
			{
				var filename = files.shift();

				var data = fs.readFileSync(dirPath + "/" + filename, "utf8");

				if (data == null)
				{
					this.log("Couldn't read " + filename);
					return;
				}

				if (/[\w\d]/.test(data) == false)
				{
					this.log(filename + " is empty.");
					return;
				}

				storageObj[filename] = Object.assign({}, dfltObj);
  			module.exports.populateObj(storageObj[filename], data, fieldEnd, tagSeparator, tagChar);
			}

			if (callback)
			{
				callback(storageObj);
			}
		});
	},

  //populates an object of objects with the data from a given file. The dfltObj parameter is the default object that it fills the table object with,
  //containing default values to look for in the file
  populateTable: function(filePath, dfltObj, itemStart = "<", itemEnd = ">", fieldEnd = ",", tagSeparator = ":", tagChar = '"')
  {
		var obj = {};
  	var data = fs.readFileSync(filePath, "utf8");

  	if (data == undefined)
		{
			return obj;
		}

		//If the table only has whitespace or no item identifiers (< and >) it will be skipped
		if (/[\w\d<>]/.test(data) == false)
		{
			return obj;
		}

  	var rows = data.split(itemEnd);

  	for (var i = 0; i < rows.length; i++)
  	{
			if (/[\w\d]/.test(rows[i]) == false)
			{
				continue;
			}

			var name = rows[i].slice(rows[i].indexOf(tagChar) + 1, rows[i].indexOf(tagChar, rows[i].indexOf(tagChar) + 1)).toLowerCase();
  		var rowData = rows[i].slice(rows[i].indexOf(itemStart) + 1).toLowerCase();

			obj[name] = Object.assign({}, dfltObj);
			this.populateObj(obj[name], rowData, fieldEnd, tagSeparator, tagChar);
  	}

  	return obj;
  },

	CSVtoList: function(filePath, dfltObj, fieldEnd = ",")
  {
		var obj = {};
  	var data = fs.readFileSync(filePath, "utf8");

  	if (data == undefined)
		{
			return obj;
		}

		//If the table only has whitespace or no item identifiers (< and >) it will be skipped
		if (/[\w\d<>]/.test(data) == false)
		{
			return obj;
		}

  	var rows = data.toLowerCase().split("\r\n");
		var categories = rows[0].split(fieldEnd);

  	for (var i = 1; i < rows.length; i++)
  	{
			if (/[\w\d]/.test(rows[i]) == false)
			{
				continue;
			}

			var key = rows[i].slice(0, rows[i].indexOf(fieldEnd));
			obj[key] = Object.assign({}, dfltObj);
			var catIndex = 0;
			var index = 0;

			while(true)
			{
				var nextIndex = rows[i].indexOf(fieldEnd, index);

				if (nextIndex == -1)
				{
					obj[key][categories[catIndex]] = CSVCellToVal(rows[i].slice(index, rows[i].length), obj[key][categories[catIndex]]);
					break;
				}

				else if (rows[i].indexOf('"', index) != -1 && rows[i].indexOf('"', index) < nextIndex)
				{
					nextIndex = rows[i].indexOf(fieldEnd, rows[i].indexOf('"', rows[i].indexOf('"', index) + 1));

					if (nextIndex == -1)
					{
						obj[key][categories[catIndex]] = CSVCellToVal(rows[i].slice(index, rows[i].length), obj[key][categories[catIndex]]);
						break;
					}

					else
					{
						obj[key][categories[catIndex]] = CSVCellToVal(rows[i].slice(index, nextIndex), obj[key][categories[catIndex]]);
					}
				}

				else
				{
					obj[key][categories[catIndex]] = CSVCellToVal(rows[i].slice(index, nextIndex), obj[key][categories[catIndex]]);
				}

				catIndex++;
				index = nextIndex + 1;
			}
  	}

  	return obj;
  },

  //Browses string data to find values of the object-defined properties
  populateObj: function(obj, data, fieldEnd = ",", tagSeparator = ":", tagChar = '"')
  {
  	for (var key in obj)
  	{
			var tagStart = data.toLowerCase().indexOf(tagChar + key.toLowerCase() + tagChar);
			var tagEnd = data.indexOf(tagSeparator, tagStart + 1);
			var cellStart = data.indexOf(tagSeparator, tagEnd);
			var cellEnd = data.indexOf(fieldEnd, cellStart + 1);

      if (typeof obj[key] == "function")
			{
				continue;
			}

			//The default object contains a field that isn't found in the data provided,
			//so delete it from the default object so that it doesn't get assigned to the final one
  		if (tagStart == -1)
			{
				delete obj[key];
				continue;
			}

			//The last field has no character signaling its end (usually the ',')
			if (cellEnd == -1)
			{
				cellEnd = data.length;
			}

			obj[key] = cellToVal(data.slice(cellStart, cellEnd), obj[key]);

			//Remove the key used from the data to prevent conflicts with other similarly named keys
			data = data.slice(0, tagStart) + data.slice(tagEnd);
  	}
  },

	printTable: function(list, category, keys, columnSpace = 3)
	{
    var str = "";
    var ttlLength = 0;
    var valLengthsArr = [];

    for (var i = 0; i < keys.length; i++)
    {
      var maxValLength = keys[i].length;

      for (var item in list)
  		{
        if (category && list[item][ids.CAT].indexOf(category) == -1)
        {
          continue;
        }

				if (list[item][keys[i]] == null)
				{
					continue;
				}

				var valLength = (typeof list[item][keys[i]] == "object") ? this.printProps(list[item][keys[i]]).length : list[item][keys[i]].toString().length;
        maxValLength = (valLength > maxValLength) ? valLength : maxValLength;
      }

      ttlLength += maxValLength;
      valLengthsArr.push(maxValLength);

      if (maxValLength > keys[i].length)
      {
        str += "".width(Math.ceil((maxValLength * 0.5) - (keys[i].length * 0.5))) + keys[i].width(Math.ceil(maxValLength * 0.5)) + "".width(columnSpace);
      }

      else
      {
        str += keys[i] + "".width(columnSpace);
      }
    }

    str += "\n" + "".width(ttlLength + columnSpace * keys.length, false, "—") + "\n";

    for (var item in list)
    {
      if (category && list[item][ids.CAT].indexOf(category) == -1)
      {
        continue;
      }

      for (var j = 0; j < keys.length; j++)
      {
				if (list[item][keys[j]] == null)
				{
					str += "".width(valLengthsArr[j] + columnSpace);
					continue;
				}

        var value = (typeof list[item][keys[j]] == "object") ? this.printProps(list[item][keys[j]]) : list[item][keys[j]].toString();
        str += value.width(valLengthsArr[j]) + "".width(columnSpace);
      }

      str += "\n";
    }

		return str;
	},

	printProps: function(obj, empty = "", fieldEnd = ", ")
	{
		var str = "";

		for (var p in obj)
		{
			if (typeof obj[p] == "string")
			{
				str += p.capitalize() + fieldEnd;
			}

			else
			{
				str += p.capitalize() + ": " + obj[p] + fieldEnd;
			}
		}

		if (empty != "" && str == "")
		{
			return empty;
		}

		else return str.slice(0, str.lastIndexOf(fieldEnd));
	},

	//Prints a list of cells in an orderly manner
	printStats: function(item, spacing = 25)
 	{
		var str = objToStr(item, spacing, true, "\n", false, "<", ">");

		if (str == null || str == "")
		{
			return "Unable to find item or item was empty.";
		}

		return str;
	},

	//Saves an object as a table in an external file
  saveTable: function(filePath, updTable, is2D = false, spacing = 17, spcChar = " ", itemStart = "<", itemEnd = ">", fieldEnd = ",", tagSeparator = ":", tagChar = '"')
  {
  	fs.writeFile(filePath, tableToString(updTable, is2D, spacing, spcChar, itemStart, itemEnd, fieldEnd, tagSeparator, tagChar), (err) =>
  	{
  		if (err)
  		{
  			if (owner)
  			{
  				owner.sendMessage ("Something went wrong when trying to update the following file: " + filePath + "\nThe error given is: " + err);
  			}

  			this.log("Updating failed for the following file: " + filePath + "\nThe error given is: " + err);
  			return;
  		}
  	});
  },

	saveTableToCSV: function(filePath, table)
  {
  	fs.writeFile(filePath, this.tableToCSV(table), (err) =>
  	{
  		if (err)
  		{
  			if (owner)
  			{
  				owner.sendMessage ("Something went wrong when trying to update the following file: " + filePath + "\nThe error given is: " + err);
  			}

  			this.log("Updating failed for the following file: " + filePath + "\nThe error given is: " + err);
  			return;
  		}
  	});
  },

	tableToCSV: function(table, spcChar = " ", fieldEnd = ',')
	{
		var str = "";

		for (var row in table)
		{
			if (typeof table[row] === "function")
			{
				continue;
			}

			for (var tag in table[row])
			{
				if (typeof table[row][tag] === "function")
				{
					continue;
				}

				str += valToCSVCell(table[row][tag]) + fieldEnd;
			}

			str = str.slice(0, str.lastIndexOf(fieldEnd)) + "\n";	//add the separator after the last tag, to start the new item
		}

		return str;
	},

	//Saves an object as a table in an external file
  saveObj: function(filePath, obj, spacing = 25, endLine = "\n", nameTags = true, startTag = '"', endTag = '"', spcChar = " ", fieldEnd = ",", tagSeparator = ":")
  {
  	fs.writeFile(filePath, objToStr(obj, spacing, false, endLine, nameTags, startTag, endTag, spcChar, fieldEnd, tagSeparator), (err) =>
  	{
  		if (err)
  		{
  			this.log("Save failed for the following object: " + filePath + "\nThe error given is: " + err);
  			return;
  		}
  	});
  },

	objToLine: function(obj, tagSeparator = "", startTag = "<", endTag = ">", fieldEnd = ",")
	{
		var str = "";

		if (obj == null)
		{
			return "";
		}

		if (Array.isArray(obj))
		{
			for (var i = 0; i < obj.length; i++)
  		{
  			str += startTag + obj[i] + endTag + fieldEnd + " ";
  		}

			return str.slice(0, str.lastIndexOf(fieldEnd));
		}

		for (var key in obj)
		{
			if (typeof obj[key] === "function")
			{
				continue;
			}

			if (key != "id")
			{
				str += startTag + key + tagSeparator + " x" + valToCell(obj[key], true, "", "") + endTag + fieldEnd + " ";
			}

			else str += startTag + key + tagSeparator + " x" + valToCell(obj[key], false, "", "") + endTag + fieldEnd + " ";
		}

		return str.slice(0, str.lastIndexOf(fieldEnd));
	},

  //Converts a value to a string
  valToString: function(value, separator = ", ")
  {
  	var str = "";

  	if (Array.isArray(value))
  	{
  		for (var i = 0; i < value.length; i++)
  		{
  			str += value[i] + separator;
  		}

			return str.slice(0, str.length - separator.length);
  	}

		else if (typeof value == "object")
		{
			for (var key in value)
			{
				str += key.capitalize() + ": " + value[key] + separator;
			}

			return str.slice(0, str.length - separator.length);
		}

  	else if (value == "")
  	{
  		return ids.EMPTY;
  	}

  	else
  	{
  		return value.toString();
  	}
  },

	log: function(input)
	{
		var d = new Date().toString().replace(" (W. Europe Standard Time)", "");
		d = d.replace(" (Central European Standard Time)", "");

		console.log (d + "\n-- " + input + "\n");

		fs.appendFile("bot.log.report", d + "\r\n-- " + input + "\r\n\n", function (err)
		{
			if (err)
			{
				console.log(err);
			}
		});
	}
}

/**********************************************************************************************************************
**********************************************END OF EXPOSURE**********************************************************
***********************************************************************************************************************/

//Converts the input from a table cell into a value to be pushed into an object or array
function cellToVal(str, expectedType = "", tagChar = '"')
{
	var obj = {};
	var arr = [];
	var tagInd = 0;
	var match = str.match(new RegExp(tagChar, "g"));
	var values = 0; //the number of matches if halved as each value has two tag characters around it

	if (match == null)
	{
		return obj;
	}

	else values = match.length / 2;

	for (i = 0; i < values; i++)
	{
		var nextTag = str.indexOf(tagChar, tagInd) + 1;
		var val = str.slice(nextTag, str.indexOf(tagChar, nextTag)).trim();

		//Set the tag index for the next iteration already
		tagInd = str.indexOf(tagChar, nextTag) + 1;

		//The val is basically equal to "". It's necessary to catch it here because otherwise the slice function of
		//var val declatarion will return a 0, and the bot will take that as val's value (when it really is an empty string)
		if (nextTag == str.indexOf(tagChar, nextTag))
		{
			obj[ids.EMPTY] = ++obj[ids.EMPTY] || 1;
			continue;
		}

		if (val == "none")
		{
			if (Array.isArray(expectedType))
			{
				//arr will be empty
				return [];
			}

			//obj will be empty
			else if (typeof expectedType === "object")
			{
				return {};
			}

			else
			{
				return "none";
			}
		}

		else if (val == "true")
		{
			return true;
		}

		else if (val == "false")
		{
			return false;
		}

		else if (val.length < 16 && (Number.isInteger(+val) || Number.isFloat(+val)))
		{
			return +val;
		}

		else if (typeof val == "string")
		{
			if (typeof expectedType === "string")
			{
				return val;
			}

			else if (Array.isArray(expectedType))
			{
				arr.push(val);
				continue;
			}

			if (val.indexOf("(") == -1)
			{
				obj[val] = val;
				continue;
			}

			else
			{
				var name = val.slice(0, val.indexOf("(")).trim().toLowerCase();
				var amnt = +val.slice(val.indexOf("(") + 1, val.indexOf(")"));

				if (name == ids.EMPTY || name == ids.LOST || name == ids.USED)
				{
					obj[name] = obj[name] + amnt || amnt;
				}

				else obj[name] = amnt;		//If there are parenthesis then there is a value to be added
			}
		}

		else return val;
	}

	if (Array.isArray(expectedType))
	{
		return arr;
	}

	else return obj;
}

function CSVCellToVal(str, expectedType = "", separator = ", ")
{
	var obj = {};
	var arr = [];
	var contents;

	if (str.includes('"'))
	{
		contents = str.replace(/"/g, "").split(separator);
	}

	else contents = [str];

	for (i = 0; i < contents.length; i++)
	{
		if (contents[i] == "none" || contents[i] === "" || contents[i].length <= 0)
		{
			if (Array.isArray(expectedType))
			{
				//arr will be empty
				return [];
			}

			//obj will be empty
			else if (typeof expectedType === "object")
			{
				return {};
			}

			else
			{
				return "";
			}
		}

		else if (contents[i] == "true")
		{
			return true;
		}

		else if (contents[i] == "false")
		{
			return false;
		}

		else if (contents[i].length < 16 && (Number.isInteger(+contents[i]) || Number.isFloat(+contents[i])))
		{
			return +contents[i];
		}

		else if (typeof contents[i] == "string")
		{
			if (typeof expectedType == "string")
			{
				return contents[i];
			}

			else if (Array.isArray(expectedType))
			{
				arr.push(contents[i]);
				continue;
			}

			if (contents[i].indexOf("(") == -1)
			{
				obj[contents[i]] = contents[i];
				continue;
			}

			else
			{
				var name = contents[i].slice(0, contents[i].indexOf("(")).trim().toLowerCase();
				var amnt = +contents[i].slice(contents[i].indexOf("(") + 1, contents[i].indexOf(")"));

				if (name == ids.EMPTY || name == ids.LOST || name == ids.USED)
				{
					obj[name] = obj[name] + amnt || amnt;
				}

				else obj[name] = amnt;		//If there are parenthesis then there is a value to be added
			}
		}

		else return contents[i];
	}

	if (Array.isArray(expectedType))
	{
		return arr;
	}

	else return obj;
}

function objToStr(obj, spacing = 25, translateID = false, endLine = "\n", nameTags = true, startTag = '"', endTag = '"', spcChar = " ", fieldEnd = ",", tagSeparator = ":")
{
	var str = "";

	if (obj == null)
	{
		return "";
	}

	for (var key in obj)
	{
		if (typeof obj[key] === "function")
		{
			continue;
		}

		if (nameTags)
		{
			str += (startTag + key.capitalize() + endTag + tagSeparator + " ").width(spacing);
		}

		else str += (key.capitalize() + tagSeparator + " ").width(spacing);

		if (key != "id" && translateID)
		{
			str += valToCell(obj[key], true, startTag, endTag, spcChar) + fieldEnd + endLine;
		}

		else str += valToCell(obj[key], false, startTag, endTag, spcChar) + fieldEnd + endLine;
	}

	return str.slice(0, str.lastIndexOf(fieldEnd));
}

//Converts an object into a table string to be saved in an external file
function tableToString(table, is2D = false, spacing = 17, spcChar = " ", itemStart = "<", itemEnd = ">", fieldEnd = ",", tagSeparator = ":", tagChar = '"')
{
	var str = "";

	for (var row in table)
	{
		if (typeof table[row] === "function")
		{
			continue;
		}

		//This is an id for the entry of the table so space just that amount
		if (row.length > 16 && Number.isInteger(+row))
		{
			str += (tagChar + row + tagChar).width(22, false, spcChar) + itemStart;
		}

		else str += (tagChar + row.capitalize() + tagChar).width(spacing, false, spcChar) + itemStart;

		if (is2D == true)
		{
			str += tagChar + table[row] + tagChar + itemEnd;
		}

		else
		{
			for (var tag in table[row])
			{
				if (typeof table[row][tag] === "function")
				{
					continue;
				}

				str += tagChar + tag.capitalize() + tagChar + tagSeparator;

				var tagStr = valToCell(table[row][tag], false, tagChar, tagChar);

				if (tagStr.length < 16 && (Number.isInteger(+table[row][tag]) || Number.isFloat(+table[row][tag])))	//If it's a number then no point in spacing behind the value a lot, just make enough space in front for a small length of digits
				{
					tagStr = (tagStr + fieldEnd + " ").width(7, true, spcChar);
				}

				else tagStr = (" " + tagStr + fieldEnd + " ").width(spacing, false, spcChar);

				str += tagStr;
			}
		}

		str = str.slice(0, str.lastIndexOf(tagChar) + 1) + itemEnd + "\n";	//add the separator after the last tag, to start the new item
	}

	return str;
}

function valToCSVCell(val, separator = ', ')
{
	if (typeof val == "object")
	{
		var str = "";

		if ((Array.isArray(val) && val.length == false) || Object.keys(val).length == false)
		{
			return "";
		}

		for (var key in val)
		{
			if (val[key] != key && (Number.isInteger(val[key]) || Number.isFloat(val[key])))
			{
				str += key + " (" + val[key] + ")" + separator;
			}

			else str += val[key] + separator;
		}

		if (separator.includes(",") && ((Array.isArray(val) && val.length > 1) || Object.keys(val).length > 1))
		{
			return '"' + str.slice(0, str.lastIndexOf(separator)) + '"';
		}

		else return str.slice(0, str.lastIndexOf(separator));
	}

	else
	{
		if (val === "" || val == "none")
		{
			return "";
		}

		else return val;
	}
}

//Converts a value into a table cell to be saved in an external file
function valToCell(val, translateID = false, startTag = '"', endTag = '"', spcChar = " ")
{
	if (typeof val == "object")
	{
		var str = "";

		if ((Array.isArray(val) && val.length == false) || !Object.keys(val).length)
		{
			return startTag + "none" + endTag;
		}

		for (var key in val)
		{
			if (val[key] != key && (Number.isInteger(val[key]) || Number.isFloat(val[key])))
			{
				if (translateID && ids[key] && /[\d]/.test(key))
				{
					str += startTag + ids[key] + " (" + val[key] + ")" + endTag + spcChar;
				}

				else str += startTag + key + " (" + val[key] + ")" + endTag + spcChar;
			}

			else
			{
				if (translateID && ids[val[key]] && /[\d]/.test(val[key]))
				{
					str += startTag + ids[val[key]] + endTag + spcChar;
				}

				else str += startTag + val[key] + endTag + spcChar;
			}
		}

		return str.slice(0, str.lastIndexOf(spcChar));
	}

	else
	{
		if (translateID && ids[val] && /[\d]/.test(val[key]))
		{
			return startTag + ids[val] + endTag;
		}

		else return startTag + val + endTag;
	}
}
