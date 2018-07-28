var band_values;
$(document).ready(function() {

    // get band values
    getdata();

});

// adds bands as svg rectangles to the page and other svg elements
function add_svg()
{
    // using d3.js functions
    let svg = d3.select("body").append("svg");
    svg.attr("height", "100%");
    svg.attr("width", "100%");

    // find number of keys
    let keycount = 0;
    for (var key in band_values) {
        if (band_values.hasOwnProperty(key) && !["averages", "maxvals", "minvals", "number", "totalnumber"].includes(key)) {
            keycount += 1;
        }
    }
    keycount += 1;

    // add bands for each key
    let currcount = 1;
    let axisheight = $(window).height() / 2;
    let axisydist = $(window).height() / 1.5;
    let axislow;
    let axishigh;

    for (var key in band_values) {
        if (band_values.hasOwnProperty(key) && !["averages", "maxvals", "minvals", "number", "totalnumber"].includes(key)) {

            axislow = 1.1 * band_values["minvals"][key] - 0.1 * band_values["maxvals"][key];
            axishigh = 1.1 * band_values["maxvals"][key] - 0.1 * band_values["minvals"][key];

            keybands = svg.selectAll("." + key + "bar")
            .data(band_values[key])
            .enter().append("g")
            .attr("class", "bargroup");

            // add bands
            keybands.append("rect")
            .attr("class", "." + key + "bar")
            .style("fill", function() { if(currcount % 2) return "green"; else return "blue";})
            .attr("height", "6")
            .attr("width", "30")
            .attr("x", currcount * $(window).width() / keycount + 5)
            .attr("y", function(datapoint, index) { return (axisydist - ((datapoint - axislow)/(axishigh - axislow)) * axisheight) - 3;})
            .attr("opacity", function(datapoint, index) { return Math.sqrt(band_values["number"][key][index] / band_values["totalnumber"][key]);});

            // add text
            keybands.append("svg:text")
            .text(function(datapoint) { return Math.round(datapoint * 100) / 100; })
            .attr("class", "text")
            .attr("x", currcount * $(window).width() / keycount)
            .attr("dx", "45")
            .attr("y", function(datapoint, index){ return (axisydist - ((datapoint - axislow)/(axishigh - axislow)) * axisheight);})
            .attr("dy", "0.45em");

            // add average value and text
            svg.append("rect")
            .style("fill", "gray")
            .attr("height", "1")
            .attr("width", "50")
            .attr("x", currcount * $(window).width() / keycount + 5)
            .attr("y", axisydist - ((band_values["averages"][key] - axislow)/(axishigh - axislow)) * axisheight - 0.5);

            svg.append("svg:text")
            .text(Math.round(band_values["averages"][key] * 100) / 100)
            .attr("x", currcount * $(window).width() / keycount)
            .attr("dx", "4em")
            .attr("y", axisydist - ((band_values["averages"][key] - axislow)/(axishigh - axislow)) * axisheight - 1.5)
            .attr("dy", "0.45em")
            .attr("text-anchor", "right");

            // add axes
            var keyaxisScale = d3.scaleLinear()
            .domain([axislow, axishigh])
            .range([axisheight, 0]);

            var keyyAxis = d3.axisLeft()
            .ticks(10)
            .scale(keyaxisScale);

            svg.append("g")
            .attr("transform", "translate(" + (currcount * $(window).width() / keycount) + "," + (axisydist - axisheight) + ")")
            .call(keyyAxis);

            svg.append("svg:text")
            .text(key)
            .attr("class", "labels")
            .attr("x", currcount * $(window).width() / keycount)
            .attr("y", 1.1 * axisydist)
            .attr("text-anchor", "middle");

            currcount += 1;
        }
    }

    // add heading, sub-heading text
    svg.append("svg:text")
    .text("A Western-Blot Plot")
    .attr("class", "heading")
    .attr("x", "50%")
    .attr("y", "6%")
    .attr("text-anchor", "middle");

    svg.append("svg:text")
    .text("The Western-Blot Plot generated from your dataset.")
    .attr("class", "subheading")
    .attr("x", "50%")
    .attr("y", 1.23 * axisydist)
    .attr("text-anchor", "middle");

    svg.append("svg:text")
    .text("Every colored band represents a cluster of values within a multiple of a standard deviation away from the mean - represented by the thin grey band.")
    .attr("class", "subheading")
    .attr("x", "50%")
    .attr("y", 1.25 * axisydist)
    .attr("dy", "1.5em")
    .attr("text-anchor", "middle");

    svg.append("svg:text")
    .text("The opacity of each band is proportional to the square-root of the fraction of datapoints in the band.")
    .attr("class", "subheading")
    .attr("x", "50%")
    .attr("y", 1.25 * axisydist)
    .attr("dy", "3em")
    .attr("text-anchor", "middle");

    svg.append("svg:text")
    .text("Hover over a band to see the average of these datapoints.")
    .attr("class", "subheading")
    .attr("x", "50%")
    .attr("y", 1.25 * axisydist)
    .attr("dy", "4.5em")
    .attr("text-anchor", "middle");

    svg.append("svg:text")
    .text("Built with node.js and d3.js. See the source code")
    .attr("class", "subheading")
    .attr("x", "50%")
    .attr("dx", "-1em")
    .attr("y", "90%")
    .attr("dy", "4.5em")
    .attr("text-anchor", "middle");

    svg.append("svg:a")
    .attr("xlink:href", "https://github.com/ameya98/JSBlot")
    .append("svg:text")
    .text("here.")
    .attr("class", "link")
    .attr("x", "50%")
    .attr("dx", "10em")
    .attr("y", "90%")
    .attr("dy", "4.5em")
    .attr("text-anchor", "middle");

}

// get data processed already with a POST request
function getdata()
{
    $.ajax({
           type: "POST",
           url: "/uploads",
           data: {
               filename: localStorage.getItem('filename'),
               stringID: localStorage.getItem('ID'),
               serverID: window.location.href.split("/").pop().replace("plot", ""),
           },
           success: function (response) {
               console.log('Success! Server responded with');
               console.log(response);

               band_values = JSON.parse(response);
               console.log(band_values);

               add_svg();
           },
           error: function() {
               window.location.replace('/');
           }
       });
}
