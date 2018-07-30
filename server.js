// function definitions
// returns average of array of numbers
function average(values_array)
{
    var averageval = 0;
    for(i = 0; i < values_array.length; ++i)
    {
        averageval += values_array[i];
    }

    averageval /= values_array.length;
    return averageval;
}

// calculates band values
function calculate_bands(data_array)
{
    averages = {"averages": {}, "maxvals": {}, "minvals": {}, "number": {}, "totalnumber": {}};
    for (var key in data_array) {
        if (data_array.hasOwnProperty(key)) {

            let squaresum = 0, minval = Infinity, maxval = 0;

            // calculate sums, squaredsums, min, and max of each property
            for(let i = 0; i < data_array[key].length; ++i)
            {
                squaresum += data_array[key][i] * data_array[key][i];

                minval = Math.min(minval, data_array[key][i]);
                maxval = Math.max(maxval, data_array[key][i]);
            }

            // applying standard equations for the standard deviation
            let averageval = average(data_array[key]);
            let stddevval = Math.sqrt(squaresum / data_array[key].length - (averageval * averageval));

            if(stddevval == 0)
            {
                averages[key] = [averageval];
                averages["averages"][key] = averageval;
                averages["maxvals"][key] = maxval;
                averages["minvals"][key] = minval;
                averages["number"][key] = [data_array[key].length];
                averages["totalnumber"][key] = data_array[key].length;

                continue;
            }

            let numdeviations = 1 + Math.ceil((maxval - minval) / stddevval);

            // create bands for this key
            keybands = []
            for(let numband = 0; numband < numdeviations; ++numband)
            {
                keybands.push([]);
            }

            let bandnumber = 0;
            for(let i = 0; i < data_array[key].length; ++i)
            {
                bandnumber = Math.floor(0.5 + Math.abs((minval - averageval) / stddevval)) + Math.floor(0.5 + ((data_array[key][i] - averageval) / stddevval));
                keybands[bandnumber].push(data_array[key][i]);
            }

            console.log(key, "has bands", keybands);

            // remove empty bands
            var tempbands = [];
            for(let i = 0; i < numdeviations; ++i)
            {
                if(keybands[i].length > 0)
                {
                    tempbands.push(keybands[i]);
                }
            }
            keybands = tempbands;

            // replace values in each band by averages
            averages["number"][key] = [];
            for(let i = 0; i < keybands.length; ++i)
            {
                averages["number"][key].push(keybands[i].length);
                keybands[i] = average(keybands[i]);
            }

            averages[key] = keybands;
            averages["averages"][key] = averageval;
            averages["maxvals"][key] = maxval;
            averages["minvals"][key] = minval;
            averages["totalnumber"][key] = data_array[key].length;

        }
    }

    return averages;

}

// the actual node.js + express.js stuff
var fs = require('fs');
var express = require('express');
var mustache = require('mustache');
var fileUpload = require('express-fileupload');
var util = require('util');
var app = express();

// security
var usedstringIDs = new Set();
var usedserverIDs = new Set();
var idmap = new Map();

app.use("/assets", express.static(__dirname + 'assets'));
app.use("/", express.static(__dirname));

app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 },
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", function(request, response){
    response.sendFile(__dirname + "/assets/html/index.html");
})

