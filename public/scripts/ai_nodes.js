// В этом файле будет Andrej_node (общий класс) и потомки





// Andrej_node class

// Структура:
//	каждый элемент имеет значения
//	- probability (вероятность, что позиция когда-нибудь настанет)
//	- variants_count (количество всевозможных ходов (и ответов на ходы, и ответов на них - всех aka "вариаций"); на основе этого
//	  значения корректируется вероятность, что поставленная оценка верная)
//	- estimate (оценка, показатель того, с какой вероятностью игрок одержит победу; точнее, это значение переводится в
//	  вероятность функцией score_to_expectancy)
// соответственно, каждый элемент имеет поле (массив) moves с такими же значениями и parents
//	


// параметры:
//	al - позиция, объект LL
//	Конструктор не делает копию! Не измени существующий объект!
function Andrej_node( al ) {
	if( !( al instanceof LL ) )
		throw new Andrej_error( '(node #'+this.id+') Andrej_node() : !LL' );
	this.l = al;
	this.parents = []; // там будут объекты Andrej_nodemove; чтобы найти родительскую позицию, надо будет взять ещё раз parent
	// и сразу посчитаем оценки
	this.get_moves();
	this.update_moves_probability();
	this.estimate = [ undefined, undefined ];
	this.update_estimate();
	this.depth = 1;
}

Andrej_node.prototype = {
	// вызывается один раз из конструктора
	// вызывает Andrej_estimates и генерирует список ходов
	get_moves : function( opts ) {
		var me = this.l.moves_count & 1;
		var ar = new Andrej_estimates( this.l );
		this.moves = [];
		if( ar.win!==true ) {
			var output = ar.get_moves();

			if( output.length==0 )
				throw new Andrej_error( '(node #'+this.id+') Andrej_node.get_moves : moves == []' );

			for( var i=0; i<output.length; i++ ) {
			// переберём ходы
				var temp_l = new LL( this.l );
				temp_l.modify_lines( output[i].x, output[i].y );
				// готово, всё собрали, создаём и добавляем объект Andrej_node_move в массив
				this.moves[i] = new Andrej_nodemove(
					output[i].x, // координаты
					output[i].y,
					new Andrej_node_leaf( temp_l ),
					this, // parent
					undefined // move probability
				);
			}
			this.variants_count = this.moves.length;
		} else { // если ar.win === true
			this.variants_count = 1;
			this.reliability = 1;
			this.estimate = ( (ar.winner==0) ? [1,0] : [0,1] );
		}
	},


	// пересчитать probability каждого хода
	update_moves_probability : function() {
		// 0. общие переменные
		var me = this.l.moves_count & 1;
		// 1. создадим временный массив значений
		var ebnf = [];
		var sum_k = 0;
		var sum_s = 0;
		var num_win = [];
		for( var i=0; i<this.moves.length; i++ ) {
			var p = andrej_move.diff( this.moves[i].pos.estimate[me], this.moves[i].pos.estimate[1-me], this.moves[i].pos.reliability );
			if( p==1 ) {
				num_win.push( { i: i } );
				continue;
			};
			if( p==0 ) {
				ebnf[i] = { k: 0 };
				continue;
			};
			var k = p+0.5;
			var val = andrej_move.posindex_expectancy_to_score(p);
			ebnf[i] = { k: k, val: val, rel: this.moves[i].pos.reliability };
			sum_k += k;
			sum_s += val * k;
		}
		// 2. если есть победный ход
		if( num_win.length>0 ) {
			for( var i=0; i<this.moves.length; i++ )
				this.moves[i].probability = 0;
			for( var i=0; i<num_win.length; i++ )
				this.moves[num_win[i].i].probability = 1/num_win.length;
			this.estimate = [ 0, 0 ];
			this.estimate[me] = 1;
			this.reliability = 1;
			return;
		};
		// обязательная проверка на ошибку - тысячу раз меня спасала
		if( !isFinite(sum_k) )
			throw new Andrej_error( '(node #'+this.id+') Andrej_node.update_moves_probability: !isFinite(sum_k)' );
		// 3. если нет непроигрывающих ходов
		if( !(sum_k>0) ) {
			for( var i=0; i<this.moves.length; i++ )
				this.moves[i].probability = 0;
			this.estimate[me] = 0;
			this.estimate[1-me] = 1;
			this.reliability = 1;
			return;
		};
		// 4. все остальные "типичные" случаи
		var k_nnn = this.moves.length-1;
		var k_kkk = Math.log(1/k_nnn)/Math.log(0.5);
		function diff_val( a, b, rel ) { // по аналогии с andrej_move.diff()
			var x = a - b;
			var u = -4.481420117724551*andrej_move.precision_move_order*Math.log(rel);
			return Math.pow(1/(1+Math.exp(-x/(2*u*u))),k_kkk); // k_kkk - чтобы дало 1/колич.ходов, если все оценки 0
		}
		// в три итерации
		var k_reduce_mediana = 1 - andrej_move.k_reduce_mediana * ( 1 - ( this.reliability>0 ? this.reliability : andrej_move.reliability_default ) );
		for( var iter=0; iter<4; iter++ ) {
			var mediana = k_reduce_mediana * sum_s / sum_k;
			sum_k = 0;
			sum_s = 0;
			for( var i=0; i<this.moves.length; i++ ) {
				if( ebnf[i].k==0 ) {
					this.moves[i].probability = 0;
					continue;
				};
				var k = diff_val( ebnf[i].val, mediana, ebnf[i].rel );
				ebnf[i].k = k;
				this.moves[i].probability = k;
				sum_k += k;
				sum_s += ebnf[i].val * k;
			}
		}
		for( var i=0; i<this.moves.length; i++ )
			this.moves[i].probability = ebnf[i].k / sum_k;
	},

	// пересчитать estimate позиции
	// повесим на эту функцию и обновление reliability
	update_estimate : function() {
		var me = this.l.moves_count & 1;
		var sum_s = [ 0, 0 ];
		var sum_rel = 0;
		var sum_k = 0;
		for( var i=0; i<this.moves.length; i++ ) {
			var k = this.moves[i].probability;
			if( !(k>0) )
				continue;
			if( this.moves[i].pos.estimate[me]==1 ) {
				this.reliability = 1;
				this.estimate[1-me] = 0;
				this.estimate[me] = 1;
				return;
			}
			sum_k += k;
			var rel = this.moves[i].pos.reliability;
			sum_s[0] += k * andrej_move.translate.forward( this.moves[i].pos.estimate[0]/**rel*/ );
			sum_s[1] += k * andrej_move.translate.forward( this.moves[i].pos.estimate[1]/**rel*/ );
			rel = 0.85*k * rel + (1-0.85*k) * andrej_move.reduce_reliabilities_by_depth(rel);
			sum_rel += k * rel;
		};
		if( !isFinite(sum_k) )
			throw new Andrej_error( '(node #'+this.id+') Andrej_node.update_estimate: !isFinite(sum_k)' );
		if( sum_k>0 ) {
			this.reliability = sum_rel / sum_k;
			this.estimate[0] = andrej_move.translate.backward( sum_s[0] / sum_k );// / this.reliability;
			this.estimate[1] = andrej_move.translate.backward( sum_s[1] / sum_k );// / this.reliability;
		} else {
			this.reliability = 1;
			this.estimate[me] = 0;
			this.estimate[1-me] = 1;
		}
		if( isNaN(this.estimate[0]) || isNaN(this.estimate[1]) )
			throw new Andrej_error( '(node #'+this.id+') Andrej_node.update_estimate: NaN' );
	},

	// пересчитать probability позиции
	update_position_probability : function() {
		if( this.parents.length == 0 )
			return;
		var parent_probability_rev = 1;
		for( var i=0; i<this.parents.length; i++ ) {
			parent_probability_rev = (
				false && this.parents[i].parent.is_zero_node ? // маленький костылёк, чтобы из начальной позиции все ходы просчитывались
				parent_probability_rev *
				( 1 - this.reliability * this.parents[i].probability - (1-this.reliability) / this.parents[i].parent.moves.length ):
				parent_probability_rev *
				( 1 - this.parents[i].parent.probability * this.parents[i].probability )
			);
		};
		this.probability = 1 - parent_probability_rev;
	},

	// пересчитать variants_count позиции
	update_variants_count : function() {
		var temp_varcount = 0;
		for( var i=0; i<this.moves.length; i++ )
			temp_varcount += this.moves[i].pos.variants_count;
		this.variants_count = temp_varcount;
	},

	// пересчитать depth позиции (по главной линии)
	update_depth : function() {
		if( this.moves.length == 0 )
			this.depth = 0;
		else
			this.depth = this.best_move().pos.depth + 1;
	},

	sort_moves : function() {
		this.moves.sort( Andrej_node.compare_moves );
	},

	best_move : function() {
		var best = this.moves[0];
		for( var i=0; i<this.moves.length; i++ )
			if( Andrej_node.compare_moves( best, this.moves[i] ) > 0 )
				best = this.moves[i];
		return best;
	}

}




