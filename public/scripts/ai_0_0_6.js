// версия 0.0.6.3

// функция "сделай ход"
function andrej_move_0_0_6( opts ) {
	// разбор параметров
	if( typeof(opts) == 'undefined' )
		opts = {};
	if( !opts.hasOwnProperty('width') )
		opts.width = null;

	// программа не сможет выбрать место для первого хода из равноправного бесконечного поля
	// поэтому этот случай обработаем вручную
	if( game.moves.length == 0 ) {
		game.move( Infinity, Infinity );
		return;
	};

	try {
		andrej_move_0_0_6.adjust_indexes( opts.width );
		best_move = andrej_move_0_0_6.position_index_recursive( opts.width, { best_move: true, index_for: true } );
		// проверим, если оценки нулевые, то сдадимся
			if( (game.moves.length+1) <=2 )
				andrej_move_0_0_6.temp_average_index = 0;
			else {
				var temp_add = Math.abs( best_move.index );
				if( !isNaN(temp_add) && !isFinite(temp_add) )
					temp_add = 10000;
				andrej_move_0_0_6.temp_average_index += temp_add;
			}
			if( ( (game.moves.length+1) >=6 ) && ( ( andrej_move_0_0_6.temp_average_index == 0 ) || isNaN(andrej_move_0_0_6.temp_average_index) ) )
				best_move.resign = true;
			if( andrej_move_0_0_6.verbose )
				console.log('andrej_move_0_0_6 (ver. '+andrej_move_0_0_6.version+', width:'+JSON.stringify(opts.width)+')   :  index: '+Math.round(best_move.index*100)/100+', variants_count: '+best_move.variants_count);
			if( best_move.hasOwnProperty('resign') && best_move.resign )
				console.log('andrej_move_0_0_6: сдаюсь');
	} catch( e ) {
		alert('(andrej_move_0_0_6 ver. '+andrej_move_0_0_6.version+') что-то случилось' + "\n\n"+e);
		best_move = { resign: true };
	}
	var best_move2 = best_move;
	best_move2.x = best_move.x+game.moves[0].x;
	best_move2.y = best_move.y+game.moves[0].y;
	var res = ( ( opts.hasOwnProperty('game_obj') && (opts.game_obj instanceof Game ) ) ? opts.game_obj.move( best_move2 ) : game.move( best_move2 ) );
	if( !res ) {
		console.log('мой ход {'+best_move2.x+','+best_move2.y+'} (относительно {'+best_move.x+','+best_move.y+'}) не катит. Отлаживай. andrej_move_0_0_6 ver. '+andrej_move_0_0_6.version);
		throw('мой ход {'+best_move2.x+','+best_move2.y+'} (относительно {'+best_move.x+','+best_move.y+'}) не катит. Отлаживай. andrej_move_0_0_6 ver. '+andrej_move_0_0_6.version);
	}
	return best_move2;
}

andrej_move_0_0_6.version = '0.0.6.3';
// коэффициенты для оценок
// ввожу два методы статической оценки, которые условно буду называть "tactical" и "positional"
andrej_move_0_0_6.k_static = 2;
andrej_move_0_0_6.k_recursive_val = 32;
andrej_move_0_0_6.k_recursive = 2;//Math.log(2)/Math.log(andrej_move_0_0_6.k_recursive_val); // просто константа, от балды;
// хотя попробую объяснить, откуда ноги растут. В примере "Math.log(2)/Math.log(200)"
//						200 - это количество вариантов, при котором референтный коэффициент будет Math.pow(2,a)
//						оптимальным я признал число 32, смотри отчет 2015_02_08_отчет.xlsx
//						позже на основании этого отчета сделал функцию подсчета на основе andrej_move_0_0_6.k_recursive_val
andrej_move_0_0_6.kk_me = 0.5;
andrej_move_0_0_6.backward_index = 0.0;
andrej_move_0_0_6.increase_est = function(arg) {
	return Math.pow( arg, arg ) * arg; // ебанём!
};
andrej_move_0_0_6.rule_square=true;

// копия из bench.js, пригождается при вычислении коэффициентов; да, аналитика
andrej_move_0_0_6.calc_move_time = function( w ) {
	if( w == null )
		return 1;
	return 1 + w[0] * andrej_move_0_0_6.calc_move_time(w[1]);
}

