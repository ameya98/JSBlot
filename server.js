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
var fileuploaded = false;
var app = express();

app.use("/assets", express.static(__dirname + 'assets'));
app.use("/", express.static(__dirname));

app.use(fileUpload());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", function(request, response){

    fileuploaded = false;
    response.sendFile(__dirname + "/index.html");

})

app.post("/process", function(request, response){

   if (!request.files){
        return response.status(400).send('No files were uploaded.');
   }
   else {

       let sampleFile = request.files.sampleFile;
       let stringID = request.body.ID;

       // Place the file in uploads folder
       sampleFile.mv(__dirname + "/uploads/" + (sampleFile.name.split(".")[0]) + stringID + ".csv", function(err) {
           if (err)
           return response.status(500).send(err);
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

                   return response.status(500).send("Incorrect entry in csv file - check line " + String(data_arrays[keys[0]].length + 2) + ": " + line);
               }

               for(var i = 0; i < linelength; i += 1)
               {
                   data_arrays[keys[i]].push(Number(splitline[i]));
               }
           }
       });

       lineReader.on('close', function () {

           if(!failflag && (numlines > 1)) {

               console.log("data_arrays is", data_arrays);

               // now calculate band values
               var band_values = calculate_bands(data_arrays);
               console.log("band_values is", band_values);

               fs.writeFileSync(__dirname + "uploads/" + (sampleFile.name.split(".")[0]) + stringID + "_processed.json", JSON.stringify(band_values))

               console.log("The file was saved with name:", "/uploads/" + (sampleFile.name.split(".")[0]) + stringID + "_processed.json");
               fileuploaded = true;

               // redirect to /plot/ URL
               response.redirect('/plot');
               return;
           }
           else {
               // back to the main page!
               response.redirect('/');
               return;
           }

       });
   }

})

app.get("/plot", function(request, response){

    if(fileuploaded) {
        response.sendFile(__dirname + "/visual.html");
    }
    else {
        return response.redirect('/');
    }
})

app.post("/uploads", function(request, response){
    fs.readFile(__dirname + "/uploads/" + request.body.filename + request.body.ID + "_processed.json", function(err, data){
        if(err) {
            return console.log(err);
        }

        var csvpath = __dirname + "/uploads/" + request.body.filename + request.body.ID + ".csv";
        if (fs.existsSync(csvpath)) {
            fs.unlink(csvpath, function(err){
                if(err) {
                    return console.log(err);
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


app.listen(( process.env.PORT || 5000 ));
console.log("Server on.");
