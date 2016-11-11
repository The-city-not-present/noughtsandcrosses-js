




// == Класс событий ==
//	дополнительно, класс событий для всей программы

function Event_callback_list() {
	this.nodes = [];
	this.max_id = -1;
	this.delay = 0;
}

Event_callback_list.prototype = {
	push : function( acb ) {
		var aid = ++this.max_id;
		this.nodes.push( {cb: acb, id: aid } );
		return aid;
	},

	// используется в undo_move
	push_once : function( acb ) {
		var aid = ++this.max_id;
		this.nodes.push( {cb: acb, id: aid, once: true } );
		return aid;
	},


	// вызвать всё "параллельно", то есть засунуть в setTimeout, и выполнится когда выполнится
	// такое использование я и предполагал, помогает исключить лишние задержки и исключения
	fire_events : function( arg0, arg1, arg2, arg3, arg4, arg5 ) {
		for( var i=0; i<this.nodes.length; i++ ) {
			var q=this.nodes[i];
			var flist = this;
			var cb = function() {
				var fcb = q.cb;
				var fid = q.id;
				var fonce = ( q.hasOwnProperty('once') && q.once );
				var remove_cb = function() {
					flist.clear_callback( fid );
				}
				setTimeout(
					function() {
						fcb( arg0,arg1,arg2,arg3,arg4,arg5 );
						if( fonce )
							remove_cb();
					},
					this.delay
				);
			}
			cb();
		}
	},

	// вызвать всё "последовательно", если нельзя ждать или надо быть уверенным, что результат нужен к определённому моменту
	fire_events_simultaneous : function( arg0, arg1, arg2, arg3, arg4, arg5 ) {
		for( var i=0; i<this.nodes.length; i++ ) {
			var fonce = ( this.nodes[i].hasOwnProperty('once') && this.nodes[i].once );
			try{
				this.nodes[i].cb( arg0,arg1,arg2,arg3,arg4,arg5 );
			} catch(e) {
				console.error(e);
			}
			if( fonce )
				this.clear_callback( this.nodes[i].id );
		}
	},

	clear_callback : function( aid ) {
		for( var i=0; i<this.nodes.length; i++ )
			if( this.nodes[i].id == aid )
				return this.nodes.splice(i,1);
		console.log('gameplay: Event_callback_list: clear_callback: удаление несуществующего ('+aid+')');
	}
}




// == Объекты игра ==

// это главный объект (класс), все данные о текущем сеансе игры
// функция-конструктор, создайте объект, чтобы начать игру
// аргументы - callback функции, будут вызваны, когда придёт пора ходить ()
// opts - параметры; если opts.strict == true, то сначала проверится, если игра уже идет, то ничего не произойдет;
//				без этого параметра - жесткое начало игры
// вернёт существующий объект game, если игра по каким-то причинам не началась
// установите свойство game.verbose - уровень отчётности в консоль;
//	- 0 - ничего не писать,
//	- 1 - писать, когда началась и закончилась игра,
//	- 2 - писать о каждом ходе
function Game( c0, c1 ) {
	// 1. инитиализация
	// состояние игры
	this.started = false;
	this.ondestroy = new Event_callback_list;
	this.onmovemade = new Event_callback_list;
	// в случае победы
	this.winner = false; // в случае победы будет 0 или 1 - номер игрока, иначе false, поэтому надо проверять с тремя равно ===
	this.win_by_resignation = false;
	this.win_but_draw = false;
	// координаты первого хода для компьютера; иначе он не выберет
	this.default_first_move = Game.default_first_move;
	// правило квадрата
	this.rules = Game.rules;
	// 2. создаем саму игру (условное деление, что пункт 1, что пункт 2)
	this.moves = [];
	// два игрока - создаю целые объекты
	this.players = [ new Player(c0), new Player(c1) ];
	this.l = new LL;
	this.verbose = 2;
	var g=this;
	Game.onstart.fire_events( g );
	if( this.verbose>0 )
		console.log('gameplay: game started   ( '+this.players[0].title+' vs '+this.players[1].title+' )');
	var cb = function() {
		g.move_now.call(g);
	}
	setTimeout( cb, 0 ); // в отдельном контексте параллельно
	this.started = true;
};

// общие объекты (события)
// массив callback для сообщений о победе/поражении
Game.onwin = new Event_callback_list;
Game.onfinish = new Event_callback_list;
Game.onmovemade = new Event_callback_list; // то же для оповещений и ходах
Game.onstart = new Event_callback_list;