// старая, на помойку
andrej_move_0_0_6.adjust_indexes = function( w ) {
	// backward_index
	// в какой мере статическая оценка прибавляется к вычисленной рекуррентно
	var n=0;
	// это вычисление глубины
	while( w!= null ){
		if( !(w instanceof Object) )
			break;
		if( ( typeof(w[0]) == 'number' ) && ( w[0] > 0 ) ) {
			n++;
		}
		if( typeof(w[1]) != 'undefined' )
			w=w[1];
		else
			break;
	}
	depth = 0.2 + (n-5) * 0.15;
	if( depth>0.5 )
		depth = 0.5;
	andrej_move_0_0_6.backward_index = depth;
	// k_recursive_val
	//		аналитически вычислено, что для 328 операций (3-х секундные вычисления) оптимальное значение 32, для 3512 операций оптимально 100
	//		отсюда формула
	var t = this.calc_move_time(w);
	andrej_move_0_0_6.k_recursive_val = Math.pow( t/0.242085, 1/2.080793 );
	// k_recursive
	andrej_move_0_0_6.k_recursive = Math.log(2)/Math.log(andrej_move_0_0_6.k_recursive_val); // просто константа, от балды;
};

// override
andrej_move_0_0_6.adjust_indexes = function( w ) {
	andrej_move_0_0_6.k_static = 2;
	andrej_move_0_0_6.k_recursive_val = 32;
	andrej_move_0_0_6.k_recursive = 2;//Math.log(2)/Math.log(andrej_move_0_0_6.k_recursive_val); // просто константа, от балды;
	andrej_move_0_0_6.kk_me = 0.5;
	andrej_move_0_0_6.backward_index = 0.0;
};


