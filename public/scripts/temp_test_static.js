function m() {
	if( game.empty() )
		game.move( Infinity, Infinity );
	else {
		var temp = new A( function(){ m.rand_ai() } );
	}
}

m.ai = [
	'ai_0_0_4_60s',
	'ai_0_0_3_6s',
	'ai_0_0_3_60s'
];

var result_output = [];

m.rand_ai = function() {
	window[ m.ai[ game.moves.length&1 ] ]();
	return true;
}

function A( cb_move ) {
	// 1. analyze by Andrej_engine in depth
	// 2. analyze static with different parameters, save in array
	// 3. call cb()
	this.cb = cb_move;
	this.gen_a_parameters();
	var q = this;
	var cb = function() {
		q.stage1.call(q);
	}
	setTimeout(cb,100);
}

A.prototype = {
	stage1 : function() {
		console.log(date_str()+'          stage1');
		this.engine = new Andrej_engine(game.l)
		var q = this;
		var cb = function() {
			q.stage2.call(q);
		}
		this.engine.search_for_move( {time:100000}, cb );
	},

	stage2 : function() {
		console.log(date_str()+'          stage2  :   '+Math.round(this.engine.zero_position_node.estimate*100)/100);
		// 1. собрать данные engine - с прошлого этапа
		var moves = [];
		for( var i=0; i<(10<this.engine.zero_position_node.moves.length?10:this.engine.zero_position_node.moves.length); i++ ) {
			moves.push(
				{
					x: this.engine.zero_position_node.moves[i].x,
					y: this.engine.zero_position_node.moves[i].y,
					engine_estimate: translate_engine_value( -this.engine.zero_position_node.moves[i].pos.estimate ),
					static_estimates: []
				}
			)
		}
		// 2. найти все static estimates, перебрав все комбинации параметров
		for( var i=0; i<this.parameters.length; i++ ) {
			var kk_me = andrej_move.kk_me;
			var kk_opponent = andrej_move.kk_opponent;
			var moves_static = this.parameters[i].gen_moves_static(game.l);
			for( var j=0; j<moves.length; j++ )
				for( var k=0; k<moves_static.length; k++ )
					if( ( moves[j].x == moves_static[k].x ) && ( moves[j].y == moves_static[k].y ) )
						moves[j].static_estimates[i] = moves_static[k].estimate;
			andrej_move.kk_me = kk_me;
			andrej_move.kk_opponent = kk_opponent;
		}
		// 3. результат записать в тетрадочку
		result_output.push(
			{
				node: this.engine.zero_position_node,
				l : new LL(this.engine.zero_position_node.l),
				moves: moves
			}
		);
		// call stage3();
		var q = this;
		var cb = function() {
			q.stage3.call(q);
		}
		setTimeout( cb, 100 );
	},

	stage3 : function() {
		console.log(date_str()+'          stage3');
		this.engine.destroy();
		delete this.engine;
		this.engine = null;
		setTimeout(this.cb,100);
	},




	gen_a_parameters : function() {
		this.parameters = [];
		var kk_me = [ 0.1, 0.5, 0.9 ];
		var kk_opponent = [ 0.1, 0.5, 0.9 ];
		var diff_pow = [ 1, 2, 3 ];
		var calc_sum_pow = [ 1, 3, 4 ];
		var me_exclude = [ true, false ];
		var sum_weight = [ 0, 0.5, 1 ];
		var sum_bonus = [ -0.5, -0.1, 0, 0.1, 0.5 ];
		var estimate_to_val = [
			function( est ) {
				var val1 = Math.log( est );
				val1 = ( val1>=0 ? val1 : 0 );
				val2 = est - 1;
				val2 = ( val2>=0 ? val2 : 0 );
				return (val2 * 0.0065 + val1 * 0.035); 
			},
			function( est ) {
				var val1 = Math.log( est );
				return ( val1>=0 ? val1 : 0 );
			},
			function( est ) {
				val2 = est - 1;
				return ( val2>=0 ? val2 : 0 );
			},
			function( est ) {
				return (Math.log(est+10)-Math.log(10))*3;
			},
			function( est ) {
				function prob_to_score( E ) {
					var k = 0.7213475204444817; // 2;
					return -k * Math.log( 1/E - 1 );
				}
				return prob_to_score( Math.random() );
			},
		];
		for( var i=0; i<estimate_to_val.length; i++ )
			estimate_to_val[i].title = ''+i;

		for( var i=0; i<kk_me.length; i++ )
			for( var j=0; j<kk_opponent.length; j++ )
				for( var k=0; k<diff_pow.length; k++ )
					for( var l=0; l<calc_sum_pow.length; l++ )
						for( var m=0; m<me_exclude.length; m++ )
							for( var n=0; n<sum_weight.length; n++ )
								for( var o=0; o<sum_bonus.length; o++ )
									for( var p=0; p<estimate_to_val.length; p++ )
										this.parameters.push(
											new O(
												kk_me[i],
												kk_opponent[j],
												diff_pow[k],
												calc_sum_pow[l],
												me_exclude[m],
												sum_weight[n],
												sum_bonus[o],
												estimate_to_val[p]
											)
										);

	}



}



