$(function(){

	// Scatterplot comparando años
	// Eje x - meses del año
	// Eje y - exportación total KG mes
	// Color - año

	var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

	var initialYear = new Date().getFullYear() - 11;

	$.ajax({
	    url: "https://www.datos.gov.co/resource/3fat-ha2q.json",
	    type: "GET",
	    data: {
	       "$limit" : 38000,
	       "$$app_token" : ""
	    }
	}).done(function(data) {
	   console.log(data);
	   load(data);
	});

	// mat[i][j] total kg en año i, mes j

	function load(rawData){
		kgYearMonth = {}, result = [];
		j = 0;
		for(var i = 0; i < rawData.length; i++){
			monthNumber = getMonthNumber(rawData[i]["mes"]);
			yearNumber = getYearIndex(rawData[i]["anio"]);
			if(result[yearNumber] == undefined)
				result[yearNumber] = { year : +rawData[i]["anio"] , values : [] }
			if(result[yearNumber].values[monthNumber] == undefined)
				result[yearNumber].values[monthNumber] = { month : monthNumber , kg : 0 }
			result[yearNumber].values[monthNumber].kg += rawData[i]["cantidadunidades"]*1;
		}
		plotLineChart(result);
	}

	function getMonthNumber(mName){
		month = -1;
		for(i = 0; i < monthNames.length; i++){
			if(monthNames[i] == mName){
				month = i;
				break;
			}
		}
		return month;
	}

	function getYearIndex(year){
		return year - initialYear;
	}

	function plotLineChart(data){
		
		var svg = d3.select("svg"),
			margin = {top: 20, right: 20, bottom: 30, left: 100},
			width = +svg.attr("width") - margin.left - margin.right,
			height = +svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		console.log(data)

		var x = d3.scaleLinear()
				  .domain([ 
				  		  	d3.min(data, function(c){ return d3.min(c.values, function(d){ return d.month; }); }),
				  		  	d3.max(data, function(c){ return d3.max(c.values, function(d){ return d.month; }); }),
				  		  ])
				  .range([0, width]);

		var y = d3.scaleLinear()
				  .domain([
				  			d3.min(data, function(c){ return d3.min(c.values, function(d){ return d.kg; }); }),
				  			d3.max(data, function(c){ return d3.max(c.values, function(d){ return d.kg; }); })
				  		  ])
				  .range([height, 0]);

		var z = d3.scaleOrdinal()
				  .domain(data.map(function(d){ return d.year; }).sort())
				  .range(d3.schemeCategory20b);

		var line = d3.line()
					 .curve(d3.curveNatural)
					 .x(function(d) { return x(d.month); })
					 .y(function(d) { return y(d.kg); });


		g.append("g")
      	 .attr("class", "axis axis--x")
      	 .attr("transform", "translate(0," + height + ")")
      	 .call(d3.axisBottom(x));

      	g.append("g")
      	 .attr("class", "axis axis--y")
      	 .call(d3.axisLeft(y))
    	.append("text")
      	 .attr("transform", "rotate(-90)")
      	 .attr("y", 6)
      	 .attr("dy", "0.71em")
      	 .attr("fill", "#000")
      	 .text("Cantidad exportada, KG");

      	var year = g.selectAll("year")
      				.data(data)
      				.enter().append("g")
      					.attr("class", "year");

      	year.append("path")
      		.attr("class", "line")
      		.attr("d", function(d) { return line(d.values); })
      		.style("stroke", function(d) { return z(d.year); });



	}
	

})