// заполнить массив ar
andrej_move_0_0_6.calculate_all_estimates = function( opts ) {
	// параметры
	make_commentary = false;
	if( (typeof(opts)=='object') && (opts.make_commentary===true) )
		make_commentary = true;
	var kk_me = andrej_move_0_0_6.kk_me;
	if( (typeof(opts)=='object') && opts.hasOwnProperty('kk_me') )
		kk_me = opts.kk_me;

	// массив, который мы создаём
	var ar = [];

	// вынесем часть кода отдельно в функции

	// чтобы посчитать оценку для набора из нескольких своих знаков
	function calc_est( num, opts ) {
		// через opts переданы параметры increase_est и kk
		if( num === false )
			num = -0.5;
		else
			num = num + num/4*opts.kk;
		if( num > 4 )
			return Infinity;
		result = ( 5.6 - num ) / ( ( 4.4 - num ) * 5.6/4.4 );
		if( andrej_move_0_0_6.hasOwnProperty('increase_est') )
			result = andrej_move_0_0_6.increase_est( result );
		return result;
	}

	// надо будет пересчитать j_min`ы и j_max`ы
	function regen_j_minmax() {
		// решил сначала пересчитать и i_min
		// дело в том, что при поиске в глубину образовываются пустые ряды
		//	(все элементы 'undefined' после назначения и удаления)
		//	тогда ar слишком раздувается, чревато лишними выделениями памяти и ошибками
		var i_min = 0, i_max = 0;
		for( var i in ar )
			if( ( Number(i) != NaN ) && ( typeof(ar[i]) == 'object' ) ) {
				if( i<i_min )	i_min = Number(i);
				if( i>i_max )	i_max = Number(i);
			}
		ar.i_min = i_min;
		ar.i_max = i_max;
		for( var i=ar.i_min; i<=ar.i_max; i++ ) {
			if( typeof(ar[i]) != 'object' ) {
				ar[i] = [];
				ar[i].j_min = 0;
				ar[i].j_max = -1;
			}
			var j_min = ar[i].j_min;
			var j_max = ar[i].j_max;
			for( var j in ar[i] )
				if( (Number(j)!=NaN) && (typeof(ar[i][j])=='object') ) {
					if( j<j_min ) j_min = Number(j);
					if( j>j_max ) j_max = Number(j);
				};
			ar[i].j_min = j_min;
			ar[i].j_max = j_max;
		};
	}

	// ряды (lines) уже сгенерированы к этому моменту
	// не очень культурно пользоваться ими здесь, тем более изменять
	//	но копировать - это слишком трудоёмко (всё равно будут копироваться ссылки)
	//	да и ресурсозатратно
	//	да и бесполезно
	
	// 1. создадим какой-нибудь один базовый массив объектов,
	//	и всё, что нам нужно, будем писать в свойства этих объектов
	//	самое простое - скопировать горизонтальные ряды

	var i_min = 0, i_max = 0; // напомню, нулевой ряд всегда есть
	for( var i in l.dir[1].lines )
		if( ( Number(i) != NaN ) && ( typeof(l.dir[1].lines[i]) == 'object' ) ) {
			if( i<i_min )	i_min = Number(i);
			if( i>i_max )	i_max = Number(i);
		}
	ar.i_min = i_min-4;
	ar.i_max = i_max+4;
	for( i=i_min; i<=i_max; i++ ) {
		ar[i] = [];
		var j_min = 0; j_max = -1;
		for( var j in l.dir[1].lines[i] )
			if( typeof(l.dir[1].lines[i][j]) == 'number' ) {
				if( j<j_min )	j_min = Number(j);
				if( j>j_max )	j_max = Number(j);
			};
		ar[i].j_min = j_min-4;
		ar[i].j_max = j_max+4;
		for( j=j_min; j<=j_max; j++ ) {
			ar[i][j] = {};
			if( typeof(l.dir[1].lines[i][j]) == 'number' )
				ar[i][j].player = l.dir[1].lines[i][j];
			ar[i][j].estimate = [ 1, 1 ]; // здесь будет ценность хода для обоих игроков, изначально единица
		}
	}

	// 2. перебираем все ряды по-очереди и находим ценность каждой клетки
	var me = l.moves_count%2; // за кого играем?
	// это значение нельзя брать из game.moves, так как в рекурсии я его не буду трогать
	for( var d=0; d<6; d++ ) { // код перебора скопирован из gameplay.js из функции game.checkfinish()
		var i_min = 0, i_max = 0; // но это неважно, он тривиален
		for( var i in l.dir[d].lines )
			if( ( typeof(l.dir[d].lines[i]) == 'object' ) && ( Number(i) != NaN ) ) {
				if( i<i_min )	i_min = Number(i);
				if( i>i_max )	i_max = Number(i);
			}
		for( var i=i_min; i<=i_max; i++ )
			if( typeof(l.dir[d].lines[i]) != 'undefined' ) {
				var j_min = 0; j_max = 0;
				for( var j in l.dir[d].lines[i] )
					if( typeof(l.dir[d].lines[i][j]) == 'number' ) {
						if( j<j_min )	j_min = Number(j);
						if( j>j_max )	j_max = Number(j);
					};
				for( var j=j_min-4; j<=j_max; j++ ) {
					var possible = [ true, true ],
					my_cells = [ 0, 0 ], // количество моих клеток на участке
					val = [ 1, 1 ]; // оценка позиции, вспомогательная переменная
					// проверяю участок длиной в 5 клеток
					for( k=0; k<5; k++ )
						for( var ll=0; ll<2; ll++ ) {
							if( l.dir[d].lines[i][j+k] == ll ) {
								my_cells[ll]++;
								possible[1-ll] = false;
							}
						}
					for( ll=0; ll<2; ll++ ) {
						// если кто-то уже победил, нечего оценивать
						// надо об этом просто сообщить
						if( my_cells[ll] >= 5 )
							return { win: true, winner: ll };
						if( ll==me ) kk=kk_me; else kk=0;
						if( !possible[ll] )
							my_cells[ll] = false;
						if( make_commentary )
							commentary[ll] = ' ('+my_cells[ll]+')';
						// это результат по состоянию данного участка
						val[ll] = calc_est( my_cells[ll], { kk: kk } );
						if( make_commentary )
							commentary[ll] = ''+Math.round(val[ll]*100)/100+' ('+my_cells[ll]+':d'+d+')';
					}
					// умножим на результат с других участков, к которым данная клетка относится
					for( k=0; k<5; k++ ) {
						if( ( l.dir[d].lines[i][j+k] == 0 ) || ( l.dir[d].lines[i][j+k] == 1 ) )
							continue; // зачем оценивать клетки, куда мы не сходим?
						var z = l.translate_uv_to_ij( d, i, j+k ),
						x = z.x,
						y = z.y;
						function check_rule_square( ax, ay ) { // проверяет, что ход дальше, чем две клетки, от начала
							if( !andrej_move_0_0_6.rule_square || ( l.moves_count != 2 ) )
								return true;
							if(	// ограничения на второй ход крестиков
								( ax >= -2 ) &&
								( ax <=  2 ) &&
								( ay >= -2 ) &&
								( ay <=  2 )
							)
								return false;
							return true;
						}
						if( !check_rule_square(x,y) )	// ограничения на второй ход крестиков
							continue;
						for( ll=0; ll<2; ll++ ) {
							if( typeof(ar[x]) != 'object' )
								// никакие свойства типа length или push нам не нужны
								// поэтому нет смысла создавать объект как массив
								ar[x] = { j_min : y-4, j_max : y+4 }; 
							if( typeof(ar[x][y]) != 'object' )
								ar[x][y] = { estimate: [1,1] };
							if( typeof(ar[x][y].estimate[ll]) != 'number' ) {
								ar[x][y].estimate[ll] = val[ll];
							} else {
								ar[x][y].estimate[ll] = ar[x][y].estimate[ll] * val[ll];
							}
							if( make_commentary ) {
								if( typeof(ar[x][y].commentary) == 'undefined' )
									ar[x][y].commentary = ['1','1'];
								// if( typeof(ar[x][y].commentary[ll]) != 'string' ) ar[x][y].commentary[ll] = '1';
								// вроде такого случая быть не может
								ar[x][y].commentary[ll] += ' * '+commentary[ll];
							};
						};
					};					
				};
			}
	}
	regen_j_minmax();
	return ar;
}

