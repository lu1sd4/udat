$(function(){
	d3.csv("data/new/imports/cacao.csv", function(error, csv_data){
		data = d3.nest()
				 .key(function(d){ return d.departamento; })				 
				 .key(function(d){ return d.anio; })
				 .key(function(d){ return d.mes; })
				 .rollup(function(d) { 
				 						return { 
				 									"toneladas" : d3.sum(d, function(g){ return g.toneladas;}), 
				 									"unidades" : d3.sum(d, function(g){ return g.cantidadunidades;}),
				 									"valormilespesos" : d3.sum(d, function(g){ return g.valormilespesos;})
				 								}
		 							})		 
				 .entries(csv_data);
		console.log(data)
		for(var i = 0; i < data.length; i++)
			aggregate(data[i])
		console.log(data)

		function aggregate(node) {
		    if (node.hasOwnProperty("value"))
		        return;
		    ans = {};
		    ans.toneladas = 0;
		    ans.unidades = 0;
		    ans.valormilespesos = 0;
		    for(var i = 0; i < node.values.length; i++){
		    	child = node.values[i];
		        aggregate(child)
		        ans.toneladas += child.value.toneladas;
		        ans.unidades += child.value.unidades;
		        ans.valormilespesos += child.value.valormilespesos;
		    }
		    node.value = ans;
		    console.log(node);
		    return;
		}

	});
});