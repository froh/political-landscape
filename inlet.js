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
   
   The Neutral stance is represented as a separate node.
   TODO: rename from 'Ich' to 'neutral'

   The user will also be represented as a node.
   
   The user can strengthen or release her distance to the individual theses:
   click on the link from user to thesis.

   The user can increase or decrease the relevance of the individual theses:
   click on the thesis.
   
   The user can increase or decrease the relevance of each political party:
   click on the party.
   
*/


/* load the theses, then display them */
/* TODO: allow for multiple files for different elections */
if (typeof tributary === 'undefined') {
    d3.tsv("bayern2013.tsv", fromDataToDisplay);
} else {
    fromDataToDisplay(tributary.bayern2013, tributary.sh, tributary.sw);
}

var DEBUGME_GLOBAL = {}
function fromDataToDisplay(Bayern_2013_json, w, h) {
    var parties_Theses_Stances = parseRows(Bayern_2013_json);

    var graph = makeGraph(parties_Theses_Stances);
    DEBUGME_GLOBAL.graph = graph;
    visualizeGraph(graph, w, h);
}

var W = {
    disagree: 2,
    neutral: 1,
    agree: 0
}

function parseRows(rows) {
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
        '#': W.agree,
        'y': W.agree
    }

    rows.forEach(function (_row) {
        row = _row;
        var thesis = row.These; // 'These' = german for 'thesis', that's hwo the data is.
        // TODO: chop off thesis number?
        theses.push(thesis);

        // Set the parties fromt the first row keys.
        if (!parties) {
            parties = d3.keys(row).filter(function (x) {
                return x !== 'These';
            });
        }

        var stancesThisRow = [];

        parties.forEach(function (party) {
            stancesThisRow.push(row[party]);
        });

        stancesThisRow = stancesThisRow.map(function (item) {
            return stance2distance[item];
        });

        stancesByThesis.push(stancesThisRow);
    });

    var stances = d3.transpose(stancesByThesis);

    return {
        theses: theses,
        parties: parties,
        stances: stances
    };
}

// nodes
function Node(label) {
    this.label = label;
    return this;
}


function Thesis() {
    Node.apply(this, arguments);
}
Thesis.prototype = new Node;

function Party() {
    Node.apply(this, arguments);
}
Party.prototype = new Node;

function Neutral() {
    Node.apply(this, arguments);
}
Neutral.prototype = new Node;

// edges
function Link(s, t) {
    this.source = s;
    this.target = t;
    return this;
}

function Stance(s, t, a) {
    Link.call(this, s, t);
    this.agreement = a;
    return this;
}
Stance.prototype = new Link;

function makeGraph(data) {
    /* the graph proper */
    var graph = {
        nodes: [],
        edges: []
    }

    /* create node for each thesis */
    data.theses.forEach(function (thesis, i) {
        var node = new Thesis(thesis);
        graph.nodes.push(node);
    })

    var nTheses = graph.nodes.length;
    var neutralStanceId = nTheses;

    /* create node for user and for The Neutral Stance */
    graph.neutralStance = new Neutral('Neutral');
    graph.nodes.push(graph.neutralStance);

    for (var i in d3.range(nTheses)) {
        var edge = new Stance(neutralStanceId, +i, W.neutral);
        graph.edges.push(edge)
    }

    var partyOffset = graph.nodes.length;

    /* create node for each party */
    data.parties.forEach(function (party, id) {
	var p = new Party(party);
	graph.nodes.push(p);
    })

    /* create link from each party to each thesis with appropriate weight */
    data.stances.forEach(function (partysTheses, partyId) {
	partysTheses.forEach(function (thesisWeight, thesisId) {
	    s = new Stance(partyOffset + partyId, thesisId, thesisWeight);
	    graph.edges.push(s);
	})
    })

    return graph;
}

// svg visualization.
// enrich the nodes and edges of the graph with visualization 
Stance.prototype.linkDistance = function () {
    // transform stance.agreement into distance in graph
    return Math.pow(this.agreement, 2.4) * 120 + 10;
}

