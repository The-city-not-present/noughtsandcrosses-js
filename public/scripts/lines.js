// lines.js и класс LL - фундамент всей моей идеи о компьютере, играющем в крестики-нолики

// структура такова:
// l - главный объект
//	l.dir[n] - ряды в n-ом направлении

// иными словами, я перехожу к другим координатам
//	l.dir[направление][номер ряда][элемент в ряду]

/* направлений 6:
	0:    горизонталь,
	1:    вертикаль,
	2, 4: два направления диагонали по чёрным клеткам (где был первый ход в крестики)
	3, 5: и два по белым */



/* собственно, проблема:
	если преобразовывать по моему первоначальному плану,
	то есть брать вектор направления (a, b) и переходить по схеме u = ax + by, v = -bx + ay,
	это взаимно однозначное преобразование на целочисленные координаты: на первый взгляд, всё хорошо.
	Но для диагоналей направление будет {1, -1} (или {1, 1} ),
		то соседние клетки в одном ряду будут иметь между собой расстояник 2;
		получается решётка с пустотами, которые заполняются 'undefined',
		работать с таким рядом непросто.
	Поэтому я выделяю отдельно направления в диагонали по чёрным клеткам и белым,
		то есть разделяю структуру на два наложенных массива

	Подробнее см. код l.gen_lines(), где "if( lb%2 == 0 )" и так далее...
		Этим условием "if( lb%2 == 0 )" как раз определяется, чёрная это клетка или белая
*/



// эта штука сгенерирует массивы горизонтальных, вертикальных и диагональных рядов
//	описание структуры см. выше
//	параметр - один, это объект
//		если передан объект Game, будут созданы нормальные ряды; это и есть поведение, заложенное в функцию изначально
//		если передано ничего, будет возвращен пустой экземпляр LL
//		если передан экземпляр LL, будет возвращена копия
//	хочу, чтобы гарантировалось, что возвращённый объект будет обязательно иметь свойство dir[1]
function LL(g) {
	// смотрим, что мы получили за параметры
	// если передано пусто, вернём пусто
	this.dir = [
		new LL_line_array,
		new LL_line_array,
		new LL_line_array,
		new LL_line_array,
		new LL_line_array,
		new LL_line_array
	];
	this.moves_count = 0;
	this.windata = [ undefined, undefined ];
	if( ( typeof(g)=='undefined' ) || ( (g instanceof Game) && g.empty() ) ) {
		return this;
	}
	// если переден LL - делаем копию
	if( g instanceof LL ) {
		this.moves_count = g.moves_count;
		for( var d=0; d<6; d++ ) {
			this.dir[d].i_min = g.dir[d].i_min;
			this.dir[d].i_max = g.dir[d].i_max;
			for( var i=g.dir[d].i_min; i<=g.dir[d].i_max; i++ ) {
				if( !( g.dir[d][i] instanceof LL_line ) ) 
					continue;
				this.dir[d][i] = new LL_line;
				this.dir[d][i].j_min = g.dir[d][i].j_min;
				this.dir[d][i].j_max = g.dir[d][i].j_max;
				for( var j=g.dir[d][i].j_min; j<=g.dir[d][i].j_max; j++ )
					this.dir[d][i][j] = g.dir[d][i][j];
			}
		}
		return
	}
	// если передана какая-то чушь, будет ошибка
	// если там был LL или пусто, уже должно было сработать return, тогда здесь мы не должны оказаться
	if( !( g instanceof Game ) )
		throw 'new LL : !Game, !LL';

	// дальше сложный код, писанный много лет назад)

	function Error_lines_illegal_format() {}
	Error_lines_illegal_format.prototype = Error.prototype;

	// хитрый перебор индексов направлений
	for( var dir=0; dir<3; dir+=2 ) {
		// здесь хитрый код, написанный давно; не пытайся понять; он хорошо протестирован и работает инфа 100%
		var rx = g.moves[0].x; // координаты первого хода, так скажем, реперные точки, от которых всё откладываем
		var ry = g.moves[0].y;
		if( !isFinite(rx) || !isFinite(ry) )
			throw new Error_lines_illegal_format;
		var ldx, ldy; // это, так скажем, вектор направления
		// нормальный вектор будет { -ldy; ldx }
		// знаки выбраны, чтобы из направления dir=0 (слево-направо) нормальное направление было сверху вниз
		switch( dir ) {
		  case 0:
			ldx = 1; ldy = 0; break;
		  case 2:
			ldx = 1; ldy = -1; break;
		}
		// вектор направления задан, теперь перебираем точки
		for( var i=0; i<g.moves.length; i++ ) {
			var dir1 = dir, dir2 = dir+1;
			lb = ( g.moves[i].x - rx ) * ldx +    ( g.moves[i].y - ry ) * ldy;
			nb = ( g.moves[i].x - rx ) * (-ldy) + ( g.moves[i].y - ry ) * ldx;
			if( !isFinite(lb) || !isFinite(nb) )
				throw new Error_lines_illegal_format;
			if( dir<2 ) {
				dir1 = 0;
				dir2 = 1;
			} else {
				// пришлось немного намутить, чтобы разделить на чёрные и белые поля
				if( (lb&1) == 0 ) { // ебаные скобки
					dir1 = 2;
					dir2 = 4;
					lb = lb / 2 | 0;
					nb = nb / 2 | 0;
				} else {
					dir1 = 3;
					dir2 = 5;
					lb = (lb+1) / 2 | 0;
					nb = (nb+1) / 2 | 0;
				};
			}
			// теперь { ln, lb } - новые координаты точки
			this.dir[dir1].set( nb, lb, i&1 );
			this.dir[dir2].set( lb, nb, i&1 ); // в нормальном направлении
		}
	}
	// конец вспомогательной функции
	this.moves_count = g.moves.length;
	// достаточно вызвать эти два направления, остальные заполняются попутно
};



