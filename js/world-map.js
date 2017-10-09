(function(){

  var getUrlParameter = function getUrlParameter(sParam) {
      var sPageURL = decodeURIComponent(window.location.search.substring(1)),
          sURLVariables = sPageURL.split('&'),
          sParameterName,
          i;

      for (i = 0; i < sURLVariables.length; i++) {
          sParameterName = sURLVariables[i].split('=');

          if (sParameterName[0] === sParam) {
              return sParameterName[1] === undefined ? true : sParameterName[1];
          }
      }
  };

  var validProducts = ["cacao", "cafe", "yuca", "algodon"];

  var productName = getUrlParameter("producto");
  if(productName == undefined || !validProducts.includes(productName)){
    productName = "cacao";
  }  

  var width = $("#world_svg").parent().width(),
      height = $("#world_svg").parent().height(),
      centered;

  // Define color scale
  var color = d3.scaleSqrt()
                .range(['red', 'white', 'green'])
                .clamp(true);

  var projection = d3.geoMercator()
                     .scale(120)    
                     .center([0, 40])
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

  var currentYear = 2006;


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
      var nombres = data_yr.values.map(function(d){ return d.key });
      var idx = nombres.indexOf(d.properties.name);
      if(idx == -1) return 'white';
        return color(data_yr.values[idx].value.exportacion - data_yr.values[idx].value.importacion);
    }
  }

  function updateCountryInfo(d){
      var dp = data_yr.values.filter(function(g){ return g.key == d.properties.name; });
      if(dp[0] == undefined){
        $("#info-nombre").text(d.properties.name+" - no hay datos de importación/exportación");
        $("#global-table").addClass("invisible");
      } else {
        $("#info-nombre").text(dp[0].key);
        $("#info-importacion").text(d3.format(",.15d")(dp[0].value.importacion));
        $("#info-exportacion").text(d3.format(",.15d")(dp[0].value.exportacion));
        var diff = dp[0].value.exportacion - dp[0].value.importacion;
        $("#info-diferencia").text(d3.format(",.15d")(diff));
        if(diff < 0){
          $("#dif-bg").css("background-color", "rgb(255,187,187)")
        } else if(diff > 0){
          $("#dif-bg").css("background-color", "rgb(176,216,176)")  
        } else{
          $("#dif-bg").css("background-color", "#FFF")  
        }        
        $("#global-table").removeClass("invisible");
      }
  }

  // When clicked, zoom in
  function clicked(d) {
    if(d && d.properties){
      updateCountryInfo(d);
    }
    var x, y, k;
    // Compute centroid of the selected path    
    if (d && centered !== d) {
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

    g.transition()
      .duration(750)
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
  }

  function mouseover(d){
    // Highlight hovered province
    d3.select(this).transition().duration(150)
                   .style("stroke","#000")
                   .style('stroke-width', '2')
                   .style('stroke-opacity', '0.8');

    // Draw effects
    //textArt(nameFn(d));
  }

  function mouseout(d){
    // Reset province color
    
    d3.select(this).transition().duration(150)
                 .style("stroke","#000")
                 .style('stroke-width', '0.7')
                 .style('stroke-opacity', '0.5');
    

  }

  var yearSVGText;

  var yearSelect = $("#yearSelect");

  var features;

  var yearsYuca = [2006, 2007, 2008, 2009, 2010, 2012];
  if(productName == "yuca"){
    for(var i = 0; i < yearsYuca.length; i++)
      yearSelect.append("<option value='"+yearsYuca[i]+"'>"+yearsYuca[i]+"</option>")
  } else {
    for(var i = 2006; i <= 2017; i++)
      yearSelect.append("<option value='"+i+"'>"+i+"</option>");
  }
  
  yearSelect.change(function(){
    updateGlobalYear($(this).val());
  })

  function updateGlobalYear(newYear){

    currentYear = newYear;

    data_yr = data.filter(function(d){ return d.key == currentYear; })[0];

    mapLayer.selectAll('path')
            .data(features)
            .transition()
            .style('fill', fillFn);

    yearSVGText.transition()
               .text(currentYear);
  }



  d3.csv("data/global/imports/"+productName+".csv", function(error, csv_imports){

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

      d3.csv("data/global/exports/"+productName+".csv", function(error, csv_exports){

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

        data_yr = data.filter(function(d){ return d.key == currentYear; })[0];        
        
        d3.json('countries.geo.json', function(error, mapData) {
          features = mapData.features;

          var diffs = data.map(function(d){ return d.values.map(function(g){ return g.value.exportacion - g.value.importacion; }) });
          //console.log(diffs);
          var mindiff = d3.min(diffs, function(d){ return d3.min(d) });
          var maxdiff = d3.max(diffs, function(d){ return d3.max(d) });
          //console.log("min: "+mindiff);
          //console.log("max: "+maxdiff);
          
          // Update color scale domain based on data
          color.domain([
                          mindiff,
                          0,
                          maxdiff
                       ]);
          // Draw each province as a path

          svg.append("g")
             .attr("class", "legendLinear")
             .attr("transform", "translate(20,20)");

          var legend = d3.legendColor()
                         .titleWidth(100)
                         .shapeWidth(5)
                         .shapeHeight(8)
                         .cells(30)
                         .orient("horizontal")
                         .labels(function(a){
                            return "";
                         })
                         .scale(color);

          svg.select(".legendLinear")          
             .call(legend);

          svg.append("text")
             .attr("class", "legendQuant")
             .attr("x", 10)
             .attr("y", 15)
             .text("Balance negativo");

          svg.append("text")
             .attr("class", "legendQuant")
             .attr("x", 150)
             .attr("y", 15)
             .text("Balance positivo");

          //console.log("legend")
          //console.log(legend)

          mapLayer.selectAll('path')
                  .data(features)
                  .enter().append('path')
                  .attr('d', path)
                  .attr('vector-effect', 'non-scaling-stroke')
                  .style('fill', fillFn)
                  .on('mouseover', mouseover)
                  .on('mouseout', mouseout)
                  .on('click', clicked);

          yearSVGText = svg.append('text')
                      .attr('y', height - 150)
                      .attr('x', 60)
                      .attr('font-size', '40px')
                      .attr('fill', '#000')
                      .attr('class', 'textYear')
                      .text(currentYear);

          

        });

      });
      
  });


})();