function O(  kk_me, kk_opponent, diff_pow, calc_sum_pow, me_exclude, sum_weight, sum_bonus, estimate_to_val ) {
	this.kk_me = kk_me; // +
	this.kk_opponent = kk_opponent; // +
	this.diff_pow = diff_pow; // +
	this.calc_sum_pow = calc_sum_pow; // +
	this.me_exclude = me_exclude; // +
	this.sum_weight = sum_weight; // +
	this.sum_bonus = sum_bonus;
	this.estimate_to_val = estimate_to_val; // +
	this.desc = "kk_me: "+kk_me+"\tkk_opponent: "+kk_opponent+"\tdiff_pow: "+diff_pow+"\tcalc_sum_pow: "+calc_sum_pow+"\tme_exclude: "+me_exclude+"\tsum_weight: "+sum_weight+"\testimate_to_val: "+estimate_to_val.title;
}

O.prototype = {
	gen_moves_static : function( l ) {
		andrej_move.kk_me = this.kk_me;
		andrej_move.kk_opponent = this.kk_opponent;
		var me = l.moves_count % 2;
		var ar = new Estimates_static( l );
		var moves = [];
		if( ar.win===true ) 
			return moves;

		var output = ar.get_moves();

		// посчитаем sum_opponent - нужно для определения статической оценки (см. описание алгоритма)
		function calc_sum( exclude, me ) {
			var ind_k = 0;
			var ind_s = 0;
			for( var i=0; i<output.length; i++ ){
				if( exclude.indexOf(i)>=0 )
					continue;
				var val = this.estimate_to_val( output[i].estimate_split[ me ] );
				if( val == Infinity )
					val = 100;
				var k = Math.pow( val, this.calc_sum_pow );
				// запись 15.03.2015 гласит, что нельзя ставить меньше 4-й степени
				// не знаю, почему, 18.03.2015 ставлю третью
				// старое сообщение: найдено экспериментально 15.03.2015; меньше нельзя;
				//								можно не беспокоиться, val положительно ( как и estimate_split[1-me] )
				ind_s += val * k;
				ind_k += k;
			}
			if( ( ind_s==0 ) && (ind_k==0 ) )
				return 0;
			return ind_s / ind_k;
		}
		function diff( a, b ) {
			if( a==b )
				return 0;
			if( !isFinite(a) || !isFinite(b) )
				return a - b;
			var aa = Math.pow( a, this.diff_pow );
			var bb = Math.pow( b, this.diff_pow );
			return ( a * aa - b * bb ) / ( aa + bb );
		}
		// переберём ходы
		for( var i=0; i<output.length; i++ ) {
			var me_val = this.estimate_to_val( output[i].estimate_split[ me ] );
			me_val += this.sum_weight * calc_sum.call( this, ( this.me_exclude ? [] : [i] ), me );
			me_val += this.sum_bonus;
			var op_val = calc_sum.call( this, [i], 1-me );
			var temp_est = diff.call( this, me_val, op_val );
			moves[i] = {
				x: output[i].x, // координаты
				y: output[i].y,
				estimate: temp_est
			}
		}
		return moves;
	}
}

function date_str() {
	var date = new Date();
	if( typeof(date.toLocaleFormat) != 'undefined' ) {
		var datestr = date.toLocaleFormat("%H:%M:%S")
	} else {
		if( typeof(date.toLocaleTimeString) != 'undefined' ) {
			var datestr = date.toLocaleTimeString()
		} else {
			datestr = String(date);
		}
	}
	return datestr;
}

function translate_engine_value( val ) {
	return (val) * ( 1 + 0.8 * Math.abs(val) );
}


