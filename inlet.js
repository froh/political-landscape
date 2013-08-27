/* visualization of the political landscape as induced by Wahl-O-Mat data

 Copyright (C) 2013 Susanne Oberhauser-Hirschoff
 This whole gist is under a BSD-3 clause License (see file BSD-3-License)

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

/* load the theses */
/*TODO: allow for multiple files for different elections? */
var Bayern_2013 = tributary.bayern2013;
console.log(Bayern_2013);

/*var theses = d3.tsv(
  'Bayern-2013.tsv',
  function (error, rows) {
    console.log(error);
    console.log(rows);
    
    data = parse_rows(rows);
    /* create node for each thesis */
    /* create node for each party */
    /* create link from each party to each thesis */
    /* create node for user */
  })
*/

var parse_rows = function(rows) {
    /* 'rows' is the input columns: Thesis, Party1..n 
       desired structure:
       
       theses = [thesis_1..m]
       parties = [ Party_i..n ]
       stances = [ [thesis_1..m]_1..n ]
    */
  data = {
    theses: [],
    parties: [],
    stances: []
  };
  
  
  return data;
}