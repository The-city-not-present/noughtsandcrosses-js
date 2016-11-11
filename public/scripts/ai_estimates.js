//	changelog:
//		0.0.7.0 - взято из 0.0.6 (ai_0_0_6.js)
//		0.0.7.1 - найдены коэффициенты, упрощено calc_est
//		0.0.7.2 - убрано всё лишнее, теперь это чистый объект, потеряна всякая совместимость;
//		          хоть имя меняй, чтобы не вводить в заблуждение, что это не то же самое
//		0.0.7.3 - (20.03.2015) исправлена страшная ошибка, в ходы добавлялись клетки, где уже стоит чей-то ход;
//		          посмотрел старые версии - там тоже такое должно было срабатывать, чудо, что такого не попадалось;
//		          а то для компьютера ох как заманчиво заменить чужую клеточку на свою)
//		0.0.7.4 - (21.03.2015) отменён коэффициент nk в calc_est (аналог старого increase_est);
//		          стоило ли обновлять версию из-за такой фигни? ладно, в этом файле редко что-то меняю
//		(05.04.2015) отменяю систему версий для этого файла; планирую переделить файлы
//		(07.04.2015) calc_est перенесено в andrej_move.calc_est


// 1. никаких больше классов, просто функция, ибо это просто алгоритм
//		аргументы:
//			l - объект LL
//			opts - параменты:
//				opts.make_commentary : boolean
//				opts.tactics : boolean
//		возвращает "ar"
function Andrej_estimates( l, opts ) {
	// параметры
	if( !(l instanceof LL) )
		throw new Andrej_error( 'Andrej_estimates: !LL' );
	this.moves_count = l.moves_count;
	var make_commentary = ( (typeof(opts)=='object') && opts.make_commentary );
	var tactics = ( (typeof(opts)=='object') && opts.tactics );

	// массив, который мы создаём
	var ar = [];

	// 1. создадим какой-нибудь один базовый массив объектов,
	//	и всё, что нам нужно, будем писать в свойства этих объектов
	//	самое простое - скопировать горизонтальные ряды

	/* 05.05.2015 провёл аналитику
		на 10.26% быстрее работает алгоритм, если заранее заполнить массив пустыми значениями, а не расширять его по мере
		надобности. Даже, если предварительно заполнить только центральную зону, которая наверняка должна быть заполнена, -
		медленно. Быстрее заранее заполнить всё пошире, с запасом -4/+4.
	*/
	ar.i_min = l.dir[1].i_min-4;
	ar.i_max = l.dir[1].i_max+4;
	var j_min = l.dir[0].i_min-4;
	var j_max = l.dir[0].i_max+4;
	for( var i=ar.i_min; i<=ar.i_max; i++ ) {
		ar[i] = [];
		ar[i].j_min = j_min;
		ar[i].j_max = j_max;
		for( var j=j_min; j<=j_max; j++ )
			ar[i][j] = {
				estimate: [ 0, 0 ], // здесь будет ценность хода для обоих игроков
				tactics_r1: [ 0, 0 ],
				tactics_r2: [ 0, 0 ]
			};
	}
	for( var i=l.dir[1].i_min; i<=l.dir[1].i_max; i++ ) {
		if( typeof(l.dir[1][i])=='undefined' )
			continue;
		for( var j=l.dir[1][i].j_min; j<=l.dir[1][i].j_max; j++ )
			if( l.dir[1].lines[i][j]>=0 )
				ar[i][j].player = l.dir[1].lines[i][j];
	}

	// 2. перебираем все ряды по-очереди и находим ценность каждой клетки
	var me = l.moves_count&1; // за кого играем?
	try {
		for( var d=0; d<6; d++ ) { // код перебора скопирован из gameplay.js из функции game.checkfinish()
			for( var i=l.dir[d].i_min; i<=l.dir[d].i_max; i++ ) {
				if( typeof(l.dir[d].lines[i]) == 'undefined' )
					continue;
				// 1. найти j_min, j_max (может, перенести в LL?)
				// 2. создать Andrej_estimates_line
				// 3. перевести в нормальные координаты и заполнить в основной массив
				//															-> значения оценок
				//															-> тактику
				//															-> комментарии
				var line = new Andrej_estimates_tactics_line( l.dir[d].lines[i], ( me==0 ? [0,1] : [1,0] ) );
				//var tactics = new Andrej_estimates_tactics_line( l.dir[d].lines[i] );
				//r.join( tactics.r );
				for( var j=line.j_min; j<=line.j_max; j++ ) {
					if( l.dir[d].lines[i][j] >= 0 )
						continue; // зачем оценивать клетки, куда мы не сходим?
					var z = l.translate_uv_to_ij( d, i, j ),
					x = z.x,
					y = z.y;
					if( (x<ar.i_min) ||(x>ar.i_max) ||(y<ar[x].j_min) ||(y>ar[x].j_max) )
						continue;
					/*if( typeof(ar[x]) != 'object' )
						ar[x] = { j_min : y-4, j_max : y+4 }; 
					if( typeof(ar[x][y]) != 'object' )
						ar[x][y] = { estimate: [0,0] };*/
					for( ll=0; ll<2; ll++ ) {
						// TODO: для отладки
						if( isNaN(line[j][ll].estimate) )
							throw new Andrej_error( 'Andrej_estimates: [ '+x+', '+y+' ] : NaN : line['+j+']['+ll+'].estimates == '+line[j][ll].estimate+'  ( l.dir['+d+'].lines['+i+'] )     '+JSON.stringify(line) );
						if( typeof(ar[x][y].estimate[ll]) != 'number' )
							ar[x][y].estimate[ll] = line[j][ll].estimate;
						else
							ar[x][y].estimate[ll] = 1 - ( 1 - ar[x][y].estimate[ll] ) * ( 1 - line[j][ll].estimate );
						if( line[j][ll].tactics_r1>0 ) {
							if( typeof(ar[x][y].tactics_r1[ll]) != 'number' )
								ar[x][y].tactics_r1[ll] = line[j][ll].tactics_r1;
							else
								ar[x][y].tactics_r1[ll] = ar[x][y].tactics_r1[ll] + line[j][ll].tactics_r1;
						}
						if( line[j][ll].tactics_r2>0 ) {
							if( typeof(ar[x][y].tactics_r2[ll]) != 'number' )
								ar[x][y].tactics_r2[ll] = line[j][ll].tactics_r2;
							else
								ar[x][y].tactics_r2[ll] = ar[x][y].tactics_r2[ll] + line[j][ll].tactics_r2;
						}
						
					}; // end of for ll...
				}; // end of for j...
			}; // end of for i() if !undefined...
		}
	} catch(e) {
		if( e instanceof E_win ) {
			this.win = true;
			this.winner = e.winner;
			return
		} else
				throw e;
	}		
	// 3. tactics
	var num_r1 = [ 0, 0 ];
	var num_r2 = [ [], [] ];
	for( var x=ar.i_min; x<=ar.i_max; x++ )
		for( var y=ar[x].j_min; y<=ar[x].j_max; y++ ) {
			if( ar[x][y].tactics_r1[0]>0 )
				num_r1[0]++;
			if( ar[x][y].tactics_r1[1]>0 )
				num_r1[1]++;
			if( ar[x][y].tactics_r2[0]>0 )
				num_r2[0][ ar[x][y].tactics_r2[0] ] = (
					num_r2[0][ ar[x][y].tactics_r2[0] ]>0 ?
					num_r2[0][ ar[x][y].tactics_r2[0] ]+1 :
					1
				);
			if( ar[x][y].tactics_r2[1]>0 )
				num_r2[1][ ar[x][y].tactics_r2[1] ] = (
					num_r2[1][ ar[x][y].tactics_r2[1] ]>0 ?
					num_r2[1][ ar[x][y].tactics_r2[1] ]+1 :
					1
				);
		}	
	var val_r1 = [ 0, 0 ];
	if( num_r1[me]>0 )
		val_r1[me] = 1;
	if( num_r1[1-me]>1 )
		val_r1[1-me] = 0.9999999;
	if( num_r1[1-me]==0 )
		val_r1[1-me] = 0.99;
	var num_r2_2 = [ 0, 0 ];
	for( var i=2; i<num_r2[0].length; i++ )
		num_r2_2[0] += ( num_r2[0][i]>0 ? num_r2[0][i] : 0 );
	for( var i=2; i<num_r2[1].length; i++ )
		num_r2_2[1] += ( num_r2[1][i]>0 ? num_r2[1][i] : 0 );
	//var num_r2_1 = [ ( num_r2[0][1]>0 ? num_r2[0][1] : 0 ), ( num_r2[1][1]>0 ? num_r2[1][1] : 0 ) ];
	var val_r2_2 = [ 0, 0 ];
	if( num_r2_2[me]>=1 )
		val_r2_2[me] = 0.99;
	if( num_r2_2[1-me]>=2 )
		val_r2_2[1-me] = 0.95;
	for( var i=ar.i_min; i<=ar.i_max; i++ )
		for( var j=ar[i].j_min; j<=ar[i].j_max; j++ ) {
			ar[i][j].commentary = [ '<--->', '<--->' ];
			if( ( val_r1[0]>0 ) && ( ar[i][j].tactics_r1[0]>0 ) ) {
				ar[i][j].estimate[0] = val_r1[0];
				ar[i][j].commentary[0] = 'val_r1[0] : '+val_r1[0];
			}
			if( ( val_r1[1]>0 ) && ( ar[i][j].tactics_r1[1]>0 ) ) {
				ar[i][j].estimate[1] = val_r1[1];
				ar[i][j].commentary[1] = 'val_r1[1] : '+val_r1[1];
			}
			if( ( val_r2_2[0]>0 ) && ( ar[i][j].tactics_r2[0]>1 ) ) {
				ar[i][j].estimate[0] = val_r2_2[0];
				ar[i][j].commentary[0] = 'val_r2_2[0] : '+val_r2_2[0];
			}
			if( ( val_r2_2[1]>0 ) && ( ar[i][j].tactics_r2[1]>1 ) ) {
				ar[i][j].estimate[1] = val_r2_2[1];
				ar[i][j].commentary[1] = 'val_r2_2[1] : '+val_r2_2[1];
			}
		};
	// 4. the end
	this.ar = ar;
}