// значения по умолчанию - в полях объекта-функции Game
// координаты первого хода для компьютера - по умолчанию; иначе он не выберет
Game.default_first_move = { x: 45, y: 12 };
// правило квадрата - по умолчанию
Game.rules = { square: true };


Game.prototype = {

	// вернет true, если можно начать новую игру (не придется обрывать текущую)
	can_be_restarted : function() {
		return ( this.empty() || !this.started );
	},

	empty : function() {
		return ( this.moves.length == 0 );
	},

	// кончить
	finish : function( averbose ) {
		if( !this.started )
			return false;
		if( typeof(averbose)=='undefined' )
			averbose = true;
		if( averbose && (this.verbose>0) )
			console.log('gameplay: game interrupted   ( '+this.players[0].title+' vs '+this.players[1].title+' )');
		Game.onfinish.fire_events( this );
		this.started = false;
		return true;
	},

	destroy : function() {
		// закончить
		this.finish( false );
		// и всех оповестить
		this.ondestroy.fire_events( this );
		// это всё
	},

	// сделать ход
	move : function( ax, ay ) {
		// проверим статус
		if( !this.started )
			return false;
		// преобразуем аргументы
		// проверим победу в случае сдачи, тогда ход делать не надо
		this.winner = false;
		if( ( typeof(ax) == 'object' ) && (ax.hasOwnProperty('resign')) && ax.resign ) {
			this.winner = 1 - this.moves.length % 2;
			this.win_by_resignation = true;
		};
		// преобразуем координаты
		if( this.winner === false ) {
			if( ( typeof(ax) == 'object' ) && (ax.hasOwnProperty('x')) && (ax.hasOwnProperty('y')) ) {
				ay=ax.y;
				ax=ax.x;
			}
			if( this.empty() && !isFinite(ax) && !isFinite(ay) ) {
				if( typeof(this.default_first_move)=='function' ) {
					ax = this.default_first_move().x;
					ay = this.default_first_move().y;
				} else {
					ax = this.default_first_move.x;
					ay = this.default_first_move.y;
				}
			}
			// сделаем ход
			if( !this.is_valid_move( ax, ay ) )
				return false;
			this.players[this.moves.length&1].update_move_delay_end(); // важно: до команды push
			// TODO: <quote>до команды push</quote>   пруф? а если плохой ход? ложное срабатывание?
			this.moves.push( { x: ax, y: ay } );
			// сгенерируем ряды
			this.l = new LL(this);
			if( !( this.l instanceof LL ) ) {
				this.moves.splice( this.moves.length-1, 1 );
				return false;
			}
			// проверим, не пора ли "прощай, пиздабол"
			this.winner = this.l.check_win();
			// если ещё нет, может, всё же, пора?
			if( this.moves.length > 200 ) {
				this.win_but_draw = true;
				this.winner -1;
			};
			if( this.verbose>1 )
				console.log( 'game : move #'+this.moves.length+'  [ '+(ax-this.moves[0].x)+', '+(ay-this.moves[0].y)+' ]       ( '+ax+', '+ay+' )       ( '+(isFinite(this.players[0].last_move_delay_val)?Math.round(this.players[0].last_move_delay_val/100)/10+' s':'-')+', '+(isFinite(this.players[1].last_move_delay_val)?Math.round(this.players[1].last_move_delay_val/100)/10+' s':'-')+' )' );
			Game.onmovemade.fire_events( ax, ay, this.moves.length-1 ); // типа глобальные
			this.onmovemade.fire_events_simultaneous( ax, ay, this.moves.length-1 ); // типа локальные; но всё равно выглядит подозрительно
			// они по-разному вызываются; если глобальные - это просто всякие там привязки, типа значки крестиков и ноликов в интерфейсе
			// то в локальные - это конкретика, там иногда надо обновить значения ИИ, поэтому вызываются "simultaneous" (последовательно)
		};
		// нельзя написать просто else, так как там внутри ифа тоже проверяется winner
		if( this.winner !== false ) {
			this.finish( false );
			this.windata = [
				this.l.translate_ij_to_xy( this.l.windata[0].x, this.l.windata[0].y, this.moves[0] ),
				this.l.translate_ij_to_xy( this.l.windata[1].x, this.l.windata[1].y, this.moves[0] )
			];
			if( this.verbose>0 ) {
				var win_str = '==';
				if( this.winner === 0 )
					win_str = '+' + this.moves.length;
				if( this.winner === 1 )
					win_str = '-' + this.moves.length;
				console.log('gameplay: game finished  '+win_str+'   ( '+this.players[0].title+' vs '+this.players[1].title+' )');
			}
			Game.onwin.fire_events( this.winner );
			return true;
		}
		// вызовем следующий ход
		var g = this;
		var cb = function() { g.move_now.call(g); }
		setTimeout( cb, this.players[this.moves.length&1].last_real_delay_reduced() ); // вызываю в отдельном контексте и параллельно
		return true; // мы прошли все квесты и добрались сюда - значит, успех
	},

	//
	is_valid_move : function( ax, ay ) {
		if( !isFinite(ax) || !isFinite(ay) )
			return false;
		for( var i=0; i<this.moves.length; i++ )
			if( (this.moves[i].x==ax) && (this.moves[i].y==ay) )
				return false;
		if(
			(
				this.rules.square &&
				(this.moves.length == 2)
			) && (
				( Math.abs(ax-this.moves[0].x) <= 2 ) &&
				( Math.abs(ay-this.moves[0].y) <= 2 )
			)
		)
			return false;
		return true;
	},

	// сделать ход игрока
	move_now : function() {
		var pl = this.moves.length&1;
		if( this.players[pl].is_valid_player() ) {
			this.players[pl].update_move_delay_start();
			this.players[pl].update_real_delay_start();
			this.players[pl].move_now();
			this.players[pl].update_real_delay_end();
		} else
			throw 'gameplay: game: move_now: not a valid player   \'' + ( this.players[pl].hasOwnProperty('title') ? this.players[pl].title : JSON.stringify(this.players[pl].cb) ) + '\'';
	},

	check_finish : function() {
	}
}



