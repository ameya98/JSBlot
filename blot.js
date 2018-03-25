// code
var data_array = {height : [], weight : []};
filldata();

var band_values = calculatebands();
console.log(band_values);

// using d3.js functions
let svg = d3.select("body").append("svg");
svg.attr("height", "100%");
svg.attr("width", "100%");

// add bands
heightbands = svg.selectAll(".heightbar")
            .data(band_values.height)
            .enter().append("g")
            .attr("class", "heightgroup");

heightbands.append("rect")
            .attr("class", "heightbar")
            .attr("height", "6")
            .attr("width", "30")
            .attr("x", "25%")
            .attr("y", function(datapoint, index) { return (400 - datapoint);})
            .attr("opacity", function(datapoint, index) { return 1.0 - 3.0 * Math.abs((datapoint - average(data_array.height)) / average(data_array.height));});

weightbands = svg.selectAll(".weightbar")
                .data(band_values.weight)
                .enter().append("g")
                .attr("class", "weightgroup");


weightbands.append("rect")
            .attr("class", "weightbar")
            .attr("height", "6")
            .attr("width", "30")
            .attr("x", "75%")
            .attr("y", function(datapoint, index) { return (400 - 2.5 * datapoint);})
            .attr("opacity", function(datapoint, index) { return 1.0 - 3.5 * Math.abs((datapoint - average(data_array.weight)) / average(data_array.weight));});


// add text
heightbands.append("svg:text")
            .text(function(datapoint) { return Math.round(datapoint * 100) / 100 + " cm"; })
                .attr("class", "text")
                .attr("x", "27.8%")
                .attr("y", function(datapoint, index) { return (410 - datapoint);});

weightbands.append("svg:text")
            .text(function(datapoint) { return Math.round(datapoint * 100) / 100 + " kg"; })
                .attr("class", "text")
                .attr("x", "77.8%")
                .attr("y", function(datapoint, index) { return (410 - 2.5 * datapoint);});

// add axes
var heightaxisScale = d3.scaleLinear()
              .domain([0, 1.8 * d3.mean(band_values.height)])
              .range([1.8 * d3.mean(band_values.height), 0]);

var heightyAxis = d3.axisLeft()
                  .ticks(10)
                  .scale(heightaxisScale);

svg.append("g")
    .attr("transform", "translate(" + String(0.24 * d3.select("body").node().getBoundingClientRect().width) + ", " + String(403 - 1.8 * d3.mean(band_values.height)) + ")")
    .call(heightyAxis);

var weightaxisScale = d3.scaleLinear()
              .domain([0, 1.8 * d3.mean(band_values.weight)])
              .range([4.5 * d3.mean(band_values.weight), 0]);

var weightyAxis = d3.axisLeft()
                  .ticks(10)
                  .scale(weightaxisScale);


svg.append("g")
    .attr("transform", "translate(" + String(0.74 * d3.select("body").node().getBoundingClientRect().width) + ", " + String(403 - 4.5 * d3.mean(band_values.weight)) + ")")
    .call(weightyAxis);

// add heading, sub-heading text
svg.append("svg:text")
    .text("A Western-Blot Plot")
    .attr("class", "heading")
    .attr("x", "50%")
    .attr("y", "30%")
    .attr("text-anchor", "middle");

svg.append("svg:text")
    .text("by Ameya Daigavane")
    .attr("class", "subheading")
    .attr("x", "57.2%")
    .attr("y", "33%")
    .attr("text-anchor", "middle");

svg.append("svg:text")
    .text("Height")
    .attr("class", "heading")
    .attr("x", "30%")
    .attr("y", "62.8%")
    .attr("text-anchor", "middle");

svg.append("svg:text")
    .text("centimetres")
    .attr("class", "subheading")
    .attr("x", "27.3%")
    .attr("y", "46%")
    .attr("text-anchor", "middle");

