$(function(){

	var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

	// variables for bar chart

	$("#bar_svg").attr("width", $("#bar_svg").parent().width());

	var bar_svg = d3.select("#bar_svg"),
		margin = { top:20, right: 20, bottom: 30, left: 200 },
		width = +bar_svg.attr("width") - margin.left - margin.right,
		height = +bar_svg.attr("height") - margin.top - margin.bottom,
		g = bar_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scaleBand()
			  .rangeRound([0, width])
			  .padding(0.1);

	var y = d3.scaleLinear()
			  .rangeRound([height, 0]);	

	d3.csv("data/new/exports/cacao.csv", function(error, csv_data){

		console.log(csv_data)

		var data = d3.nest()
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
		//console.log(data)
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

		$("#change").click(function(){
			updateChart(dpto);
		})

		function updateChart(departamento){
			var data_dpto = data.filter(function(d){ return d.key == departamento })[0];

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
			
			x.domain(monthNames);

			y.domain([
						0,
						d3.max(data_year.values, function(d){ return d.value.unidades; })*1.5
					])

			xAxis.transition()
				 .duration(tDuration)
				 .call(d3.axisBottom(x));

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

	});



});