// возвращает то, что задано в opts
// аргументы:
//	- me	: (устарело????) кто плюс, а кто минус в оценке
//	- width : массив с шириной поиска для каждой глубины
//	- opts :
//		- best_move (boolean)	: если в if трактуется как true, то вернуть лучший ход (как два поля x и y, не подполя поля)
//		- sort_moves (boolean)	: вернуть ли массив ходов, упорядоченный по их ценности (суммарной)
//		- index_for (boolean)	: вернуть индекс позиции, считая себя в плюс, а противника в минус
// всё возвращается как поля объекта
andrej_move_0_0_6.position_index_recursive = function( width, opts ) {
	// вспомогательные функции
	function modify_lines( ax, ay ) {
		var uv = [];
		for( var d = 0; d < 6; d++ ) {
			uv[d] = l.translate_ij_to_uv( d, ax, ay );
			if( uv[d] !== false ) {
				if( typeof(l.dir[d].lines[uv[d].u]) != 'object' )
					l.dir[d].lines[uv[d].u] = [];
				l.dir[d].lines[uv[d].u][uv[d].v] = 1-(l.moves_count%2);
			}
		}
		return uv;
	}
	function restore_lines( uv ) {
		for( var d = 0; d < 6; d++ )
			if( uv[d] !== false )
				delete l.dir[d].lines[uv[d].u][uv[d].v];
	}
	var result = {};
	var me = l.moves_count%2;
	var k_recursive = andrej_move_0_0_6.k_recursive;
	if( width === null ) {
		return this.position_index_static( opts );
	}
	// сначала соберём список ходов по предварительной оценке
	var pre_top_moves = this.position_index_static( { sort_moves: true, index_for: true } );
	if( pre_top_moves.win===true ) {
		// кажется, гипотетически невозможная ситуация, когда мат уже стоит на доске. Но это поздий комментарий, поэтому только гадаю, что я имел в виду
		if( opts.hasOwnProperty('best_move') && opts.best_move ) {
			result.x = NaN;
			result.y = NaN;
		}
		if( opts.hasOwnProperty('sort_moves') && opts.sort_moves )
			result.moves = [];
		if( opts.hasOwnProperty('index_for') && ( opts.index_for ) ) {
			if( pre_top_moves.winner == me )
				result.index = Infinity;
			else
				result.index = -Infinity;
		}
		// и закончим
		return result;
	};
	var index_old = pre_top_moves.index;
	var variants_count = 1;
	pre_top_moves = pre_top_moves.moves;
	if( index_old == Infinity ) {
		// если ход ведёт к непосредственной победе, то думать больше не надо
		// это возможно только в случае, если побнда моя
		// соберём результат
		if( opts.hasOwnProperty('best_move') && opts.best_move ) {
			result.x = pre_top_moves[0].x;
			result.y = pre_top_moves[0].y;
		}
		if( opts.hasOwnProperty('sort_moves') && opts.sort_moves )
			result.moves = [ pre_top_moves[0] ]; // не знаю, зачем. Наверно, чтобы хоть что-то было
		if( opts.hasOwnProperty('index_for') && ( opts.index_for ) ) {
			result.index = Infinity;
			result.moves_count = l.moves_count;
		}
		// и закончим
		return result;
	};
	var new_top_moves = [];

	// поехали!
	l.moves_count++;
	var w = width[0]; if( w > pre_top_moves.length ) w = pre_top_moves.length;
	for( var ii = 0; ii < w; ii++ ) {
		// 1. модифицируем структуру
		var uv = modify_lines( pre_top_moves[ii].x, pre_top_moves[ii].y );

		// 2. оценка ситуации
		var ans;
		if( width[1] === null )
			ans = this.position_index_static( { index_for: true } );
		else
			ans = this.position_index_recursive( width[1], { index_for: true } );
		variants_count += ( ans.hasOwnProperty('variants_count') ? ans.variants_count : 1 );
		if( !isFinite(ans.index) ) {
			ans = { x: pre_top_moves[ii].x, y: pre_top_moves[ii].y, estimate: -ans.index, moves_count: ( ans.hasOwnProperty('moves_count') ? ans.moves_count : l.moves_count ) };
		} else
			ans = { x: pre_top_moves[ii].x, y: pre_top_moves[ii].y, estimate: -ans.index };
		new_top_moves.push( ans );

		// 4. вернём структуру на место
		restore_lines( uv );
	}
	l.moves_count--;
	new_top_moves.sort(
		function( a, b ) {
			var res = b.estimate - a.estimate;
			if( !isFinite(res) && ( a.hasOwnProperty('moves_count') && b.hasOwnProperty('moves_count') ) ) {
				if( (a.estimate == Infinity) && (b.estimate == Infinity) )
					res = a.moves_count - b.moves_count;
				if( (a.estimate == -Infinity) && (b.estimate == -Infinity) )
					res = b.moves_count - a.moves_count;
			}
			return res;
		}
	);
	// соберём результат
	if( opts.hasOwnProperty('best_move') && opts.best_move ) {
		result.x = new_top_moves[0].x;
		result.y = new_top_moves[0].y;
	}
	if( opts.hasOwnProperty('sort_moves') && opts.sort_moves )
		result.moves = new_top_moves;
	if( opts.hasOwnProperty('index_for') && ( opts.index_for ) ) {
		var moves_count = Infinity;
		var total_ind = -Infinity,
		k_sum = 0;
		for( var i=new_top_moves.length-1; i>=0; i-- ) {
			var val = new_top_moves[i].estimate;
			if( val == Infinity ) {
				total_ind = Infinity; // победа
			}
			if( isFinite(val) ) {
				var k = Math.pow( -Math.log( 1 - andrej_move_0_0_6.posindex_score_to_expectancy( val ) ), k_recursive );
				if( (k==0) && isFinite(val) )
					k = 0.000000001;
				if( !isFinite(k) )
					k=10000;
				k_sum += k;
				if( total_ind == -Infinity )
					total_ind = 0;
				total_ind += k * val;
			} else {
				if( new_top_moves[0].hasOwnProperty('moves_count') )
					moves_count = new_top_moves[0].moves_count;
			}
		}
		if( !isFinite( k_sum ) )
			k_sum = 1;
		if( isFinite(total_ind) ) {
			if( k_sum != 0 )
				total_ind = total_ind / k_sum;
			else
				total_ind = -Infinity;
		};
		result.index = total_ind;
		result.variants_count = variants_count;
		if( andrej_move_0_0_6.hasOwnProperty('backward_index') ) {
			result.index = total_ind * (1-andrej_move_0_0_6.backward_index/variants_count) + index_old * andrej_move_0_0_6.backward_index/variants_count;
		}
		if( isFinite(moves_count) )
			result.moves_count = moves_count;
	}
	// и закончим
	return result;
}

