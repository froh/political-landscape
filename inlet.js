'use strict';
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

   The user will also be represented as a node.
   
   The user can strengthen or release her distance to the individual theses:
   click on the link from user to thesis.

   The user can increase or decrease the relevance of the individual theses:
   click on the thesis.
   
   The user can increase or decrease the relevance of each political party:
   click on the party.
   
*/

var graph;
/* load the theses, then display them */
/* TODO: allow for multiple files for different elections */
d3.tsv("bayern2013.tsv")
    .then(Bayern_2013_json => parseRows(Bayern_2013_json))
    .then(parties_Theses_Stances => makeGraph(parties_Theses_Stances))
    .then(g => {
    	graph = g;
    	visualizeGraph(graph);
    });

/**************************************************************************/

const W = {
    disagree: 2,
    neutral: 1,
    agree: 0
}



function parseRows(rows) {
    /* 'rows' is an array with the input columns: 
       [  {These: thesis1, Party_x: stance }, ... ]
       
       desired structure:
       
       theses  = [ thesis_1..m ]
       parties = [ party_i..n ]
       stances = [ [thesis_1..m]_1..n ]
    */

// we get the data in an adjacency matrix.
// the matrix matches each party (column) to each stance (row).
// each adjacency cell encodes agreement of the party with the stance.
// the first column contains the description of the thesis.
// the party name is the column label of all other columns.


// this matrix needs to be transformed into a graph.

// in the graph we have two node types, theses and parties
// the theses and the parties are linked with the stances (of each party to each thesis)

// now.

// d3js svg expects to recieve the nodes and the edges as two JS arrays.
// the mapping of attributes 

// the d3js force simulation expects the same nodes, and in addition the links (edges)
// as an array of "link" objects with attributes source and target,
// each the actual node objects.

	var theses = [],
	parties = null,
	stancesByThesis = [];

	const stance2distance = {
		'x': W.disagree,
		'-': W.neutral,
		'#': W.agree,
		'y': W.agree
	}

	// Set the parties fromt the first row keys.
	parties = Object.keys(rows[0]).filter(function (x) {
				return x !== 'These';
			});

	rows.forEach(function (row) {
		var thesis = row.These; // 'These' = german for 'thesis', that's how the data is.
		// TODO: chop off thesis number from text?
		// "7. Ah blah e spah njol.", chop off the "7. "?
		theses.push(thesis);

		var stancesThisRow = [];

		parties.forEach(function (party) {
			var stance = row[party];
			var distance = stance2distance[stance];
			stancesThisRow.push(distance);
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
class Node {
	constructor(label) {
		this.label = label;
		this.source_for = [];
		this.target_for = [];
		return this;
}}

class Thesis extends Node {
	constructor(...args) {
		super(...args);
}}

class Party extends Node {
	constructor(...args) {
		super(...args);
}}

class Neutral extends Node {
	constructor(...args) {
		super(...args);
}}

// edges
class Link{
	constructor(s, t) {
		this.source = s;
		this.target = t;
		s.source_for.push(this);
		t.target_for.push(this);
		return this;
}}

class Stance extends Link {
	constructor(s, t, a) {
		super(s, t);
		this.agreement = a;
		return this;
}}

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

	var N = graph.nodes;
	for (var i in d3.range(nTheses)) {
		var edge = new Stance(graph.neutralStance, N[i], W.neutral);
		graph.edges.push(edge);
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
			var s = new Stance(N[partyOffset + partyId], N[thesisId], thesisWeight);
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
	const _linkStrength = new Map([
		[W.disagree, 1],
		[W.neutral,  0.1],
		[W.agree,    1]
	]);

	return _linkStrength.get(this.agreement);
}

Stance.prototype.strokeWidth = function() {
	const strokeWidth = new Map([
		[W.disagree, 2],
		[W.neutral,  1],
		[W.agree,    3]
	]);

	return strokeWidth.get(this.agreement);
}

Stance.prototype.strokeDasharray = function() {
	const strokeDasharray = new Map([
		[W.disagree, " 4, 2"],
		[W.neutral,  "2, 2"],
		[W.agree,    "10, 0"]
	]);

	return strokeDasharray.get(this.agreement);
}

Node.prototype.radius = function() { return this._radius; }
Node.prototype._radius = 7;
Node.prototype.color = function() { return 'grey'; }

Neutral.prototype._radius = 4;
Neutral.prototype.color = function() { return 'white'; }

Party.prototype._radius = 12;
Party.prototype.color = (function makecolorgenerator() {

	const _partyColors = {
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
	var colorScale = d3.schemeCategory10;
	var _generatedColors = {};
	var nColors = 0;
	return function partyColor() {

		var party = this.label;

		if (party in _partyColors) return _partyColors[party];
		if (party in _generatedColors) return _generatedColors[party];
		if (nColors++ >= colorScale.length) throw "not enough party colors";
		return _generatedColors[party] = colorScale[nColors++];
	}
}())

function visualizeGraph(graph, w, h) {

	w = w || 1200;
	h = h || 1000;

	graph.neutralStance.fx = 0;
	graph.neutralStance.fy = 0;

	// create the svg

	var svg = d3.select('svg');
	svg.attr("viewBox", [-w/2, -h/2, w, h]);

	var edges = svg.selectAll("line")
		.data(graph.edges)
		.enter()
		.append("line")
			.style("stroke", d => d.target.color())
			.style("stroke-width", d => d.strokeWidth())
			.style("stroke-dasharray", d => d.strokeDasharray())
			.style("opacity", 0.6)

	//Create nodes as circles
	var nodes = svg.selectAll("circle")
		.data(graph.nodes)
		.enter()
		.append("circle")
			.attr("r", d => d.radius())
			.style("fill", d => d.color())
			.style('opacity', 0.9)
			.attr('stroke-width', 1)
			.attr('stroke', 'black');

	// create a tooltip description on the nodes
	nodes = nodes
	.on('mouseover', function (e, d) {
		var
			x = d3.select(this).attr("cx"),
			y = d3.select(this).attr("cy");
		svg
			.append("text")
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


	// animate the graph
	var simulation = d3.forceSimulation().stop();
	simulation
		.nodes(graph.nodes);
	simulation
		.velocityDecay(0.9)
		.force("link", d3.forceLink()
			.distance( function(s, i) { return s.linkDistance(); } )
			.strength( function(s, i) { return s.linkStrength(); } )
			.links(graph.edges)
		)
		.force("charge", d3.forceManyBody()
			.strength(10)
		).force("center", d3.forceCenter());

	simulation.on("tick", function () {

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

	nodes.call(drag(simulation));

	function drag(/*simulation*/) {
		function startdrag(event) {
			// reheat the simulation
			//if (!event.active) simulation.alphaTarget(0.3).restart();
			// fix the dragged thing, .fx and .fy override the force simulation
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
		}
		function dodrag(event) {
			// move it to where the pointer goes
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}
		function enddrag(event) {
			//if (!event.active) simulation.alphaTarget(0);
			// release the dragged thing back to the force simulation
			event.subject.fx = null;
			event.subject.fy = null;
		}
		return d3.drag()
		.on("start", startdrag)
		.on("drag", dodrag)
		.on("end", enddrag)
	}


	simulation.restart();
}

;