LL.prototype = {
	// == для gameplay ==

	// проверить, вдруг в поле уже есть пятерка
	// вернёт 0 или 1 - кто выиграл
	// иначе false, проверяйте с тройным равно ===
	check_win : function() {
		// проверим каждый простым циклом
		// напоминаю, структура простая: this.dir[направление].lines[номер ряда][элемент в ряду]
		
		for( var d=0; d<6; d++ ) {
			for( var i=this.dir[d].i_min; i<=this.dir[d].i_max; i++ ) {
				if( !( this.dir[d][i] instanceof LL_line ) )
					continue;
				var last = -1;
				var count = [ 0, 0 ]; // напомню, нули, то есть чётные в списке - это крестики, единицы - нолики
				for( var j=this.dir[d][i].j_min; j<=this.dir[d][i].j_max; j++ ) {
					if( this.dir[d][i][j]>=0 ) {
						if( last == this.dir[d][i][j] ) {
							count[last]++;
							count[1-last] = 0;
						} else {
							this.windata[0] = { dir: d, u: i, v: j };
							count[this.dir[d][i][j]] = 1;
							count[1-this.dir[d][i][j]] = 0;
						}
					} else {
						count[0] = 0;
						count[1] = 0;
					}
					last = this.dir[d][i][j];
					// пора проверить результат
					var winner = -1;
					if( count[0] >= 5 )
						winner = 0;
					if( count[1] >= 5 )
						winner = 1;
					if( winner>=0 ) {
						this.windata[0] = this.translate_uv_to_ij( this.windata[0].dir, this.windata[0].u, this.windata[0].v );
						this.windata[1] = this.translate_uv_to_ij( d, i, j );
						return winner;
					}
				};
			}
		}
		return false;
	},

	// == методы преобразования координат ==

	// переход к нормальным обычным декартовым координатам
	//		из координат наших рядов ( u, v ) для любого dir
	//		возвращает координаты ( i, j ) - относительно первого хода ( 0, 0 )
	translate_uv_to_ij : function( d, u, v ) {
		switch( d ) {
		  case 0: // горизонталь
			return { x: v, y: u };
		  case 1: // вертикаль
			return { x: u, y: v };
		  	// 2, 4 - по чёрным, 3, 5 - по белым
		};
		// если не 0 и не 1, то return не сработает, и мы попадём сюда

		// всё дальше получилось решением простого линейного уравнения
		// обратные преобразовании к функции l.gen_lines() (или к translate_ij_to_uv() )
		var l = 2*u;
		var b = 2*v;
		if( (d == 3 ) || ( d == 5 ) ) {
			l--;
			b--;
		}
		var x, y;
		var k1 = 1, k2 = -1;
		if( d > 3 ) {
			var z = l;
			l = b; b = z;
		}; // вроде, так. Но запутаться здесь легко
		if( k1-k2 != 0 ) { // этот if вроде не нужен, так как k1 и k2 достоверно известны,
		// но сделаем более общий случай, если векторы направления потом изменю
			z = ( k1 + k2 ) / ( k1 - k2 );
			x = ( l + b ) / ( k1 - k2 ) - z;
			x = x | 0; // на всякий случай, вдруг что-то нелечисленно получилось.
			// Всё-таки деление, оно возвращает число с плавающей точкой, а с ними надо ухо востро
			y = ( l - b ) / ( k1 - k2 ) + z;
			y = y | 0;
		} else {
			z = ( k1 - k2 ) / ( k1 + k2 );
			x = ( l - b ) / ( k1 + k2 ) + z;
			x = x | 0;
			y = ( l + b ) / ( k1 + k2 ) - z;
			y = y | 0;
		}
		// напомню, что полученные x только относительны к началу координат
		// корректнее было назвать эту переменную dx = absolute_x - rx
		return { x: x, y: y };
	},

	translate_ij_to_xy : function( x, y, ref_move ) {
		return { x: ref_move.x + x, y: ref_move.y + y };
	},

	translate_uv_to_xy : function( d, u, v, ref_move ) {
		var a = this.translate_uv_to_ij( d, u, v );
		return { x: ref_move.x + a.x, y: ref_move.y + a.y };
	},

	translate_ij_to_uv : function( d, i, j ) {
		var ldx, ldy, lb, nb
		if( d<2 ) {
			ldx = 1;
			ldy = 0;
		} else {
			ldx = 1;
			ldy = -1;
		};
		lb = i * ldx +    j * ldy;
		nb = i * (-ldy) + j * ldx;
		if( d == 0 )	return { d: d, u: nb, v: lb };
		if( d == 1 )	return { d: d, u: lb, v: nb };
		// простые случаи рассмотрели, осталось d >= 2. Ух!
		if( ( d == 2 ) || ( d == 4 ) ) {
			if( lb%2 != 0 )
				return false;
			lb = lb / 2 | 0;
			nb = nb / 2 | 0;
		}
		if( ( d == 3 ) || ( d == 5 ) ) {
			if( (lb&1) == 0 )
				return false;
			lb = (lb+1) / 2 | 0;
			nb = (nb+1) / 2 | 0;
		}
		if( ( d == 2 ) || ( d == 3 ) )
			return { d: d, u: nb, v: lb };
		if( ( d == 4 ) || ( d == 5 ) )
			return { d: d, u: lb, v: nb };
	},

	translate_xy_to_ij : function( x, y, ref_move ) {
		return { x: x - ref_move.x, y: y - ref_move.y };
	},

	translate_xy_to_uv : function( d, x, y, ref_move ) {
		return this.translate_ij_to_uv( d, x - ref_move.x, y - ref_move.y );
	},



	// == методы модификации и сравнения позиций ==

	// для использования в ai
	//	стырены из andrej_move.position_index_recursive
	modify_lines : function( ax, ay ) {
		var uv = [];
		for( var d = 0; d < 6; d++ ) {
			uv[d] = this.translate_ij_to_uv( d, ax, ay );
			if( uv[d] !== false )
				this.dir[d].set( uv[d].u, uv[d].v, this.moves_count&1 );
		}
		this.moves_count++;
		return uv;
	},
	restore_lines : function( uv ) {
		this.moves_count--;
		for( var d = 0; d < 6; d++ )
			if( uv[d] !== false ) {
				delete this.dir[d][uv[d].u][uv[d].v];
				this.dir[d][uv[d].u].adjust_j_min_max();
				this.dir[d].adjust_i_min_max();
			}
	},
	
	// сравнивает два объекта класса LL
	//	проверяет только dir[1]
	//	производит полное сравнение
	compare : function( al ) {
		if( al.moves_count != this.moves_count )
			return false;
		return this.dir[1].compare( al.dir[1] );
	},
	// сравнивает два объекта класса LL - но (!) не полную эквивлентность
	//	вернёт истину, если al можно получить из this, то есть если al шире (иными словами, если this подмножество al)
	//	нужно для работы методов Andrej_node_list
	//	проверяет только dir[1]
	compare_part : function( al ) {
		if( al.moves_count < this.moves_count )
			return false;
		return this.dir[1].compare_part( al.dir[1] );
	}
}




