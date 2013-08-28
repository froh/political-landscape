/* visualization of the political landscape as induced by Wahl-O-Mat data

 Copyright (C) 2013 Susanne Oberhauser-Hirschoff
 This whole gist is under a BSD-3 clause License (see file BSD-3-License.txt)

 A force based interactive layout of a Wahl-O-Mat http://www.wahl-o-mat.de
 political landscape.

 Each thesis ("These") is represented as a node.
 
 Each political party is represented as a node.
 
 The stance of the party to the thesis is represented as a link from the party to the thesis.

 The 'agreement' is reflected as the default distance of the party to the thesis.
 
 To get the theses reasonably arranged by default, they get a distance to the center,
 and to each other, so they will create a random circle.
 

 The user will also be represented as a node.
 
 The user can strengthen or release her distance to the individual theses:
 click on the link from user to thesis.

 The user can increase or decrease the relevance of the individual theses:
 click on the thesis.
 
 The user can increase or decrease the relevance of each political party:
 click on the party.
 
*/


var W = {
  disagree:2,
  neutral:1,
  agree:0
}

var parse_rows = function(rows) {
    /* 'rows' is an array with the input columns: 
       [  {Thesis: thesis1, Party_x: stance }, ... ]
       
       desired structure:
       
       theses  = [ thesis_1..m ]
       parties = [ party_i..n ]
       stances = [ [thesis_1..m]_1..n ]
    */

  var theses = [],
      parties = null,
      stancesByThesis = [];
  
  var stance2distance = {
    'x': W.disagree,
    '-': W.neutral,
    '#': W.agree
  }
  
  rows.forEach(function(_row) {
    row = _row;
    var thesis = row.These; // 'These' = german for 'thesis', that's hwo the data is.
    // TODO: chop off thesis number?
    theses.push(thesis);
    
    // Set the parties fromt the first row keys.
    if (!parties) {
      parties = d3.keys(row).filter(function(x) {return x !== 'These';});
    }

    var stancesThisRow = [];

    
    parties.forEach( function (party) {
      stancesThisRow.push(row[party]);
    });
    
    stancesThisRow = stancesThisRow.map(function (item) {return stance2distance[item];});

    stancesByThesis.push(stancesThisRow);
  });
  
  var stances = d3.transpose(stancesByThesis);
  
  return {
    theses: theses,
    parties: parties,
    stances: stances
  };
}



/* load the theses */
/* TODO: un-tributary this */
/* TODO: allow for multiple files for different elections */
tributary.trace = true;

var Bayern_2013 = tributary.bayern2013;

var data = parse_rows(Bayern_2013);
//console.log(data);

var graph = {
  nodes: [],
  edges: []
}


/* create node for each thesis */
data.theses.forEach(function (thesis, i) {
  graph.nodes.push(
    { 
      type: 'These',
      label: thesis
    });
})

var nTheses = graph.nodes.length,
    meParty = nTheses;

/* create node for user */
graph.nodes.push(
  { 
    type: 'Wähler',
    label: 'Wähler'
  });

for (var i in d3.range(nTheses)) {
  graph.edges.push(
    { 
      source: meParty,
      target: +i,  // WTF why is i a string here??
      weight: W.neutral,
      type: 'persönliche Meinung'
    });
}

var partyOffset = graph.nodes.length;

/* create node for each party */
data.parties.forEach(function( party, id) {
  graph.nodes.push(
    { 
      type: 'Partei',
      label: party,
      party: party
    });
})

/* create link from each party to each thesis with appropriate weight */
data.stances.forEach( function (partysTheses, partyId) {
  partysTheses.forEach( function (thesisWeight, thesisId) {
    graph.edges.push(
      { 
        source: partyOffset + partyId,
        target: thesisId,
        weight: thesisWeight,
        type: 'Partei Meinung',
        party: data.parties[partyId]
      });
  })
})