function Andrej_node_leaf( al ) {
	this.parents = [];
	this.l = al;
	this.ar = new Andrej_estimates( this.l );
	this.estimate = [ 1, 1 ];
	var moves = this.ar.get_moves();
	for( var i=0; i<moves.length; i++ ) {
		this.estimate[0] = this.estimate[0] * (1-moves[i].estimate_split[0]);
		this.estimate[1] = this.estimate[1] * (1-moves[i].estimate_split[1]);
	}
	this.estimate[0] = 1 - this.estimate[0];
	this.estimate[1] = 1 - this.estimate[1];
	this.reliability = 0.5; // TODO: stub
	this.variants_count = 1;
	this.depth = 0;
}

function Andrej_node_leaf_prototype() {

	this.get_moves = function( opts ) {
		this.moves = [];
	};

	this.update_moves_probability = function() {}; // нечего обновлять, но надо переопределить функцию прототипа

	this.update_estimate = function() {}; // нечего обновлять, но надо переопределить функцию прототипа

}

Andrej_node_leaf_prototype.prototype = Andrej_node.prototype;

Andrej_node_leaf.prototype = new Andrej_node_leaf_prototype;




Andrej_node.compare_moves = function( a, b ) {
	return b.probability - a.probability;
}




// Andrej_nodemove class
//	это "рёбра" графа
//	рёбра из элемента parent в элемент pos
//	pos: позиция, к которой ведёт ход; может быть экземпляром Andrej_node или просто объектом
//	x, y: координаты хода; по идее на результат вычислений не должны влиять, но пользователь же хочет знать
//	probability (изначально probability_local) - вероятность, что будет выбран именно этот ход
function Andrej_nodemove( ax, ay, aposition, aparent, aprobability ) {
	this.x = ax;
	this.y = ay;
	this.pos = aposition;
	this.parent = aparent;
	this.probability = aprobability;
}

Andrej_nodemove.prototype = {
	// пусто, раньше было evaluate - теперь перенесено Andrej_node_position_hash
}