function LL_line_array() {
	this.i_min = 0;
	this.i_max = 0;
	this.lines = this; // для совместимости со старшими и архивными версиями
}

function LL_line_array_prototype() {
	this.set = function( i, j, val ) {
		if( typeof(this[i])=='undefined' )
			this[i] = new LL_line;
		if( i<this.i_min )
			this.i_min = i;
		if( i>this.i_max )
			this.i_max = i;
		this[i][j] = val;
		if( j<this[i].j_min )
			this[i].j_min = j;
		if( j>this[i].j_max )
			this[i].j_max = j;
	};
	this.get = function( i, j ) {
		if( !(this[i] instanceof LL_line ) )
			return undefined;
		return this[i][j];
	};
	this.adjust_i_min_max = function() {
		while( (this.i_min<0 ) && ( !(this[this.i_min] instanceof LL_line) || !this[this.i_min].empty() ) )
			this.i_min++;
		while( (this.i_max>=0) && ( !(this[this.i_max] instanceof LL_line) || !this[this.i_max].empty() ) )
			this.i_max--;
	};
	this.compare = function( line ) {
		if( ( this.i_min!=line.i_min ) || ( this.i_max!=line.i_max ) )
			return false;
		for( var i=this.i_min; i<=this.i_max; i++ ) {
			var val1 = ( this[i] instanceof LL_line );
			var val2 = ( line[i] instanceof LL_line );
			if( val1!=val2 )
				return false;
			if( ( val1 && val2 ) && !this[i].compare( line[i] ) )
				return false;
		};
		return true;
	};
	this.compare_part = function( line ) {
		for( var i=line.i_min; i<=line.i_max; i++ ) {
			if( !( line[i] instanceof LL_line ) )
				continue;
			for( var j=line[i].j_min; j<line[i].j_max; j++ ) {
				var val = line.get(i,j);
				if( ( val>=0 ) && ( this.get(i,j)==1-val ) )
					return false;
			}
		};	
		return true;
	};
}

LL_line_array_prototype.prototype = Array.prototype;

LL_line_array.prototype = new LL_line_array_prototype;




function LL_line() {
	this.j_min = 0;
	this.j_max = 0;
}

function LL_line_prototype() {
	this.set = function( j, val ) {
		this[j] = val;
		if( j<this.j_min )
			this.j_min = j;
		if( j>this.j_max )
			this.j_max = j;
	};	
	this.adjust_j_min_max = function() {
		while( (this.j_min<0 ) && !( this[this.j_min]>=0 ) )
			this.j_min++;
		while( (this.j_max>=0) && !( this[this.j_max]>=0 ) )
			this.j_max--;
	};	
	this.empty = function() {
		return this.j_max<this.j_min;
	};
	this.compare = function( line ) {
		if( ( this.j_min!=line.j_min ) || ( this.j_max!=line.j_max ) )
			return false;
		for( var j=this.j_min; j<=this.j_max; j++ ) {
			var val1 = ( this[j]>=0 ? this[j] : -1 );
			var val2 = ( line[j]>=0 ? line[j] : -1 );
			if( val1!=val2 )
				return false;
		};
		return true;
	};
}

LL_line_prototype.prototype = Array.prototype;

LL_line.prototype = new LL_line_prototype;




