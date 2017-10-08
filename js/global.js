$(function(){

	var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

	d3.csv("data/global/imports/cacao.csv", function(error, csv_data){

		console.log(csv_data);

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

		console.log(data);

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
	});

});