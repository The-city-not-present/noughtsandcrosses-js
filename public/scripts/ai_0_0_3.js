// версия 0.0.3.?

function andrej_move_0_0_3( options ) {
	// сначала приведём к стандартному виду options
	if( typeof(options) == 'undefined' )
		options = {};
	if( typeof(options.width) == 'undefined' )
		options.width = [30,0];
	if( typeof(options.width) == 'number' )
		options.width = [options.width];

	// программа не сможет выбрать место для первого хода из равноправного бесконечного поля
	// поэтому этот случай обработаем вручную
	if( game.moves.length == 0 ) {
		game.move( 20, 15 );
		return;
	};

	try{
	best_move = andrej_move_0_0_3.find_best_move( options.width );
	} catch( e ) {
		alert('что-то случилось');
		throw e;
	}
	if( !game.move( best_move.x+game.moves[0].x, best_move.y+game.moves[0].y ) ) {
		console.log('мой ход {'+(best_move.x+game.moves[0].x)+','+(best_move.y+game.moves[0].y)+'} (относительно {'+best_move.x+','+best_move.y+'}) не катит. Отлаживай. andrej_move_0_0_3 ('+andrej_move_0_0_3.version+')');
		throw('мой ход {'+(best_move.x+game.moves[0].x)+','+(best_move.y+game.moves[0].y)+'} (относительно {'+best_move.x+','+best_move.y+'}) не катит. Отлаживай. andrej_move_0_0_3 ('+andrej_move_0_0_3.version+')');
	}
}

andrej_move_0_0_3.version = '0.0.3';