svg.append("svg:text")
    .text("Weight")
    .attr("class", "heading")
    .attr("x", "70%")
    .attr("y", "62.8%")
    .attr("text-anchor", "middle");

svg.append("svg:text")
    .text("kilograms")
    .attr("class", "subheading")
    .attr("x", "77%")
    .attr("y", "46%")
    .attr("text-anchor", "middle");

// function definitions
// returns average of array of numbers
function average(values_array)
{
    let averageval = 0;
    for(i = 0; i < values_array.length; ++i)
    {
        averageval += values_array[i];
    }

    averageval /= values_array.length;
    return averageval;
}

// fill global data_array with random data.
function filldata()
{
    for(let i = 0; i < 50; ++i)
    {
        data_array.height.push(150 + (-30 + 60 * Math.random()));
        data_array.weight.push(60 + (-10 + 20 * Math.random()));
    }
}


function calculatebands()
{
    let squareheightsum = 0, minheight = Infinity, maxheight = 0;
    let squareweightsum = 0, minweight = Infinity, maxweight = 0;

    // calculate sums, squaredsums, min, and max of each property
    for(let i = 0; i < 50; ++i)
    {
        squareheightsum += data_array.height[i] * data_array.height[i];
        squareweightsum += data_array.weight[i] * data_array.weight[i];

        minheight = Math.min(minheight, data_array.height[i]);
        maxheight = Math.max(maxheight, data_array.height[i]);

        minweight = Math.min(minweight, data_array.weight[i]);
        maxweight = Math.max(maxweight, data_array.weight[i]);

    }

    // applying the standard formulas
    let averageheight = average(data_array.height);
    let averageweight = average(data_array.weight);

    let stddevheight = Math.sqrt(squareheightsum / data_array.height.length - (averageheight * averageheight));
    let stddevweight = Math.sqrt(squareweightsum / data_array.weight.length - (averageweight * averageweight));

    let numheightdeviations = 1 + Math.ceil((maxheight - minheight) / stddevheight);
    let numweightdeviations = 1 + Math.ceil((maxweight - minweight) / stddevweight);

    // to check :
    console.log(averageheight, stddevheight, numheightdeviations, averageweight, stddevweight, numweightdeviations);

    // create bands for heights
    heightbands = []
    for(let numband = 0; numband < numheightdeviations; ++numband)
    {
        heightbands.push([]);
    }

    let bandnumber = 0;
    for(let i = 0; i < 50; ++i)
    {
        bandnumber = Math.floor(0.5 + Math.abs((minheight - averageheight) / stddevheight)) + Math.floor(0.5 + ((data_array.height[i] - averageheight) / stddevheight));
        heightbands[bandnumber].push(data_array.height[i]);
    }

    // create bands for weights
    weightbands = []
    for(let numband = 0; numband < numweightdeviations; ++numband)
    {
        weightbands.push([]);
    }

    bandnumber = 0;
    for(let i = 0; i < 50; ++i)
    {
        bandnumber = Math.floor(0.5 + Math.abs((minweight - averageweight) / stddevweight)) + Math.floor(0.5 + ((data_array.weight[i] - averageweight) / stddevweight));
        weightbands[bandnumber].push(data_array.weight[i]);
    }

    // to check:
    // console.log(heightbands, weightbands);

    // replace values in each band by averages
    for(let i = 0; i < numheightdeviations; ++i)
    {
        if(heightbands[i] != null) {
            heightbands[i] = average(heightbands[i]);
        }
    }

    for(let i = 0; i < numweightdeviations; ++i)
    {
        if(weightbands[i] != null) {
            weightbands[i] = average(weightbands[i]);
        }
    }

    // to check:
    // console.log(heightbands, weightbands);

    // possibly remove last element if NaN
    if(isNaN(heightbands[heightbands.length - 1]))
    {
        heightbands.pop();
    }

    if(isNaN(weightbands[weightbands.length - 1]))
    {
        weightbands.pop();
    }

    averages = {height : heightbands, weight: weightbands};
    return averages;

}
