$(function(){

	(function(){
		var map_width = $("#map").parent().width(),
			map_height = $("#map").parent().height(),
			centered;

		var sch = [
					['#FF6B6B', '#FFBABA', '#FF8F8F', '#FF4C4C', '#E92525'],
					['#FFC0C0', '#FFE6E6', '#FFD3D3', '#FFADAD', '#FF9A9A'],
					['#FFCBCB', '#FF9C9C', '#FF3939', '#FF8383', '#FF0909'],
					['#FFCBCB', '#FF8787', '#FFA2A2', '#FF5555', '#FF0808'],
					['#F3F8FE', '#61A1F3', '#9DC4F6', '#2A82F2', '#036BF0'],
					['#EAF3FF',	'#AACFFF', '#71AFFF', '#308AFF', '#005FD9']
				  ];

	    // Define color scale
		var color = d3.scaleQuantile()
		  			  .range(sch[5]);

		var projection = d3.geoMercator()
	  					   .scale(1800)
	  					   .center([-74, 4.2])
	  					   .translate([map_width / 2, map_height / 2]);

	  	var path = d3.geoPath()
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

		var mapLayer = map_g.append('g')
		  					.classed('map-layer', true);

		var depName = $("#dep-name");

		
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
				var nombres = data.map(function(d){ return d.key });			
				var idx = nombres.indexOf(d.properties.NOMBRE_DPT);
				if(idx == -1) return color.range()[0];
		  		return color(data[idx].value.unidades);
			}
		}

		function updateDeptInfo(d){
			var dp = data.filter(function(g){ return g.key == d.properties.NOMBRE_DPT; });
			$("#info-area").text(d.properties.AREA);
			$("#info-toneladas").text(dp[0].value.toneladas);
			$("#info-pesos").text(dp[0].value.valormilespesos);
			updateChart(d.properties.NOMBRE_DPT);
		}

		// When clicked, zoom in
		function clicked(d) {
			$("#local-table").removeClass("invisible");
		  	var x, y, k;
		  	if(d && d.properties){
	    		updateDeptInfo(d);
	    		depName.text(d.properties.NOMBRE_DPT);
		  	}
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
		    		.style('fill', function(d){return centered && d===centered ? '#00bfa5' : fillFn(d);});

		    // Zoom
		    map_g.transition()
		    	 .duration(750)
		    	 .attr('transform', 'translate(' + map_width / 2 + ',' + map_height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
		}

		function mouseover(d){

			svg.selectAll("path").sort(function (a, b) { 			// select the parent and sort the path's							      
								      if (a.properties.DPTO != d.properties.DPTO) return -1;  // a is not the hovered element, send "a" to the back
								      else return 1;                // a is the hovered element, bring "a" to the front
								  });

		    d3.select(this).transition().duration(150)
		    			   .style("stroke","#003882")
		    			   .style('stroke-width', '3')
		    			   .style('stroke-opacity', '0.8');

		    //depName.text(d.properties.NOMBRE_DPT);
		}

		function mouseout(d){
		    // Reset province color

		    d3.select(this).transition().duration(150)
		    			   .style("stroke","#000")
		    			   .style('stroke-width', '0.7')
		    			   .style('stroke-opacity', '0.5');
		    mapLayer.selectAll('path')
		    		.style('fill', function(d){return centered && d===centered ? '#00bfa5' : fillFn(d);});
		}

		$('#tab-menu a').click(function (e) {
		  	e.preventDefault()
		  	$(this).tab('show');
	  	})

		var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
		
		// variables for bar chart

		$("#bar_svg").attr("width", $("#bar_svg").parent().width());

		var bar_svg = d3.select("#bar_svg"),
			margin = { top:20, right: 20, bottom: 20, left: 80 },
			width = +bar_svg.attr("width") - margin.left - margin.right,
			height = +bar_svg.attr("height") - margin.top - margin.bottom,
			g = bar_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scaleBand()
				  .rangeRound([0, width])
				  .padding(0.1);

		var y = d3.scaleLinear()
				  .rangeRound([height, 0]);

		var years = [];
		var cyear = new Date().getFullYear(), fyear = cyear - 11; 
		for(var i = fyear; i <= cyear; i++)
			years.push(i);

		var xAxis = g.append("g")
		 			 .attr("class", "axis axis--x")
		 			 .attr("transform", "translate(0,"+height+")");

		var yAxis = g.append("g")
					 .attr("class", "axis--y");

		var tDuration = 2000;

		var dpto = "Caldas";

		var data;

		d3.csv("data/local/exports/cacao.csv", function(error, csv_data){

			console.log(csv_data);

			data = d3.nest()
					 .key(function(d){ return d.departamento; })				 
					 .key(function(d){ return d.anio; }).sortKeys(d3.ascending)
					 .key(function(d){ return d.mes; }).sortKeys(function(a, b){ return monthNames.indexOf(a) - monthNames.indexOf(b); })
					 .rollup(function(d){
					 						return {
					 									"toneladas" : d3.sum(d, function(g){ return g.toneladas;}), 
					 									"unidades" : d3.sum(d, function(g){ return g.cantidadunidades;}),
					 									"valormilespesos" : d3.sum(d, function(g){ return g.valormilespesos;})
					 								}
			 							})
					 .entries(csv_data);		
			for(var i = 0; i < data.length; i++)
				aggregate(data[i])
			console.log(data)
			function aggregate(node){
			    if (node.hasOwnProperty("value"))
			        return;
			    var ans = {};
			    ans.toneladas = 0;
			    ans.unidades = 0;
			    ans.valormilespesos = 0;
			    for(var i = 0; i < node.values.length; i++){
			    	var child = node.values[i];
			        aggregate(child);
			        ans.toneladas += child.value.toneladas;
			        ans.unidades += child.value.unidades;
			        ans.valormilespesos += child.value.valormilespesos;
			    }
			    node.value = ans;
			    return;
			}

			// Load map data
			d3.json('Colombia.geo.json', function(error, mapData) {
			  	var features = mapData.features;

			    // Update color scale domain based on data
			    color.domain(data.map(function(d){ return d.value.unidades; }));

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

		var yLabel = g.append("text")
			      	  .attr("transform", "rotate(-90)")
			      	  .attr("y", -78)
			      	  .attr("x", 20)
			      	  .attr("font-size", "12px")
			      	  .attr("dy", "0.71em")
			      	  .attr("fill", "#000")
			      	  .text("Cantidad exportada, KG");

		var clickLabel = g.append("text")
				      	  .attr("y", -100)
				      	  .attr("x", 100)
				      	  .attr("font-size", "13px")
				      	  .attr("dy", "0.71em")
				      	  .attr("fill", "#000")
				      	  .text("Clickea una barra para ver los datos de ese año");

		function updateChart(departamento){
			console.log(departamento)
			console.log(data.map(function(d){ return d.key }))
			var data_dpto = data.filter(function(d){ return d.key == departamento })[0];

			yLabel.transition()
				  .attr("x", -150);

			clickLabel.transition()
					  .attr("y", 0);

			x.domain(years);

			y.domain([
						0,
						d3.max(data_dpto.values, function(d){ return d.value.unidades; })*1.5
					]);

			xAxis.transition()
				 .duration(tDuration)
				 .call(d3.axisBottom(x));

			yAxis.transition()
				 .duration(tDuration)
				 .call(d3.axisLeft(y));

			var bars = g.selectAll(".bar")
						.data(data_dpto.values, function(d){ return d.key; });

			bars.transition()
				.duration(tDuration)
				.attr("height", function(d){ return height - y(d.value.unidades); })
				.attr("y", function(d){ return y(d.value.unidades); });

			bars.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function(d){ return x(d.key); })
				.attr("y", function(d){ return height - .5; })
				.attr("width", x.bandwidth())
				.on("click", function(d){ makeChartByMonth(d); })
				.transition()
				.duration(tDuration)
				.attr("height", function(d){ return height - y(d.value.unidades); })
				.attr("y", function(d){ return y(d.value.unidades) });
				

			bars.exit()
				.transition()
				.duration(tDuration)
				.attr("height", 0)
				.attr("y", y(0))
				.remove();

		}

		function makeChartByMonth(data_year){
			
			yLabel.transition()
				  .attr("x", -150)

			clickLabel.transition()
					  .attr("y", -100);

			x.domain(monthNames);

			y.domain([
						0,
						d3.max(data_year.values, function(d){ return d.value.unidades; })*1.5
					])

			xAxis.transition()
				 .duration(tDuration)
				 .call(d3.axisBottom(x).tickFormat(function(d){ return d.slice(0,3); }));

			yAxis.transition()
				 .duration(tDuration)
				 .call(d3.axisLeft(y));

			var bars = g.selectAll(".bar")
						.data(data_year.values, function(d){ return d.key; });

			bars.exit()			
				.transition()
				.duration(tDuration)
				.attr("height", 0)
				.attr("y", y(0))
				.remove();

			bars.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function(d){ return x(d.key); })
				.attr("y", function(d){ return height - .5; })
				.attr("width", x.bandwidth())
				.transition()
				.duration(tDuration)
				.attr("height", function(d){ console.log("here"); return height - y(d.value.unidades); })
				.attr("y", function(d){ console.log("here"); return y(d.value.unidades); });

		}

		$("#nav-exp").click(function(e){
			$("#nav-imp").removeClass("active");
			$(this).addClass("active");
			scrollTo("body")
		})

		$("#nav-imp").click(function(e){
			$("#nav-exp").removeClass("active");
			$(this).addClass("active");
			scrollTo("#imports-row")
		})

		function scrollTo(selector){
			$('html, body').animate({
	    		scrollTop: ($(selector).offset().top)
			},500);
		}
	})();

});