Stance.prototype.linkStrength = function() {
    var linkStrength = _.object([
	[W.disagree, 1],
	[W.neutral,  0.1],
	[W.agree,    1]
    ]);
    
    return linkStrength[this.agreement];
}

Stance.prototype.pimpLine = function(selection, i) {
    var strokeWidth = _.object([
	[W.disagree, 2],
	[W.neutral,  1],
	[W.agree,    3]
    ]);
    var strokeDasharray = _.object([
	[W.disagree, " 4, 2"],
	[W.neutral,  "2, 2"],
	[W.agree,    "10, 0"]
    ]);
    
    d3.select(selection)
	.style("stroke", this.source.color())
	.style("stroke-width", strokeWidth[this.agreement])
	.style("stroke-dasharray", strokeDasharray[this.agreement])
	.style("opacity", 0.6)
}

Node.prototype.pimpCircle = function(selection, i) {
    d3.select(selection)
	.attr("r", this.radius())
	.style("fill", this.color())
	.style('opacity', 0.9)
	.attr('stroke-width', 1)
	.attr('stroke', 'black');
}

Node.prototype.radius = function() { return this._radius; }
Node.prototype._radius = 7;
Node.prototype.color = function() { return 'grey'; }

Neutral.prototype._radius = 4;
Neutral.prototype.color = function() { return 'white'; }

Party.prototype._radius = 12;
Party.prototype.color = (function() {

    var _partyColors = {
	NEUTRAL	: "#ffffff",
	SPD	: "#e2001a",
	Linke	: "#FF0000",
	CSU	: d3.rgb(0, 153, 255),
	CDU	: "#000",
	Piraten	: "#FF8800",
	"Grüne"	: d3.rgb(100, 161, 45),
	Frauen	: "#7F1E48",
	FW	: "#007E84",
	FDP	: "#ffd600",
	REP	: "#964B00",
	NPD	: "#964B00",
	"ÖDP"	: "#EA7c13"
    }
    var colorGenerator = d3.scale.category20();
    var _generatedColors = {};
    var nColors = 0;
    return function partyColor() {

	party = this.label;

	if (party in _partyColors) return _partyColors[party];
	if (party in _generatedColors) return _generatedColors[party];
	return _generatedColors[party] = colorGenerator(nColors++);
    }
}())

function visualizeGraph(graph, w, h) {

    w = w || 1200;
    h = h || 1000;

    graph.neutralStance.x = w/2;
    graph.neutralStance.y = h/2;
    graph.neutralStance.fixed = true;

    var force = d3.layout.force()
	.nodes(graph.nodes)
	.links(graph.edges)
	.size([w, h])
	.linkDistance( function(s, i) { return s.linkDistance(); } )
	.linkStrength( function(s, i) { return s.linkStrength(); })
	.charge(10)
	.friction(0.9)
	.start();

    var svg = d3.select('svg');

    var edges = svg.selectAll("line")
	.data(graph.edges)
	.enter()
	.append("line")
	.each(function (d, i) { d.pimpLine(this, i) });

    //Create nodes as circles
    var nodes = svg.selectAll("circle")
	.data(graph.nodes)
	.enter()
	.append("circle")
	.each(function(d, i) { d.pimpCircle(this, i) })
	.call(force.drag)
	.on('mouseover', function (d) {
            var x = d3.select(this).attr("cx"),
            y = d3.select(this).attr("cy");
            svg.append("text")
		.attr("id", "tooltip")
		.attr("x", x)
		.attr("y", y)
		.attr('pointer-events', 'none')
		.attr("text-anchor", "middle")
		.attr("font-family", "sans-serif")
		.attr("font-size", "14px")
		.attr("font-weight", "bold")
		.attr("fill", "black")
		.text(d.label);

	})
	.on('mouseout', function () {
            d3.select("#tooltip").remove();
	});


    force.on("tick", function () {

	edges
	    .attr("x1", function (d) {
		return d.source.x;
            })
            .attr("y1", function (d) {
		return d.source.y;
            })
            .attr("x2", function (d) {
		return d.target.x;
            })
            .attr("y2", function (d) {
		return d.target.y;
            });

	nodes.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
		return d.y;
            });

    });  
}
