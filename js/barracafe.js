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
	       "$$app_token" : "DYDe5YFqD5YQuK8Xc16sIDzop"
	    }
	}).done(function(data) {
	   console.log(data);
	   loadInit(data);
	});

	var allTheData;
	var categories;

	function loadInit(data){
		allTheData = data;		
		loadCategories(allTheData);
		bindCheckboxEvents();
		forBarChart = prepareDataForBarChart(allTheData);
		displayInitialChart(forBarChart);
		maketable(false, undefined);
	}

	var tooltip = d3.select("body")
				    .append("div")
				    .style("padding", "3px")
				    .style("position", "absolute")
				    .style("z-index", "10")
				    .style("visibility", "hidden")
				    .style("background", "#FFF")
				    .style("border", "1px solid silver")
				    .style("border-radius", "5px")
				    .text("a simple tooltip");

	$("svg").attr("width", $("svg").parent().width())
	
	var svg = d3.select("svg"),
		margin = {top: 20, right: 20, bottom: 30, left: 100},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

	var parseTime = d3.timeParse("%m-%Y");

	var previousData = d3.local();

	var x, xAxis, y, duration;

	function displayInitialChart(data){

		x = d3.scaleBand()
			  .domain( data.map(function(d){ return d.date; }) )				  
			  .rangeRound([0, width])
			  .padding(0.1);		

		xAxis = d3.axisBottom(x)
				  .tickValues(x.domain().filter(function(d) { return d.getMonth() == 0 }))
				  .tickFormat(d3.timeFormat("%Y"));			  

		y = d3.scaleLinear()
			  .domain( [0, d3.max(data, function(d){ return d.kg; })] )
			  .rangeRound([height, 0]);

		g.append("g")
      	 .attr("class", "axis axis--x")
      	 .attr("transform", "translate(0," + height + ")")  	 
      	 .call(xAxis);

      	g.append("g")
      	 .attr("class", "axis axis--y")
      	 .call(d3.axisLeft(y))
    	.append("text")
      	 .attr("transform", "rotate(-90)")
      	 .attr("y", 6)
      	 .attr("dy", "0.71em")
      	 .attr("fill", "#000")
      	 .text("Cantidad exportada, KG");


  		duration = d3.scaleLinear()
  					 .domain(y.domain())
  					 .range([200, 2000]);
  		
  		updateBarChart(data);

	}

	function prepareDataForBarChart(data){
		result = [];
		dateIndex = {};
		cats = {};
		categories.forEach(function(d){
			cats[d] = 0;
		})
		j = 0;
		for(var i = 0; i < data.length; i++){
			monthNumber = getMonthNumber(data[i]["mes"]);
			yearNumber = data[i]["anio"];
			date = monthNumber+"-"+yearNumber;
			if(dateIndex[date] == undefined){
				dateIndex[date] = j;
				j++;
			}
			ci = dateIndex[date];
			if(result[ci] == undefined)
				result[ci] = { "date" : date , "kg" : 0}
			if(categories.includes(data[i]["partida"]))
				result[ci].kg += data[i]["cantidadunidades"]*1;
			cats[data[i]["partida"]] += data[i]["cantidadunidades"]*1;
		}
		//console.log(cats)
		result.forEach(function(d){
			d.date = parseTime(d.date);		
		})
		result = result.sort(sortByDateAscending);
		result.forEach(function(d, i){
			d.id = i;
		})
		return result;
	}

	function bindCheckboxEvents(){
		$("input[type=checkbox]").change(function(){
			cat = $(this).next().text().trim();
			i = categories.indexOf(cat);
			//console.log(i)
			if($(this).prop("checked"))
				categories.push(cat);
			else
				categories.splice(i, 1);
			//console.log(categories)			
			var forBarChart = prepareDataForBarChart(allTheData);
			updateBarChart(forBarChart);
		});
	}

	function loadCategories(data){
		categories = {};
		for(var i = 0; i < data.length; i++)
			categories[data[i]["partida"]] = true;
		categories = Object.keys(categories);
		categories.sort();
		list = $("#productTypeCheckBoxes");
		for (var i = 0; i < categories.length; i++) {
			btn = '<div class="btn-group-vertical btn-block" data-toggle="buttons"> <label class="btn btn-outline-dark active">\
						<input type="checkbox" checked autocomplete="off"><span class="categorieName">'+categories[i]+'\
					</span></label></div>';
			list.append(btn);
		}
	}

	function getMonthNumber(mName){
		month = -1;
		for(i = 0; i < monthNames.length; i++){
			if(monthNames[i] == mName){
				month = i;
				break;
			}
		}
		if(month < 0) console.log("error")
		return month;
	}

	function getYearIndex(year){
		return year - initialYear;
	}

	function sortByDateAscending(a, b) {
    	return a.date - b.date;
	}

	function updateBarChart(data){

		//console.log(data)

		var bars = g.selectAll(".bar")
      	 .data(data, function(d){ return d.date; });

      	bars.transition()
      		//.delay(function(d, i) { return i * 2; })
	      	.duration(function(d){
	      		diff = Math.abs(previousData.get(this).kg - d.kg);
	      		previousData.set(this, d);
	      		return duration(diff);
	      	 })
	      	.ease(d3.easeLinear)
	      	.attr("height", function(d) { return height - y(d.kg); })
	      	.attr("y", function(d){ return y(d.kg); })


      	bars.enter().append("rect")
	      	.on("mouseover", function(d){makeTooltip(d); return tooltip.style("visibility", "visible");})
	  		.on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
	      	.on("mouseout", function(){return tooltip.style("visibility", "hidden");})
	      	.on("click", function(d){ maketable(true, d); })
	      	.attr("class", "bar")
	      	.attr("x", function(d){ return x(d.date); })      	 
	      	.attr("y", function(d){ return height - .5; })
	      	.attr("width", x.bandwidth())
	      	.transition()
	      	//.delay(function(d, i) { return i * 2; })
	      	.duration(function(d){ return duration(d.kg); })
	      	.ease(d3.easeLinear)
	      	.attr("height", function(d) { return height - y(d.kg); })
	      	.attr("y", function(d){ return y(d.kg); })
	      	.each(function(d) { previousData.set(this, d) } );


      	console.log("update: "+bars.size())
      	console.log("enter: "+bars.enter().size())
      	console.log("exit: "+bars.exit().size())

      	function makeTooltip(d){
      		tooltip.html("")
      		tooltip.html(monthNames[d.date.getMonth()]+" de "+d.date.getFullYear()+"<br>"+d.kg.toLocaleString('en',{maximumFractionDigits: 0})+" kg");      		
      	}

	}

	function maketable(filter, data){
		if(filter) date = data.date;
		datafortable = [];
		deptindex = {};
		j = 0;
		for(var i = 0; i < allTheData.length; i++){
			row = allTheData[i];		
			if(deptindex[row.departamentoorigen] == undefined){
				deptindex[row.departamentoorigen] = j;
				j++;
			}
			idx = deptindex[row.departamentoorigen];
			if(datafortable[idx] == undefined)
				datafortable[idx] = { "departamento" : row.departamentoorigen, "kg" : 0};
			if(filter) {
				if(row.anio == date.getFullYear() && row.mes == monthNames[date.getMonth()]){
					datafortable[idx].kg += row.cantidadunidades*1;
				}
			} else {
				datafortable[idx].kg += row.cantidadunidades*1;
			}
		}
		datafortable.sort(sortbykgdescending);
		console.log(datafortable);
	}

	function sortbykgdescending(a, b){
		return b.kg - a.kg;
	}
	

})