function est_to_val( est ) {
	var val = ( Math.log( est+10 ) - Math.log(11) ) * 2;
	return ( val<0 ? 0 : val );
}

function sum_all_square( ar ) {
	var sum_sq = [0,0];
	var sum_k = 0;
	for( var i=ar.i_min; i<=ar.i_max; i++ ) {
		if( typeof(ar[i]) == 'undefined' )
			ar[i] = { j_min: 0, j_max: -1 };
		for( var j=ar[i].j_min; j<=ar[i].j_max; j++ ) {
			if( typeof(ar[i][j]) == 'undefined' )
				ar[i][j] = { estimate: [1,1] };
			if( !isNaN( Number(ar[i][j].player) ) )
				continue;
			k += ar[i][j].estimate[0] + ar[i][j].estimate[1];
			var val = ( Math.log( ar[i][j].estimate[0]+10 ) - Math.log(11) ) * 2;
			val = ( val<0 ? 0 : val );
			sum_sq[0] += k * val * val;
			var val = ( Math.log( ar[i][j].estimate[1]+10 ) - Math.log(11) ) * 2;
			val = ( val<0 ? 0 : val );
			sum_sq[1] += k * val * val;
		}
	}
	sum_sq[0] = Math.sqrt( sum_sq[0] / sum_k );
	sum_sq[1] = Math.sqrt( sum_sq[1] / sum_k );
}