function Andrej_estimates_prototype() {
	this.get_moves = function() {
		var moves = [];
		// проверим, вдруг победа (конец)
		if( this.ar.win===true ) {
			this.moves = moves;
			return moves;
		};
		var check_funcs = [
			function( ax, ay, moves_count ) { // проверяет, что ход дальше, чем две клетки, от начала
				return !andrej_move.rule_square ||
					( moves_count != 2 ) ||
					(
						( ax > 2 ) ||
						( ax <-2 ) ||
						( ay > 2 ) ||
						( ay <-2 )
					);
			},
			function( ax, ay, moves_count ) { // проверяет, что на пустой доске можно сходить только ( 0, 0 )
				return ( moves_count>0 ) ||
					( ( ax==0 ) && ( ay==0 ) );
			}
		];
		// инитиализация переменных
		var ind_s = 0; // ind_s, ind_k - взвешенные коэффициенты для tactical оценки
		var ind_k = 0;
		// пошли в цикл
		for( var i=this.ar.i_min; i<=this.ar.i_max; i++ ) {
			if( typeof(this.ar[i]) == 'undefined' )
				this.ar[i] = { j_min: 0, j_max: -1 }; // не будем забирать лишнего здесь
			for( var j=this.ar[i].j_min; j<=this.ar[i].j_max; j++ ) {
				if( typeof(this.ar[i][j]) == 'undefined' )
					this.ar[i][j] = { estimate: [0,0] };
				if( !isNaN( this.ar[i][j].player ) )
					continue;
				var legal_move = true;
				for( var k=0; k<check_funcs.length; k++ )
					legal_move = legal_move && check_funcs[k]( i, j, this.moves_count );
				if( !legal_move || false/*!( this.ar[i][j].estimate[0]+this.ar[i][j].estimate[1]>0 )*/ )
					continue;
				moves.push(
					{
						x: i,
						y: j,
						estimate_split: [ this.ar[i][j].estimate[0], this.ar[i][j].estimate[1] ]
					}
				);
			}
		}
		//moves.sort( function( a, b ) { return b.estimate_split[0]+b.estimate_split[1] - (a.estimate_split[0]+a.estimate_split[1]); } ); // TODO: убрать
		this.moves = moves;
		return moves;
	};

}

