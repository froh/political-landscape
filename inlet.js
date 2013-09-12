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
        edges: [],
    }

    /* create node for each thesis */
    data.theses.forEach(function (thesis, i) {
        var node = new Thesis(thesis);
        graph.nodes.push(node);
    })

    var nTheses = graph.nodes.length;
    var neutralStanceId = nTheses;

    /* create node for user and for The Neutral Stance */
    graph.neutralStance = new Party('Neutral');
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
    return Math.pow(this.agreement, 2.4) * 110 + 20;
}

Stance.prototype.pimpLine = function(selection, i) {
    var strokeWidth = _.object([
	[W.disagree, 2],
	[W.neutral,  2],
	[W.agree,    3]
    ]);
    var strokeDasharray = _.object([
	[W.disagree, " 7, 3"],
	[W.neutral,  " 2, 2"],
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

Node.prototype.radius = function() { return 6; }
Node.prototype.color = function() { return 'white'; }

Party.prototype.radius = function() { return 12; }
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

    var force = d3.layout.force()
	.nodes(graph.nodes)
	.links(graph.edges)
	.size([w, h])
	.linkDistance( function(s, i) { return s.linkDistance(); } )
	.linkStrength(0.9)
	.charge(10)
	.friction(0.95)
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

    graph.neutralStance.x = w/2;
    graph.neutralStance.y = h/2;
    graph.neutralStance.fixed = true;

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

//function display_graphics(data) {
//    //console.log(data);
//
//    /* Create a grpah from the data.  Annotate it as you go. */
//
//    /* The node and edge types in the graph */
//
//    var Node = {
//	svg: function svg(selection) {
//	    selection.append("circle");
//	    this.d3GraceStyle(selection);
//	}
//    }
//
//    function Citizen(name) {
//	this.label = name;
//	this.d3GraceStyle(selection) { selection.attr("r":7).style('fill','#FFFFFF');  }
//    }
//    Citizen.prototype = new Node;
//
//    function Thesis(thesis) {
//	Node.call(this,thesis);
//	this.d3GraceStyle(selection) { selection.attr("r":12).style('fill','#EEEEEE');  }
//    }
//    Thesis.prototype = new Node;
//
//    function Party(name) {
//	this.label = name;
//	this.d3GraceStyle(selection) {
//	    selection
//		.attr("r":12)
//		.style('fill', partyColor);
//	    var _partyColors = {
//		NEUTRAL	: "#ffffff",
//		SPD		: "#e2001a",
//		Linke	: "#FF0000",
//		CSU		: d3.rgb(0, 153, 255),
//		CDU		: "#000",
//		Piraten	: "#FF8800",
//		"Grüne"	: d3.rgb(100, 161, 45),
//		Frauen	: "#7F1E48",
//		FW		: "#007E84",
//		FDP		: "#ffd600",
//		REP		: "#964B00",
//		NPD		: "#964B00",
//		"ÖDP"	: "#EA7c13"
//	    }
//	    var colorGenerator = d3.scale.category20();
//	    var _generatedColors = {};
//	    var nColors = 0;
//	    function partyColor(party) {
//		console.log(party);
//		if (party in _partyColors) return _partyColors[party];
//		if (party in _generatedColors) return _generatedColors[party];
//		return _generatedColors[party] = colorGenerator(nColors++);
//	    }
//	}
//    }
//    Party.prototype = new Node;
//
//    function Link(source, target) {
//	this.source = source;
//	this.target = target;
//	this.d3svg(selection) {
//	    selection.append("line");
//	    this.d3GraceStyle(selection);
//	}
//    }
//
//    function PartyOpinion(party, ) {
//	this.d3GraceStyle(selection) {
//	    selection.style('stroke-width': );
//	}
//    }
//    PartyOpinion.prototype = new Link;
//
//    function PersonalOpinion() {
//	this.d3GraceStyle(selection) {
//	    selection.attr();
//	}
//    }
//    PersonalOpinion.prototype = new Link;
//
//    var graceAndStyle = {
//	,
//	"persönliche Meinung": {
//            elem: 'line',
//            attr: {},
//            style: {
//		'stroke-width': 2,
//		stroke: "#5EC3D6"
//            }
//	},
//	"Partei Meinung": {
//            elem: '',
//            attr: {},
//            style: {
//		'stroke-width': function (d) {
//                    return 5 - d.weight * d.weight
//		},
//		stroke: partyColor
//            }
//	}
//    }
//
// 
//   /* create a visualization of the graph */
//
//    h = tributary.sh;
//    w = tributary.sw;
//
//    var force = d3.layout.force()
//	.nodes(graph.nodes)
//	.links(graph.edges)
//	.size([w, h])
//	.linkDistance(function (link) {
//            return Math.pow(link.weight, 2.4) * 100 + 30;
//	})
//	.linkStrength(0.8316)
//	.charge(0)
//	.friction(0.8)
//	.start();
//
//    //console.log(graph);
//    //console.log(force);
//
//
//    //Create SVG element
//    svg = d3.select('svg');
//
//
//    //Create edges as lines
//    var edges = svg.selectAll("line")
//	.data(graph.edges)
//	.enter()
//	.append("line")
//	.style("stroke", function (d) {
//            var f = graceAndStyle[d.type].style.stroke;
//            return typeof (f) == 'function' ? f(d.party) : f;
//	})
//	.style("stroke-width", function (d) {
//            f = graceAndStyle[d.type].style['stroke-width'];
//            return typeof (f) == 'function' ? f(d) : f
//	}).style('opacity', 0.576);
//
//    //Create nodes as circles
//    var nodes = svg.selectAll("circle")
//	.data(graph.nodes)
//	.enter()
//	.append("circle")
//	.attr("r", function (d) {
//            return graceAndStyle[d.type].attr.r;
//	})
//	.style("fill", function (d) {
//            var f = graceAndStyle[d.type].style.fill;
//            var c;
//            if (typeof (f) == 'function') {
//		c = f(d.party);
//            } else {
//		c = f;
//		return c;
//	    }
//	}).style('opacity', 0.9).attr('stroke-width', 1).attr('stroke', 'black').call(force.drag)
//	.on('mouseover', function (d) {
//            var x = d3.select(this).attr("cx"),
//            y = d3.select(this).attr("cy");
//            svg.append("text")
//		.attr("id", "tooltip")
//		.attr("x", x)
//		.attr("y", y)
//            //.attr('pointer-events',none)
//		.attr("text-anchor", "middle")
//		.attr("font-family", "sans-serif")
//		.attr("font-size", "14px")
//		.attr("font-weight", "bold")
//		.attr("fill", "black")
//		.text(d.label);
//
//	})
//	.on('mouseout', function () {
//            d3.select("#tooltip").remove();
//
//	});
//
//    //Every time the simulation "ticks", this will be called
//    force.on("tick", function () {
//
//	edges.attr("x1", function (d) {
//            return d.source.x;
//	})
//            .attr("y1", function (d) {
//		return d.source.y;
//            })
//            .attr("x2", function (d) {
//		return d.target.x;
//            })
//            .attr("y2", function (d) {
//		return d.target.y;
//            });
//
//	nodes.attr("cx", function (d) {
//            return d.x;
//	})
//            .attr("cy", function (d) {
//		return d.y;
//            });
//
//    });
//}
//