// == Объекты игроков ==

function Player( cb ) {
// cb - callback-функции, приглашение сходить
	this.title = '???';
	if( ( typeof(cb)=='string' ) && window.hasOwnProperty(cb) ) {
		var title = cb;
		cb = window[cb];
		cb.title = title;
	}
	this.cb = cb;
	if( cb instanceof Object ) {
		if( cb.hasOwnProperty('title') && (typeof(cb.title)=='string') )
			this.title = cb.title;
		this.status = ( ( cb.hasOwnProperty('ai_status') && (typeof(cb.ai_status)=='string') ) ? cb.ai_status : 'undefined' );
	}
}

Player.prototype = {
	is_valid_player : function() {
		if( typeof(this.cb)=='function' )
			return true;
		if( ( typeof(this.cb)=='object' ) && ( typeof(this.cb.move_now)=='function' ) )
			return true;
		return false;
	},

	move_now : function() {
		if( typeof(this.cb)=='function' ) {
			this.cb();
			return;
		}
		if( ( typeof(this.cb)=='object' ) && ( typeof(this.cb.move_now)=='function' ) ) {
			this.cb.move_now();
			return;
		}
		throw 'gameplay: player: move_now: illegal move_now format \'' + ( this.hasOwnProperty('title') ? this.title : JSON.stringify(this.cb) ) + '\'';
	},


	destroy : function() {
		if( ( typeof(this.cb)=='object' ) && this.cb.hasOwnProperty('destroy') && ( typeof(this.cb.destroy)=='function' ) )
			this.cb.destroy();
	},


	last_real_delay : function() {
		var diff = this.last_real_delay_val;
		if( (typeof(diff)!='number') || (diff<0) ) diff = 0;
		return diff;
	},
	last_real_delay_reduced : function() {
		var diff = Math.pow( this.last_real_delay(), 0.6 ) * 2;
		if( diff>5000 ) diff = 5000;
		return diff;
	},
	update_real_delay_start : function() {
		this.last_real_time_start = new Date();
	},
	update_real_delay_end : function() {
		this.last_real_time_end = new Date();
		this.last_real_delay_val = this.last_real_time_end - this.last_real_time_start;
	},
	last_move_delay : function() {
		var diff = this.last_move_delay_val;
		if( (typeof(diff)!='number') || (diff<0) ) diff = 0;
		return diff;
	},
	update_move_delay_start : function() {
		this.last_move_time_start = new Date();
	},
	update_move_delay_end : function() {
		this.last_move_time_end = new Date();
		this.last_move_delay_val = this.last_move_time_end - this.last_move_time_start;
	}
}