h = tributary.sh;
w = tributary.sw;

var force = d3.layout.force()
  .nodes(graph.nodes)
  .links(graph.edges)
  .size([w, h])
  .linkDistance(function (link) {
    return Math.pow(link.weight,2.4) *100 + 30;
  })
  .linkStrength(0.8316)
  .charge(0)
.friction(0.8)
  .start();

//console.log(graph);
//console.log(force);

var partyColor = function () {
  var _partyColor = {
    SPD:"#e2001a",
    Linke:"#FF0000",
    CSU: d3.rgb(0,153,255),
    CDU: "#000",
    Piraten:"#FF8800",
    "Grüne": d3.rgb(100,161,45),
    FW:"#007E84",
    FDP:"#ffd600",
    DVU:"#964B00",
    NPD:"#964B00",
    "ÖDP":"#EA7c13"
  }
  var _generatedColors = {};
  var colorGenerator = d3.scale.category20();
  var nColors = 0;
  return function (party) {
    console.log(party);
    if (party in _partyColor) return _partyColor[party];
    if (party in _generatedColors) return _generatedColors[party];
    return _generatedColors[party] = colorGenerator(nColors++);
  } 
}()

var graceAndStyle = {
  These:   { elem: 'circle', attr: { r:12 }, style: { fill: "#EEEEEE" }},
  Partei:  { elem: 'circle', attr: { r:10 }, style: { fill: partyColor }},
  "Wähler":  { elem: 'circle', attr: { r:7 }, style: { fill: "#ffffff" }},
  "persönliche Meinung":  { elem: 'line', attr: {}, style: {'stroke-width': 2, stroke: "#5EC3D6" }},
  "Partei Meinung":  { elem: '', attr: {}, style: {'stroke-width': function(d){return d.weight*3+1}, stroke: partyColor }}
}

//Create SVG element
svg = d3.select('svg');

			
//Create edges as lines
var edges = svg.selectAll("line")
	.data(graph.edges)
	.enter()
	.append("line")
 .style("stroke", function(d) {
   var f = graceAndStyle[d.type].style.stroke;
   return typeof(f) == 'function'?f(d.party):f; 
 })
	.style("stroke-width",  function(d) {
      f=  graceAndStyle[d.type].style['stroke-width'];
   return typeof(f) == 'function'?f(d):f
 }).style('opacity',0.8);

//Create nodes as circles
var nodes = svg.selectAll("circle")
	.data(graph.nodes)
	.enter()
	.append("circle")
	.attr("r", function(d) {
   return graceAndStyle[d.type].attr.r;
 })
	.style("fill", function(d) {
      var f = graceAndStyle[d.type].style.fill;
      var c;
      if (typeof(f) == 'function') {
        c = f(d.party);
        console.log(c);
      } else {
        c = f;
      }
      return c;
    }).style('opacity',0.9).attr('stroke-width',1).attr('stroke','black').call(force.drag)
    .on('mouseover', function(d) {
      var x = d3.select(this).attr("cx"),
          y = d3.select(this).attr("cy");
      svg.append("text")
  .attr("id", "tooltip")
  .attr("x", x)
  .attr("y", y)
  .attr("text-anchor", "middle")
  .attr("font-family", "sans-serif")
  .attr("font-size", "14px")
  .attr("font-weight", "bold")
  .attr("fill", "black")
  .text(d.label);

    })
    .on('mouseout', function() {
      d3.select("#tooltip").remove();

    })
	;

//Every time the simulation "ticks", this will be called
force.on("tick", function() {

	edges.attr("x1", function(d) { return d.source.x; })
		 .attr("y1", function(d) { return d.source.y; })
		 .attr("x2", function(d) { return d.target.x; })
		 .attr("y2", function(d) { return d.target.y; });
			
	nodes.attr("cx", function(d) { return d.x; })
         .attr("cy", function(d) { return d.y; });
	
});