Andrej_estimates.prototype = new Andrej_estimates_prototype;




function E_win( winner ) {
	this.winner = winner;
}

function E_win_prototype() {
	this.message = 'обнаружена победа в Andrej_estimates';
	this.toString = function() { return 'обнаружена победа в Andrej_estimates'; };
}

E_win_prototype.prototype = Error.prototype;

E_win.prototype = new E_win_prototype;




function Andrej_line( line ) {
	this.j_min = 0;
	this.j_max = -1;
	this.methods = [];
	this.set_range( line.j_min-4, line.j_max+4 );
};

function Andrej_line_prototype() {
	this.register_keyword = function( keyword, val_0, add_cb ) {
		this.methods[keyword] = { val_0: val_0, add_cb: add_cb };
	};
	this.set_range = function( start, end ) {
		for( var j=start; j<this.j_min; j++ )
			this[j] = [ {}, {} ];
		for( var j=end; j>this.j_max; j-- )
			this[j] = [ {}, {} ];
		this.j_min = start;
		this.j_max = end;
	};
	this.set = function( j, player, keyword, val ) {
		if( j<this.j_min ) {
			for( var jj=j; jj<this.j_min; jj++ )
				this[jj] = [ {}, {} ];
			this.j_min = j;
		}
		if( j>this.j_max ) {
			for( var jj=j; jj>this.j_max; jj-- )
				this[jj] = [ {}, {} ];
			this.j_max = j;
		}
		this[j][player][keyword] = val;
	};
	this.add = function( j, player, keyword, newval ) {
		if( ( j<this.j_min ) || ( j>this.j_max ) )
			return this.set( j, player, keyword, newval );
		var val = this[j][player][keyword];
		val = ( typeof(val)=='undefined' ? this.methods[keyword].val_0 : val );
		this[j][player][keyword] = this.methods[keyword].add_cb( val, newval );
	};
}