// Сортирует массив ходов по их оценке и выдаёт общую
//	всё возарвщается как поля объекта
// opts:
//	- ar			: массив ar, сгенерированный andrej_move_0_0_6.calculate_all_estimates
//					если не указан, будет сгенерирован снова
//	- sort_moves (boolean)	: выводить ли массив ходов, упорядоченный по их ценности (суммарной)
//	- index_for (boolean)	: выводить ли индекс позиции, считая игрока, который ходит, в плюс; как в recursive
//	- best_move		: если да, то вернёт x и y лучшего хода
// возвращает:
//	то, что задано параметрами
andrej_move_0_0_6.position_index_static = function( opts ) {
	// как всегда, нудный разбор аргументов
	if( typeof(opts)!='object' ) return {};
	var me = false;
	if( (opts.hasOwnProperty('index_for')) && opts.index_for ) 
		me = l.moves_count%2;
	var sort_moves = false;	if( opts.sort_moves===true ) sort_moves=true;
	var best_move = false;	if( opts.best_move ===true ) { sort_moves=true; best_move=true; };
	var k_static = this.k_static;
	// вызовем calculate_all_estimates в случае надобности
	var ar; if( typeof(opts.ar)=='object' ) ar = opts.ar;
	else {
		opts_temp = {};
		if( opts.hasOwnProperty('kk_me') )
			opts_temp.kk_me = opts.kk_me;
		ar = andrej_move_0_0_6.calculate_all_estimates( opts_temp );
	}
	// проверим, вдруг победа (конец)
	if( ar.win===true ) {
		result = ar;
		if( me !== false ) {
			if( me == ar.winner )
				result.index = Infinity;
			else
				result.index = -Infinity;
		}
		if( sort_moves ) {
			result.moves = [];
		}
		if( best_move ) {
			result.x = NaN;
			result.y = NaN;
		}
		return result;
	};
	// инитиализация переменных
	var result = {};
	var moves = [];
	var ind_s = 0; // ind_s, ind_k - взвешенные коэффициенты для tactical оценки
	var ind_k = 0;
	if( sort_moves ) moves = [];
	// пошли в цикл
	for( var i=ar.i_min; i<=ar.i_max; i++ ) {
		if( typeof(ar[i]) == 'undefined' )
			ar[i] = { j_min: 0, j_max: -1 }; // не будем забирать лишнего здесь
		for( var j=ar[i].j_min; j<=ar[i].j_max; j++ ) {
			if( typeof(ar[i][j]) == 'undefined' )
				ar[i][j] = { estimate: [1,1] };
			var est_sum = ar[i][j].estimate[0] + ar[i][j].estimate[1];
			if( me !== false ) {
				//  формула
				var val;
				if( me == 0 )
					val = ar[i][j].estimate[0] - ar[i][j].estimate[1];
				else
					val = ar[i][j].estimate[1] - ar[i][j].estimate[0];
				//var k = Math.pow( -Math.log( 1.5 - andrej_move_0_0_6.posindex_score_to_expectancy( val ) ), k_static );
				var k = Math.abs( val );
				if( !isFinite(k) )
					k=10000;
				ind_s += val * k;
				ind_k += k;
				/* if( !isFinite(est_s) ) { // обе победы - должна быть невозможная ситуация
					me = false;
					result.index = est_s;
				} */
			};
			if( sort_moves )
				moves.push( { x: i, y: j, estimate: est_sum, estimate_split: [ ar[i][j].estimate[0], ar[i][j].estimate[1] ] } );
		}
	}
	if( sort_moves ) {
		moves.sort( function( a, b ) { return b.estimate - a.estimate; } );
		result.moves = moves;
	}
	if( me !== false ) {
		if( !isFinite( ind_s ) )
			ind_k = 1;
		result.index = ind_s / ind_k;
		result.variants_count = 1;
		if( isNaN(result.index) )
			throw 'function position_static: NaN is being returned';
	}
	if( best_move ) {
		result.x = moves[0].x;
		result.y = moves[0].y;
	}
	return result;
}

andrej_move_0_0_6.posindex_score_to_expectancy = function( R ) {
	var k = 0.7213475204444817;
	return 1 / ( 1 + Math.exp(-R/k) );
}

andrej_move_0_0_6.posindex_expectancy_to_score = function( E ) {
	var k = 0.7213475204444817;
	return -k * Math.log( 1/E - 1 );
}

