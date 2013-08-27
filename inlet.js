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
console.log(data);

var graph = {
  nodes: [],
  edges: []
}

/* create node for each thesis */
for (var i in data.theses) {
  graph.nodes.push(
    { 
      type: 'These',
      label: i
    });
}
var nTheses = graph.nodes.length,
    ichParty = nTheses;

/* create node for user */
graph.nodes.push(
  { 
    type: 'Partei',
    label: 'Ich'
  });

for (i in d3.range(nTheses)) {
  graph.edges.push(
    { 
      source: meParty,
      target: i,
      weight: W.neutral
    });
}
h = tributary.sh;
w = tributary.sw;

var force = d3.layout.force()
  .nodes(graph.nodes)
  .links(graph.edges)
  .size([w, h])
  .linkDistance([50])
  .charge([-100])
  .start();

svg = d3.select('svg');
svg.append('circle').attr('r',81).attr({'cx':308,cy:200});

/* create node for each party */
/* create link from each party to each thesis */