Andrej_line_prototype.prototype = Array.prototype;

Andrej_line.prototype = new Andrej_line_prototype;




function Andrej_estimates_line( line, kk ) {
	throw new Andrej_error( 'Andrej_estimates_line is deprecated' );
	Andrej_line.call( this, line ); // типа конструктор предка
	this.register_keyword( 'estimate', 0, function(a,b){return 1-(1-a)*(1-b);} );
	this.set_range( line.j_min-4, line.j_max+4 );
	for( var j=this.j_min; j<=this.j_max-4; j++ ) {
		var possible = [ true, true ],
		my_cells = [ 0, 0 ], // количество моих клеток на участке
		val = [ 0, 0 ]; // оценка позиции, вспомогательная переменная
		// проверяю участок длиной в 5 клеток
		for( k=0; k<5; k++ )
			for( var ll=0; ll<2; ll++ ) {
				if( line[j+k] == ll ) {
					my_cells[ll]++;
					possible[1-ll] = false;
				}
			}
		for( ll=0; ll<2; ll++ ) {
			// если кто-то уже победил, нечего оценивать
			// надо об этом просто сообщить
			if( !possible[ll] )
				my_cells[ll] = false;
			if( my_cells[ll] >= 5 )
				throw new E_win(ll);
			val[ll] = andrej_move.calc_est( my_cells[ll], kk[ll] );
		}
		// умножим на результат с других участков, к которым данная клетка относится
		for( k=0; k<5; k++ ) {
			if( line[j+k] >= 0 )
				continue; // зачем оценивать клетки, куда мы не сходим?
			this.add( j+k, 0, 'estimate', val[0] );
			this.add( j+k, 1, 'estimate', val[1] );
		}
	};
}

Andrej_estimates_line.prototype = Andrej_line.prototype;




function Andrej_estimates_tactics_line( line, kk ) {
	Andrej_line.call( this, line ); // типа конструктор предка
	this.register_keyword( 'estimate', 0, function(a,b){return 1-(1-a)*(1-b);} );
	this.register_keyword( 'tactics_r1', 0, function(a,b){return a+1;} );
	this.register_keyword( 'tactics_r2', 0, function(a,b){return a+1;} );
	for( var j=this.j_min; j<=this.j_max-4; j++ ) {
		var possible = [ true, true ],
		my_cells = [ 0, 0 ], // количество моих клеток на участке
		val = [ 0, 0 ]; // оценка позиции, вспомогательная переменная
		// проверяю участок длиной в 5 клеток
		for( k=0; k<5; k++ )
			for( var ll=0; ll<2; ll++ ) {
				if( (typeof(line[j+k])=='object')&&(line[j+k].player == ll) ) {
					my_cells[ll]++;
					possible[1-ll] = false;
				}
			}
		for( ll=0; ll<2; ll++ ) {
			// если кто-то уже победил, нечего оценивать
			// надо об этом просто сообщить
			if( !possible[ll] )
				my_cells[ll] = false;
			if( my_cells[ll] >= 5 )
				throw new E_win(ll);
			val[ll] = andrej_move.calc_est( my_cells[ll], kk[ll] );
		}
		// умножим на результат с других участков, к которым данная клетка относится
		for( k=0; k<5; k++ ) {
			if( line[j+k] >= 0 )
				continue; // зачем оценивать клетки, куда мы не сходим?
			this.add( j+k, 0, 'estimate', val[0] );
			this.add( j+k, 1, 'estimate', val[1] );
			if( my_cells[0]==4 )
				this.add( j+k, 0, 'tactics_r1', 1 );
			if( my_cells[1]==4 )
				this.add( j+k, 1, 'tactics_r1', 1 );
			if( my_cells[0]==3 )
				this.add( j+k, 0, 'tactics_r2', 1 );
			if( my_cells[1]==3 )
				this.add( j+k, 1, 'tactics_r2', 1 );
		}
	};
}

Andrej_estimates_tactics_line.prototype = Andrej_line.prototype;




