var get_all=function() {
	var av_est =		0;
	var num_plus =		0;
	var num_minus =		0;
	var av_est_plus =	0;
	var av_est_minus =	0;
	var av_count =		0;
	for( var i=0; i<window.c_result_static.length; i++ ) {
		var temp_est = window.c_result_static[i].estimate;
		if( temp_est == Infinity )
			temp_est = 100;
		if( temp_est == -Infinity )
			temp_est = -100;
		av_est += temp_est;
		av_count += window.c_result_static[i].moves.length;
		if( window.c_result_static[i].estimate>0 ) {
			num_plus++;
			av_est_plus += temp_est;
		}
		if( window.c_result_static[i].estimate<0 ) {
			num_minus++;
			av_est_minus += temp_est;
		}
	}
	av_est = av_est/window.c_result_static.length;
	av_count = av_count/window.c_result_static.length;

	var get_av=function(n){
		var s=0;
		var k=0;
		for( var i=0; i<window.c_result_static.length; i++ ) {
			var nn=n;
			if( n<0 )
				nn = n + window.c_result_static[i].moves.length;
			if( typeof(window.c_result_static[i].moves[nn])!='undefined' ) {
				var val = window.c_result_static[i].moves[nn];
				if( val==Infinity ) val = 100;
				if( val==-Infinity ) val = -100;
				s+= val;
				k++;
			}
		}
		return s/k;
	}
	console.log('  ====      av_est ==       '+av_est);
	console.log('            av_est "+" ==   '+av_est_plus/num_plus);
	console.log('            av_est "-" ==   '+av_est_minus/num_minus);
	console.log('            plus_% ==       '+Math.round(100*num_plus/window.c_result_static.length)+' %');
	console.log('            minus_% ==      '+Math.round(100*num_minus/window.c_result_static.length)+' %');
	console.log('         av_moves_count ==  '+av_count);
	console.log('            ');
	console.log('            av[0] ==     '+get_av(0));
	console.log('            av[1] ==     '+get_av(1));
	console.log('            av[2] ==     '+get_av(2));
	console.log('            av[5] ==     '+get_av(5));
	console.log('            av[10] ==    '+get_av(10));
	console.log('            av[-1] ==    '+get_av(-1));
}

clearInterval(int);var int=setInterval(get_all,15000);int;
