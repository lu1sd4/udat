(function(){

  var width = $("#world_svg").parent().width(),
      height = $("#world_svg").parent().height(),
      centered;

  // Define color scale
  var color = d3.scaleSqrt()
                .range(['red', 'white', 'green'])
                .clamp(true);

  var projection = d3.geoMercator()
                     .scale(100)    
                     .center([0, 4.5])
                     .translate([width / 2, height / 2]);

  var path = d3.geoPath()
               .projection(projection);

  // Set svg width & height
  var svg = d3.select('#world_svg')
              .attr('width', width)
              .attr('height', height);

  // Add background
  svg.append('rect')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', height)
      .on('click', clicked);

  var g = svg.append('g');

  var mapLayer = g.append('g')
                  .classed('map-layer', true);

  var countryName = $("#country-name");

  var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  var data;

  var data_yr;


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
    if(d && d.properties){
      console.log(data_yr);
      var nombres = data_yr.values.map(function(d){ return d.key });
      var idx = nombres.indexOf(d.properties.name);
      if(idx == -1) return 'white';
        return color(data_yr.values[idx].value.exportacion - data_yr.values[idx].value.importacion);
    }
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
    d3.select(this).transition().duration(150)
                   .style('fill', '#00bfa5');

    // Draw effects
    //textArt(nameFn(d));
  }

  function mouseout(d){
    // Reset province color
    
    d3.select(this).transition().duration(150)
                   .style('fill', fillFn(d));

    mapLayer.selectAll('path')
            .style('fill', function(d){return centered && d===centered ? '#D5708B' : fillFn(d);});

  }

  d3.csv("data/global/imports/cacao.csv", function(error, csv_imports){

      //console.log(csv_imports);

      var data_im = d3.nest()
                      .key(function(d){ return d.anio; }).sortKeys(d3.ascending)         
                      .key(function(d){ return d.pais; }).sortKeys(d3.ascending)                      
                      .rollup(function(d){
                                          return {
                                              "importacion" : d3.sum(d, function(g){ return g.importacion; })
                                          };
                                        })
                      .entries(csv_imports);

      d3.csv("data/global/exports/cacao.csv", function(error, csv_exports){

        var data_ex = d3.nest()
                        .key(function(d){ return d.anio; }).sortKeys(d3.ascending)         
                        .key(function(d){ return d.pais; }).sortKeys(d3.ascending)                      
                        .rollup(function(d){
                                            return {
                                                "exportacion" : d3.sum(d, function(g){ return g.exportacion;})
                                            };
                                          })
                        .entries(csv_exports);

        data = data_im;
        data.forEach(function(ano_imp){
          var ano_exp = data_ex.filter(function(g){ return g.key == ano_imp.key })[0];
          ano_imp.values.forEach(function(pais_imp){
            var pais_exp = ano_exp.values.filter(function(f){ return f.key == pais_imp.key; })[0];
            if(pais_exp == undefined) pais_imp.value.exportacion = 0;
            else {
              pais_imp.value.exportacion = pais_exp.value.exportacion;
            }            
          });
          ano_exp.values.forEach(function(pais_exp){
            if(!ano_imp.values.map(function(v){ return v.key; }).includes(pais_exp.key)){
              ano_imp.values.push(
                                  { 
                                    "key" : pais_exp.key,
                                    "value" : { 
                                      "importacion" : 0,
                                      "exportacion" : pais_exp.value.exportacion 
                                    }
                                  }
                                 );
            }
          });
        });

        data_yr = data.filter(function(d){ return d.key == '2006'; })[0];
        console.log(data);
        
        d3.json('countries.geo.json', function(error, mapData) {
          var features = mapData.features;

          var diffs = data.map(function(d){ return d.values.map(function(g){ return g.value.exportacion - g.value.importacion; }) });
          console.log(diffs);
          var mindiff = d3.min(diffs, function(d){ return d3.min(d) });
          var maxdiff = d3.max(diffs, function(d){ return d3.max(d) });
          console.log("min: "+mindiff);
          console.log("max: "+maxdiff);
          
          // Update color scale domain based on data
          color.domain([
                          mindiff,
                          0,
                          maxdiff
                       ]);
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

      });
      
  });


})();