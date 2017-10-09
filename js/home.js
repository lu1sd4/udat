/* D3 Tree */
/* Copyright 2013 Peter Cook (@prcweb); Licensed MIT */
// Tree configuration
var group = [];
var limits = [];
var colors = [];
var branches = [];
var seed = {
  i: 0,
  x: 420,
  y: 500,
  a: 0,
  l: 110,
  d: 0
}; // a = angle, l = length, d = depth
var da = 0.5; // Angle delta
var dl = 0.8; // Length delta (factor)
var ar = 0.7; // Randomness
var maxDepth = 10;
var colors_hover = ['#009688', '#e64a19', '#5e35b1', '#1976d2', '#99ff00', '#696456'];

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {

    var product = '';
    switch(d.group){
    case 1:
      product = 'Café';
      break;
    case 2:
      product = 'Cacao';
      break;
    case 3:
      product = 'Algodón';
      break;
    case 4:
      product = 'Yuca';
      break;
  }

    return "<strong>Producto:</strong> <span style=''>" + product + "</span>";
  })

d3.select("svg").call(tip);

// Tree creation functions
function branch(b) {
  var end = endPt(b),
  daR,
  newB;
  branches.push(b);
  if (b.d === maxDepth)
  return;
  // Left branch
  //daR = ar * Math.random() - ar * 0.5;
  daR = ar * 0.5 - ar * 0.5;
  newB = {
    i: branches.length,
    x: end.x,
    y: end.y,
    a: b.a - da + daR,
    l: b.l * dl,
    d: b.d + 1,
    parent: b.i,
    group: group[branches.length]
  };
  branch(newB);
  // Right branch
  //daR = ar * Math.random() - ar * 0.5;
  daR = ar * 0.6 - ar * 0.5;
  newB = {
    i: branches.length,
    x: end.x,
    y: end.y,
    a: b.a + da + daR,
    l: b.l * dl,
    d: b.d + 1,
    parent: b.i,
    group: group[branches.length]
  };
  branch(newB);
}
function regenerate(initialise) {
  branches = [
  ];
  group = [];
  createGroup();
  branch(seed);
  initialise ? create()  : update();
}
function endPt(b) {
  // Return endpoint of branch
  var x = b.x + b.l * Math.sin(b.a);
  var y = b.y - b.l * Math.cos(b.a);
  return {
    x: x,
    y: y
  };
}
// D3 functions

function x1(d) {
  return d.x;
}
function y1(d) {
  return d.y;
}
function x2(d) {
  return endPt(d).x;
}
function y2(d) {
  return endPt(d).y;
}
function highlightParents(d) {
  //var colour = '#777';
  var op = 1;
  var sw = 0;
  var color = colors_hover[0];
  if(d3.event.type === 'mouseover'){
    if(d.group > 0){
      //colour = colors[d.group - 1];
      color = colors_hover[d.group - 1]
      op = 0.9;
      sw = -4;
      tip.show(d);
    }
    console.log(d);
  }
  else
  {
    color = colors[d.group - 1]
    tip.hide();
  }
  var depth = d.d;
  var brancheGroup = d;
  /*for (var i = 0; i <= depth; i++) {
    //d3.select('#id-' + parseInt(d.i)).style('stroke', colour);
    d3.select('#id-' + parseInt(d.i)).style('stroke-opacity', op);
    d = branches[d.parent];
  }*/
  if(brancheGroup.group > 0){
    d = brancheGroup;
    var limit = limits[brancheGroup.group - 1];
    for(var i = limit.lowerLimit; i <= limit.upperLimit; i++){
      if(d.group > 0){
        //d3.select('#id-' + parseInt(d.i)).style('stroke', colour);
        d3.select('#id-' + parseInt(d.i)).transition().style('stroke', color).style('stroke-opacity', op).style('stroke-width', function (line) {
          return parseInt((maxDepth + 1 - (d.d + sw))*2) + 'px';
        });

      }
      d = branches[i];
    }
  }
}

function showProduct(d){
  switch(d.group){
    case 1:
      location.href = 'map.html?producto=cafe';
      break;
    case 2:
      location.href = 'map.html?producto=cacao';
      break;
    case 3:
      location.href = 'map.html?producto=algodon';
      break;
    case 4:
      location.href = 'map.html?producto=yuca';
      break;
  }
}

function create() {
  d3.select('svg').selectAll('line').data(branches).enter().append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).style('stroke-width', function (d) {
    return parseInt((maxDepth + 1 - d.d)*2) + 'px';
  }).attr('id', function (d) {
    /*if(d.i < 341){
      console.log(branches[d.i]);
      para tener en cuenta
    }*/
    return 'id-' + d.i;
  }).on('mouseover', highlightParents).on('mouseout', highlightParents).on('click', showProduct);
  console.log(group);
}

function update() {
  d3.select('svg').selectAll('line').data(branches).transition().attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
}

function paintTree(){
  console.log('paint: ' + branches.length);
  var branch;
  var colour;
  for(var i = 2; i < 2047; i++){
    branch = branches[i];
    if(branch.group > 0){
      colour = colors[branch.group - 1];
      d3.select('#id-' + parseInt(branch.i)).style('stroke', colour);
    }
  }
}

d3.selectAll('.regenerate').on('click', regenerate);
regenerate(true);
paintTree();


function createGroup(){
  //root branches have no group (-1)
  group = [-1, -1];
  //creating group limits
  /*limits = [ 
    {lowerLimit: 3,
      upperLimit: 513

    },
    {
      lowerLimit: 514,
      upperLimit: 1025
    },
    {
      lowerLimit: 1025,
      upperLimit: 1280
    },
    {
      lowerLimit: 1281,
      upperLimit: 1536
    },
    {
      lowerLimit: 1537,
      upperLimit: 1791
    },
    {
      lowerLimit: 1792,
      upperLimit: 2047
    }
  ];*/
  limits = [
    {
      lowerLimit: 2,
      upperLimit: 512
    },
    {
      lowerLimit: 513,
      upperLimit: 1024
    },
    {
      lowerLimit: 1025,
      upperLimit: 1535
    },
    {
      lowerLimit: 1536,
      upperLimit: 2046
    }
  ];
  //creating group colors
  //colors = ['#0d47a1', '#e53935', '#ffb300', '#004d40', '#99ff00', '#696456']
  colors = ['#a7ffeb', '#ffccbc', '#d1c4e9', '#bbdefb', '#99ff00', '#696456']
  

  var groupN = 1;
  /*for(var i  = 3; i < 2048; i++){
    if( (i == 514) || (i == 1026) || (i == 1281) || (i == 1537) || (i == 1792)){
      groupN++;
    }
    group.push(groupN);
  }*/
  for(var i = 2; i < 2048; i++){
    if( (i == 513) || (i == 1025) || (i == 1536)){
      groupN++;
    }
    group.push(groupN);
  }
  /*group[1024] = -1;
  group[1025] = -1;
  group[1536] = -1;
  group[513] = -1;*/
  group[1024] = -1;
}