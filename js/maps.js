(function(){

  var visTitle = "Producto: Café";
  $("#vis-title").text(visTitle);

  var map_width = 600,
      map_height = 750,
      centered;

  // Define color scale
  var color = d3.scale.linear()
                      .clamp(true)
                      .range(['#fff', '#26a69a']);

  var projection = d3.geo.mercator()
                         .scale(2500)
                         .center([-74, 4.5])
                         .translate([map_width / 2, map_height / 2]);

  var path = d3.geo.path()
                   .projection(projection);

  // Set svg width & height
  var svg = d3.select('#map')
              .attr('width', map_width)
              .attr('height', map_height);

  // Add background
  svg.append('rect')
     .attr('class', 'background')
     .attr('width', map_width)
     .attr('height', map_height)
     .on('click', clicked);

  var map_g = svg.append('g');

  var effectLayer = map_g.append('g')
                     .classed('effect-layer', true);

  var mapLayer = map_g.append('g')
                  .classed('map-layer', true);

  var dummyText = map_g.append('text')
                   .classed('dummy-text', true)
                   .attr('x', 10)
                   .attr('y', 30)
                   .style('opacity', 0);

  var bigText = map_g.append('text')
                 .classed('big-text', true)
                 .attr('x', 20)
                 .attr('y', 45);

  var depName = $("#dep-name");

  // Load map data
  d3.json('Colombia.geo.json', function(error, mapData) {
    var features = mapData.features;

    // Update color scale domain based on data
    color.domain([0, d3.max(features, nameLength)]);

    // Draw each province as a path
    mapLayer.selectAll('path')
            .data(features)
            .enter().append('path')
            .attr('d', path)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('fill', fillFn)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', clicked);
  });

  // Get province name
  function nameFn(d){
    return d && d.properties ? d.properties.NOMBRE_DPT : null;
  }

  // Get province name length
  function nameLength(d){
    var n = nameFn(d);
    return n ? n.length : 0;
  }

  // Get province color
  function fillFn(d){
    return color(nameLength(d));
  }

  // When clicked, zoom in
  function clicked(d) {
    var x, y, k;

    // Compute centroid of the selected path
    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
        x = map_width / 2;
        y = map_height / 2;
        k = 1;
        centered = null;
    }

    // Highlight the clicked province
    mapLayer.selectAll('path')
    .style('fill', function(d){return centered && d===centered ? '#D5708B' : fillFn(d);});

    // Zoom
    map_g.transition()
    .duration(750)
    .attr('transform', 'translate(' + map_width / 2 + ',' + map_height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
  }

  function mouseover(d){
    // Highlight hovered province
    d3.select(this).style('fill', '#00bfa5');

    // Draw effects
    textArt(nameFn(d));
  }

  function mouseout(d){
    // Reset province color
    mapLayer.selectAll('path')
    .style('fill', function(d){return centered && d===centered ? '#D5708B' : fillFn(d);});

    // Remove effect text
    effectLayer.selectAll('text').transition()
    .style('opacity', 0)
    .remove();

    // Clear province name
    bigText.text('');
}

  // Gimmick
  // Just me playing around.
  // You won't need this for a regular map.

  var BASE_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  var FONTS = [
  "Open Sans",
  ];

  function textArt(text){
    // Use random font
    var fontIndex = Math.round(Math.random() * FONTS.length);
    var fontFamily = FONTS[fontIndex] + ', ' + BASE_FONT;

    /*bigText
      .style('color', fontFamily)
      .text(text);*/

      depName.text(text)


  }

  $('#tab-menu a').click(function (e) {
    e.preventDefault()
    $(this).tab('show');
})

})();