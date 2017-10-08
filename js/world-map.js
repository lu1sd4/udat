(function(){

  var visTitle = "Producto: Café";
  $("#vis-title").text(visTitle);

  var width = 600,
      height = 750,
      centered;

  // Define color scale
  var color = d3.scaleLinear()
    .domain([1, 70])
    .range([d3.rgb("#efc2b3"), d3.rgb('#e85220')])
    .interpolate(d3.interpolateHcl)
    .clamp(true);

  var projection = d3.geoMercator()
    .scale(50)
    // Center the Map in Colombia
    .center([-74, 4.5])
    .translate([width / 2, height / 2]);

  var path = d3.geoPath()
    .projection(projection);

  // Set svg width & height
  var svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height);

  // Add background
  svg.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height)
    .on('click', clicked);

  var g = svg.append('g');

  var effectLayer = g.append('g')
    .classed('effect-layer', true);

  var mapLayer = g.append('g')
    .classed('map-layer', true);

  var dummyText = g.append('text')
    .classed('dummy-text', true)
    .attr('x', 10)
    .attr('y', 30)
    .style('opacity', 0);

  var bigText = g.append('text')
    .classed('big-text', true)
    .attr('x', 20)
    .attr('y', 45);

  var depName = $("#dep-name");

  // Load map data
  d3.json('countries.geo.json', function(error, mapData) {
    var features = mapData.features;

    // Update color scale domain based on data
    color.domain([0, d3.max(features, nameLength)]);

    // Draw each province as a path
    mapLayer.selectAll('path')
        .data(features)
      .enter().append('path')
        .attr('d', path)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('id', function(d){
          return d.properties.name+"";
        })
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
    //return color(nameLength(d));
    return '#FFFFFF';
  }

  // When clicked, zoom in
  function clicked(d) {
    var x, y, k;

    // Compute centroid of the selected path
    if (d && centered !== d) {
      console.log(d);
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    // Highlight the clicked province
    mapLayer.selectAll('path')
      .style('fill', function(d){return centered && d===centered ? '#D5708B' : fillFn(d);});

    // Zoom
    g.transition()
      .duration(750)
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
  }

  function mouseover(d){
    // Highlight hovered province
    d3.select(this).style('fill', '#00bfa5');

    // Draw effects
    textArt(nameFn(d));
  }

  function mouseout(d){
    // Reset province color
    console.log(d);
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





  function fillCountries(product){
    console.log('llama');

    var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    d3.csv("data/global/imports/" + product +".csv", function(error, csv_data){

      //console.log(csv_data);

      var data = d3.nest()
             .key(function(d){ return d.paisorigen; })         
             .key(function(d){ return d.anio; }).sortKeys(d3.ascending)
             .key(function(d){ return d.mes; }).sortKeys(function(a, b){ return monthNames.indexOf(a) - monthNames.indexOf(b); })
             .rollup(function(d){
                        return {
                              "volumentoneladas" : d3.sum(d, function(g){ return g.volumentoneladas;}), 
                              "cantidadunidades" : d3.sum(d, function(g){ return g.cantidadunidades;}),
                              "valormilespesos" : d3.sum(d, function(g){ return g.valormilespesos;})
                            }
                      })
             .entries(csv_data);
      //console.log(data)
      for(var i = 0; i < data.length; i++)
        aggregate(data[i])

      

      function aggregate(node){
          if (node.hasOwnProperty("value"))
              return;
          var ans = {};
          ans.volumentoneladas = 0;
          ans.cantidadunidades = 0;
          ans.valormilespesos = 0;
          for(var i = 0; i < node.values.length; i++){
            var child = node.values[i];
              aggregate(child);
              ans.volumentoneladas += child.value.volumentoneladas;
              ans.cantidadunidades += child.value.cantidadunidades;
              ans.valormilespesos += child.value.valormilespesos;
          }
          node.value = ans;
          return;
      }

      data.sort(function(a, b){
        return a.value.volumentoneladas - b.value.volumentoneladas;
      });

      console.log(data)
      /*for(var i = 0; i < data.length; i++){
        console.log(data[i].key);
      }*/

      var country;
      for(var i= 0; i < data.length; i++){
        country = d3.select('#' + data[i].key);
        if(country !== 'undefined'){
          d3.select('#' + data[i].key).style('fill', color(i));
        }
      }

      for(var i = 0; i < 70; i++){
        console.log(color(i));
      }
      console.log(color.range);
    });
     

    
  }


  $('#tab-menu a').click(function (e) {
    e.preventDefault()
    $(this).tab('show');
  })

  fillCountries('cacao');

})();