andrej_move_0_0_3.calculate_all_estimates = function( options ) {
	// параметры
	var increase_est = true; // это (?) атавизм
	if( (typeof(options)=='object') && (options.increase_est===false) )
		increase_est = false;
	make_commentary = false;
	if( (typeof(options)=='object') && (options.make_commentary===true) )
		make_commentary = true;
	var kk_me = 0.5;
	if( (typeof(options)=='object') && options.hasOwnProperty('kk_me') )
		kk_me = options.kk_me;
	var kk_opponent = 0;
	if( (typeof(options)=='object') && options.hasOwnProperty('kk_opponent') )
		kk_opponent = options.kk_opponent;

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
		result = ( 5.5 - num ) / ( ( 4.5 - num ) * 5.5/4.5 );
		if( opts.increase_est ) {
			result = Math.pow( result, result ) * result; // ебанём!
			//result = Math.pow( result, result ); // не хватило, ещё раз ебанём!
		}
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
						if( ll==me ) kk=kk_me; else kk=kk_opponent;
						if( !possible[ll] )
							my_cells[ll] = false;
						if( make_commentary )
							commentary[ll] = ' ('+my_cells[ll]+')';
						// это результат по состоянию данного участка
						val[ll] = calc_est( my_cells[ll], { increase_est: increase_est, kk: kk } );
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
						function not_far( ax, ay ) { // проверяет, что ход дальше, чем две клетки, от начала
							if(	// ограничений на второй ход крестиков
								( ax < -2 ) ||
								( ax >  2 ) ||
								( ay < -2 ) ||
								( ay >  2 )
							)
								return false;
							return true;
						}
						if( ( l.moves_count == 2 ) && not_far(x,y) ) // ограничения на второй ход для крестиков
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

// возвращает ход
// аргументы:
//	- me	: кто плюс, а кто минус в оценке
//	- width : массив с шириной поиска для каждой глубины
//	- options : пока ничего
andrej_move_0_0_3.find_best_move = function( width ) {
	return this.position_index_recursive( width, { best_move: true } );
}

// возвращает то, что задано в options
// аргументы:
//	- me	: кто плюс, а кто минус в оценке
//	- width : массив с шириной поиска для каждой глубины
//	- options :
//		- best_move (boolean)	: если в if трактуется как true, то вернуть лучший ход (как два поля x и y, не подполя поля)
//		- sort_moves (boolean)	: вернуть ли массив ходов, упорядоченный по их ценности (суммарной)
//		- index_for (boolean)	: вернуть индекс позиции, считая себя в плюс, а противника в минус
// всё возвращается как поля объекта
andrej_move_0_0_3.position_index_recursive = function( width, options ) {
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
	function gen_new_width() {
		var new_width = [];
		for( var k=1; k<width.length; k++ )
			new_width[k-1] = width[k];
		return new_width;
	}
	var result = {};
	var me = l.moves_count%2;
	if( width[0] == 0 ) {
		return this.position_index_static( options );
	}
	// сначала соберём список ходов по предварительной оценке
	var pre_top_moves = this.position_index_static( { sort_moves: true } );
	if( pre_top_moves.win===true ) {
		if( options.hasOwnProperty('best_move') && options.best_move ) {
			result.x = NaN;
			result.y = NaN;
		}
		if( options.hasOwnProperty('sort_moves') && options.sort_moves )
			result.moves = [];
		if( options.hasOwnProperty('index_for') && ( options.index_for ) ) {
			if( pre_top_moves.winner == me )
				result.index = Infinity;
			else
				result.index = -Infinity;
		}
		// и закончим
		return result;
	};
	pre_top_moves = pre_top_moves.moves;
	if( pre_top_moves[0].estimate == Infinity ) {
		// если ход ведёт к непосредственной победе, то думать больше не надо
		// это возможно только в случае, если побнда моя
		// соберём результат
		if( options.hasOwnProperty('best_move') && options.best_move ) {
			result.x = pre_top_moves[0].x;
			result.y = pre_top_moves[0].y;
		}
		if( options.hasOwnProperty('sort_moves') && options.sort_moves )
			result.moves = [ pre_top_moves[0] ]; // не знаю, зачем. Наверно, чтобы хоть что-то было
		if( options.hasOwnProperty('index_for') && ( options.index_for ) ) {
			result.index = Infinity;
		}
		// и закончим
		return result;
	};
	var new_top_moves = [];

	// поехали!
	l.moves_count++;
	for( var ii = 0; ii < width[0]; ii++ ) {
		// 1. модифицируем структуру
		var uv = modify_lines( pre_top_moves[ii].x, pre_top_moves[ii].y );

		// 2. оценка ситуации
		if( (typeof(width[1])=='undefined') || (width[1]==0) )
			new_top_moves.push( { x: pre_top_moves[ii].x, y: pre_top_moves[ii].y, estimate: -this.position_index_static( { index_for: true, increase_est: false } ).index } );
		else
			new_top_moves.push( { x: pre_top_moves[ii].x, y: pre_top_moves[ii].y, estimate: -this.position_index_recursive( gen_new_width(), {index_for:true} ).index } );

		// 4. вернём структуру на место
		restore_lines( uv );
	}
	l.moves_count--;
	new_top_moves.sort( function( a, b ) { return b.estimate * (1+Math.random()/1000-0.0005) - a.estimate; } );
	// соберём результат
	if( options.hasOwnProperty('best_move') && options.best_move ) {
		result.x = new_top_moves[0].x;
		result.y = new_top_moves[0].y;
		// TODO: для отладки и информации
		if( pre_top_moves.length>=9 ) {
			for( var i=0; i<pre_top_moves.length; i++ )
				if( ( pre_top_moves[i].x == new_top_moves[0].x ) && ( pre_top_moves[i].y == new_top_moves[0].y ) )
					if( i>=7 ) {
						if( !andrej_move_0_0_3.hasOwnProperty('commentary_on_predictability') )
							andrej_move_0_0_3.commentary_on_predictability = [];
						andrej_move_0_0_3.commentary_on_predictability.push( ''+i+' / '+pre_top_moves.length );
					}
		}
	}
	if( options.hasOwnProperty('sort_moves') && options.sort_moves )
		result.moves = new_top_moves;
	if( options.hasOwnProperty('index_for') && ( options.index_for ) ) {
		var total_ind = -Infinity,
		k_sum = 0;
		for( var i=new_top_moves.length-1; i>=0; i-- ) {
			var a = new_top_moves[i].estimate;
			if( a == Infinity ) {
				total_ind = Infinity;
				break;
			}
			if( a == -Infinity )
				continue;
			var k = Math.pow( 2, a );
			k_sum = k_sum + k;
			if( total_ind == -Infinity )
				total_ind = 0;
			total_ind = total_ind + k * a;
		}
		if( isFinite(total_ind) ) {
			if( k_sum != 0 )
				total_ind = total_ind / k_sum;
			else
				total_ind = -Infinity;
		};
		result.index = total_ind;//( total_ind + prev_index ) / 2;;
	}
	// и закончим
	return result;
}

// Сортирует массив ходов по их оценке и выдаёт общую
//	всё возарвщается как поля объекта
// options:
//	- ar			: массив ar, сгенерированный andrej_move_0_0_3.calculate_all_estimates
//					если не указан, будет сгенерирован снова
//	- sort_moves (boolean)	: выводить ли массив ходов, упорядоченный по их ценности (суммарной)
//	- index_for (boolean)	: выводить ли индекс позиции, считая игрока, который ходит, в плюс; как в recursive
//	- best_move		: если да, то вернёт x и y лучшего хода
// возвращает:
//	то, что задано параметрами
andrej_move_0_0_3.position_index_static = function( options ) {
	// как всегда, нудный разбор аргументов
	if( typeof(options)!='object' ) return {};
	var me = false;
	if( (options.hasOwnProperty('index_for')) && options.index_for ) 
		me = l.moves_count%2;
	var sort_moves = false;	if( options.sort_moves===true ) sort_moves=true;
	var best_move = false;	if( options.best_move ===true ) { sort_moves=true; best_move=true; };
	// вызовем calculate_all_estimates в случае надобности
	var ar; if( typeof(options.ar)=='object' ) ar = options.ar;
	else {
		opts = {};
		if( options.hasOwnProperty('increase_est') )
			opts.increase_est = options.increase_est;
		ar = andrej_move_0_0_3.calculate_all_estimates( opts );
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
	var moves, ind_0 = 1, ind_1 = 1;
	if( sort_moves ) moves = [];
	// пошли в цикл
	for( var i=ar.i_min; i<=ar.i_max; i++ ) {
		if( typeof(ar[i]) == 'undefined' )
			ar[i] = { j_min: 0, j_max: -1 }; // не будем забирать лишнего здесь
		for( var j=ar[i].j_min; j<=ar[i].j_max; j++ ) {
			if( typeof(ar[i][j]) == 'undefined' )
				ar[i][j] = { estimate: [1,1] };
			if( me !== false ) {
				// TODO: найти формулу
				function prepare_for_index( est ) {
					var a = Math.pow( est, 4 );
					a = a-1;
					if( a<0 )	a=0;
					return 1 - Math.atan( a/128 ) * 2 / Math.PI;
				}
				ind_0 = ind_0 * prepare_for_index( ar[i][j].estimate[0] );
				ind_1 = ind_1 * prepare_for_index( ar[i][j].estimate[1] );
			}
			if( sort_moves )
				moves.push( { x: i, y: j, estimate: ar[i][j].estimate[0] + ar[i][j].estimate[1] } );
		}
	}
	result = {};
	if( me !== false ) {
		// TODO: здесь другая часть формулы, проверяй
		/* function reverse_index_back( val ) {
			return Math.pow( (256*Math.tan(Math.PI/2*(val))), 0.25 );
		} */
		if( me === 0 )
			// раньше было ind_1 - Ind_0, то есть корректно (1-ind_0) - (1-ind_1)
			// но проблема, для компьютера "близко к единице" == "очень близко к единице"
			//result.index = reverse_index_back( ind_0 ) - reverse_index_back( ind_1 );
			result.index = 1/ind_0 - 1/ind_1;
		else
			result.index = 1/ind_1 - 1/ind_0;
		if( isNaN(result.index) )
			throw 'here in position_static now returning NaN';
	}
	if( sort_moves ) {
		moves.sort( function( a, b ) { return b.estimate - a.estimate + Math.random()/1000; } );
		result.moves = moves;
	}
	if( best_move ) {
		result.x = moves[0].x;
		result.y = moves[0].y;
	}
	return result;
}