app.post("/process", function(request, response){

   if (!request.files){
        return response.status(400).send('No files were uploaded.');
   }
   else {

       let sampleFile = request.files.sampleFile;
       let stringID = request.body.ID;

       // check if valid ID
       if(isNaN(stringID) || !usedstringIDs.has(Number(stringID))){
           console.log(usedstringIDs, stringID, Number(stringID));
           console.log(usedstringIDs.has(Number(stringID)));

           throw new Error("Invalid ID.");
       }

       // Place the file in uploads folder
       sampleFile.mv(__dirname + "/uploads/" + (sampleFile.name.split(".")[0]) + stringID + ".csv", function(err) {
           if(err){
               return response.status(500).send(err);
           }
       });

       // Parse file line by line
       var lineReader = require('readline').createInterface({
           input: require('fs').createReadStream(__dirname + "/uploads/" + (sampleFile.name.split(".")[0]) + stringID + ".csv")
       });

       var firstline = true;
       var data_arrays = {};
       var keys = [];
       var splitline;
       var linelength;
       var failflag = false;
       var numlines = 0;

       lineReader.on('line', function parseline (line) {

           splitline = line.split(",");
           numlines += 1;

           if(firstline)
           {
               firstline = false;
               console.log('First line from file:', line);

               keys = splitline;
               linelength = keys.length;
               console.log('keys', keys);

               for(var i = 0; i < linelength; i += 1)
               {
                   data_arrays[keys[i]] = [];
               }
           }
           else {
               console.log('Line from file:', line);

               if(splitline.length != linelength) {

                   console.log("Error in file.");

                   failflag = true;
                   lineReader.emit('close');
                   lineReader.removeListener('line', parseline);

                   return response.sendFile(__dirname + "/assets/html/error.html");

               }

               for(var i = 0; i < linelength; i += 1)
               {
                   // empty string or only whitespace
                   if(!splitline[i].trim()){
                       continue;
                   }

                   // check if data entry is a number!
                   if(!isNaN(splitline[i]) && !isNaN(parseFloat(splitline[i]))) {
                       data_arrays[keys[i]].push(Number(splitline[i]));
                   }
                   else {
                       console.log("Error in file.");

                       failflag = true;
                       lineReader.emit('close');
                       lineReader.removeListener('line', parseline);

                       return response.sendFile(__dirname + "/assets/html/error.html");
                   }
               }
           }
       });

       lineReader.on('close', function onclose() {

           if(!failflag && (numlines > 1)) {

               // now calculate band values
               var band_values = calculate_bands(data_arrays);
               console.log("band_values is", band_values);

               // save file
               fs.writeFileSync(__dirname + "/uploads/" + (sampleFile.name.split(".")[0]) + stringID + "_processed.json", JSON.stringify(band_values))

               console.log("The file was saved with name:", "/uploads/" + (sampleFile.name.split(".")[0]) + stringID + "_processed.json");

               // add to idmap
               var serversideID = Math.floor(Math.random() * 100000000);
               while(usedserverIDs.has(serversideID))
               {
                   serversideID = Math.floor(Math.random() * 100000000);
               }

               usedserverIDs.add(serversideID);
               idmap.set(Number(stringID), serversideID);

               console.log(idmap);

               // redirect to /plot/ URL
               response.redirect("/plot" + serversideID);
               return;
           }

       });
   }

})

app.get("/plot:ID", function(request, response){
    if(usedserverIDs.has(Number(request.params.ID))) {
        return response.sendFile(__dirname + "/assets/html/visual.html");
    }
    else {
        return response.sendFile(__dirname + "/assets/html/error.html");
    }
})

app.get("/sample", function(request, response){
    return response.sendFile(__dirname + "/assets/html/sample.html");
})

app.post("/getsample", function(request, response){
    fs.readFile(__dirname + "/uploads/sample/sample.json", function(err, data){
        if(err) {
             throw new Errors(err);
        }

        response.send(data);
    });
})

app.post("/uploads", function(request, response){

    if(String(idmap.get(Number(request.body.stringID))) != request.body.serverID){
        console.log(Number(request.body.stringID), request.body.serverID);
        console.log(idmap);
        throw new Error("Invalid URL.");
    }

    fs.readFile(__dirname + "/uploads/" + request.body.filename + request.body.stringID + "_processed.json", function(err, data){
        if(err) {
             throw new Error(err);
        }

        var csvpath = __dirname + "/uploads/" + request.body.filename + request.body.stringID + ".csv";
        if (fs.existsSync(csvpath)) {
            fs.unlink(csvpath, function(err){
                if(err) {
                    throw new Error(err);
                }

                console.log(csvpath + " deleted.");
                response.send(data);

            })
        }
        else {
            response.send(data);
        }
    });
})

app.post("/generateID", function(request, response){

    var stringID = Math.floor(Math.random() * 100000000);
    while(usedstringIDs.has(stringID))
    {
        stringID = Math.floor(Math.random() * 100000000);
    }

    usedstringIDs.add(stringID);
    response.send(String(stringID));
})

app.listen(( process.env.PORT || 5000 ));
console.log("Server on.");
