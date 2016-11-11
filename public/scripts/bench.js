// функция откуда-то скопирована, позволяет узнать среднее время выполнения команды
//	два аргумента
//	- функция, которую выполнить
//	- количество раз для чистоты результата
//	вернёт милисекунды
function bench( f, count ) {
	if( typeof(count)=='undefined' )
		count = 1;
	var d = new Date();
	for( var i=0; i<count; i++ )
		f(i);
	return new Date() - d; // это милисекунды
}

// количество итераций при вызове рекурсивного поиска хода
//		итерация - это вызов andrej_move.calculate_all_estimates
//	аргумент - параметр width, как для рекурсивного поиска
function calc_move_time( width ) {
	return andrej_move_0_0_4.calc_move_time(width);
}

function calc_move_time_0_0_3( width ) {
	var w = null;
	for( var i=0; i<width.length; i++ ) {
		w = [width[i],w];
	}
	return andrej_move.calc_move_time(w);
}

// делает рекурсивный ход и возвращает среднее время одной итерации
// опирается на calc_move_time
function bench_move( width ) {
	return bench( function(){andrej_move.find_best_move(width)}, 1 ) / (calc_move_time(width));
}

function bench_move_003( width ) {
	return bench( function(){andrej_move_0_0_3.find_best_move(width)}, 1 ) / (calc_move_time_0_0_3(width));
}

// банальное округление, для ускорения набора
function r( arg ) {
	return Math.round(arg*1000)/1000;
}





// == комментарии оценки ==

function Commentary( arg ) {
	this.game = arg;
	this.last_move = null;
	// пользовательские
	this.custom = [];
	this.custom_funcs = [];
}

Commentary.prototype = {

	create_window_elements : function() {
			var q=this;
		if( typeof($("#commentary").get(0)) != 'object' ) {
			$("#field").append(
				'<div id="commentary" style="font-size: 10px; font-family: Courier New, Courier; padding: 5px; background: #fff; position: absolute; left: 0; top: 0; z-index: 1; ">'+
					'<div id="commentary_index">*</div>'+
					'<table id="commentary_moves_table" class="commentary-table" style="display: none;">'+
					'</table>'+
					'<table id="commentary_data_table"  class="commentary-table" style="display: block;"><tr>'+
						'<td style="color: #777;">0 :</td>'+
						'<td style="color:#000;font-weight:bold;"><span id="commentary_index_0"></span></td>'+
						'<td>( <span id="commentary_est_0"></span> )</td>'+
						'<td><span id="commentary_moves_0"></span></td>'+
					'</tr><tr>'+
						'<td style="color: #777;">1 :</td>'+
						'<td style="color:#000;font-weight:bold;"><span id="commentary_index_1"></span></td>'+
						'<td>( <span id="commentary_est_1"></span> )</td>'+
						'<td><span id="commentary_moves_1"></span></td>'+
					'</tr></table>'+
					'<div id="commentary_custom"></div>'+
				'</div>'
			);
			$("#commentary").click( function() { q.hide.call( q ); } );
		}
	},

	gain_data : function() {
		// получим данные
		var x = this.rel_pos_x;
		var y = this.rel_pos_y;
		this.nodata = this.game.empty();
		if( this.nodata ) {
			this.total_index = '<пусто>';
			this.moves_list = [];
			return;
		}
		var ar = this.ar;
		this.nodata = (ar.win===true);
		if( this.nodata ) {
			this.total_index = '<конец>';
			this.moves_list = [];
			return;
		}
		ar = ar.ar;
		// крестики
		var est = '1';
		var ind = '0';
		var comm = '<нет>';
		if( ( typeof(ar[x])!='undefined' ) && ( typeof(ar[x][y])!='undefined' ) ) {
			if( ar[x][y].hasOwnProperty('estimate') )
				est = ar[x][y].estimate[0];
			else
				est = 1;
			if( ar[x][y].hasOwnProperty('commentary') )
				comm = ar[x][y].commentary[0];
			else
				comm = '<нет>';
			ind = andrej_move.ar_estimate_to_val(est);
			est = ''+Math.round(est*100)/100;
			ind = ''+Math.round(ind*100)/100;
			if( ind>0 ) ind = '+'+ind;
		}
		this.move_0_index = ind;
		this.move_0_est = est;
		this.move_0_comm = comm;
		// нолики
		est = '1';
		ind = '0';
		comm = '<нет>';
		if( ( typeof(ar[x])!='undefined' ) && ( typeof(ar[x][y])!='undefined' ) ) {
			if( ar[x][y].hasOwnProperty('estimate') )
				est = ar[x][y].estimate[1];
			else
				est = 1;
			if( ar[x][y].hasOwnProperty('commentary') )
				comm = ar[x][y].commentary[1];
			else
				comm = '<нет>';
			ind = andrej_move.ar_estimate_to_val(est);
			est = ''+Math.round(est*100)/100;
			ind = ''+Math.round(ind*100)/100;
			if( ind>0 ) ind = '+'+ind;
		}
		this.move_1_index = ind;
		this.move_1_est = est;
		this.move_1_comm = comm;
		// общая оценка
		this.total_index = '' + Math.round( this.total_index_original*100 ) /100;
		if( isNaN(this.total_index) )
			this.total_index = this.total_index_original;
		/*if( this.total_index>0 )
			this.total_index = '+'+this.total_index;*/
		// если есть такой ход
		this.moves_list = [];
		/*for( var i=0; i<this.position_node.moves.length; i++ )
			if( (x==this.position_node.moves[i].x) && (y==this.position_node.moves[i].y) ) {
				est = -this.position_node.moves[i].pos.estimate;
				est = Math.round(est*100)/100;
				if( est>0 ) est = '+'+est;
				var prob = Math.round(this.position_node.moves[i].probability*100)/100;
				this.moves_list.push( { id: '#'+i, est: est, prob: prob } );
			}*/
		// пользовательские
		this.custom = [];
		for( var i=0; i<this.custom_funcs.length; i++ )
			this.custom.push( this.custom_funcs[i].call(this,x,y,ar) );
	},

	// только обновляет содержимое блоков, не положение - см. mouse_move_cb
	update : function() {
		if( this.need_to_refresh() )
			this.refresh();
		this.gain_data();
		// общая оценка
		$("#commentary_index").text( this.total_index );
		// если есть такой ход
		$("#commentary_moves_table").empty();
		if( this.moves_list.length>0 )
			$("#commentary_moves_table").show();
		else
			$("#commentary_moves_table").hide();
		for( var i=0; i<this.moves_list.length; i++ ) {
			var str =
				'<td style="color: #777; ">move <span style="color:#000;">'+this.moves_list[i].id+'</span></td>'+
				'<td style="color: #f00000; font-weight: bold; ">'+this.moves_list[i].est+'</td>'+
				'<td>'+this.moves_list[i].prob+'</td>';
			$("#commentary_moves_table").append('<tr>'+str+'</tr>');
		}
		// может, конец, и всё поле надо скрыть
		if( this.nodata===true )
			$("#commentary_data_table").hide();
		else
			$("#commentary_data_table").show();
		// крестики
		$("#commentary_index_0").text( this.move_0_index );
		$("#commentary_est_0").text( this.move_0_est );
		$("#commentary_moves_0").text( this.move_0_comm );
		// нолики
		$("#commentary_index_1").text( this.move_1_index );
		$("#commentary_est_1").text( this.move_1_est );
		$("#commentary_moves_1").text( this.move_1_comm );
		// пользовательские
		$("#commentary_custom").empty();
		var str = '';
		for( var i=0; i<this.custom.length; i++ ) {
			var str2 = '';
			for( var j=0; j<this.custom[i].length; j++ )
				str2 += '<td>'+this.custom[i][j]+'</td>';
			str += '<tr>'+str2+'</tr>';
		}
		if( str != '' )
			$("#commentary_custom").append( '<table class="commentary-table">'+str+'</table>' );
	},

	show : function() {
		this.create_window_elements();
		var q = this;
		$("#field").mousemove(
			function(e){
				pos = $(this).position();
				x = e.pageX - pos.left;
				y = e.pageY - pos.top;
				x = x / 16 | 0;
				y = y / 16 | 0;
				q.mouse_move_cb.call( q, x, y );
			}
		);
		setTimeout( function(){ q.refresh.call(q) }, 0 );
	},

	hide : function() {
		$("#field").unbind('mousemove');
		$("#commentary").remove();
		$("#commentary_index").remove();
	},

	refresh : function() {
		this.last_move = (
			this.game.empty() ?
			this.game :
			this.game.moves[this.game.moves.length-1]
		);
		this.ar = new Andrej_estimates( this.game.l, { make_commentary: true } );
		this.total_index_original = '?';//andrej_move.get_position_static_estimate( this.ar ).estimate;
	},

	need_to_refresh : function() {
		// проверяем ссылку на объект
		// а объект - это последний ход или game, если ходов не сделано
		// могу проверять позицию через LL, выглядит логичнее, не надо делать исключений для первого хода
		// но зачем, намного больше операций?
		return (
			typeof(this.last_move)=='undefined') ||
			( this.last_move != ( this.game.empty() ? this.game : this.game.moves[this.game.moves.length-1] )
		);
	},

	mouse_move_cb : function( x, y ) {
		// обновим содержимое блоков
		this.mouse_pos_x = x;
		this.mouse_pos_y = y;
		this.rel_pos_x = 0;
		this.rel_pos_y = 0;
		if( !this.game.empty() ) {
			this.rel_pos_x = x - this.game.moves[0].x;
			this.rel_pos_y = y - this.game.moves[0].y;
		}
		this.update();
		$("#commentary").css( 'left', (x+1)*16+'px' );
		$("#commentary").css( 'top', (y+1)*16+'px' );
		// обновим положение блоков
	},

	destroy : function() {
		this.hide();
		// там внутри удалены элементы страницы
		// и отвязаны события на движение мыши
		// большего не требуется
	},

}

var comm;

Game.onstart.push(
	function( arg ) {
		if( comm instanceof Commentary )
			comm.destroy;
		comm = new Commentary( arg );

		var acomm = comm;
		var cb_destroy = function() {
			acomm.destroy.call( acomm );
		}
		arg.ondestroy.push( cb_destroy );
	}
);

function commentary_on_estimates() {
	comm.show();
}

$( function(){ document.body.innerHTML += '<style>.commentary-table, .commentary-table tr { color: #222; padding: 0; margin: 0; } .commentary-table td { margin: 0; padding: 0 10px 0; white-space: nowrap; }</style>'; } );






// == оценки графически ==
// TODO: посмотреть код

function vivid( options ) {
	if( options == 'stop' ) {
		if( vivid.update_id === false )
			return;
		$("#andrej_vivid_canvas").remove();
		delete game.onmovemade[vivid.update_id];
		vivid.update_id = false;
		return;
	}
	if( vivid.update_id !== false )
		vivid( 'stop' );
	vivid.width = null;
	if( (typeof(options)=='object') && options.hasOwnProperty('width') )
		vivid.width = options.width;
	vivid.options = options;
	if( vivid.width === null ) {
		vivid.update_id = game.onmovemade.push( vivid_static )-1;
		vivid_static();
	} else {
		vivid.update_id = game.onmovemade.push( vivid_recursive )-1;
		vivid_recursive();
	};
}

vivid.update_id = false;

// нарисовать на экране оценку
// TODO: обновить код
function vivid_static() {
	setTimeout(
		function(){
			var only = false; // ???
			if( (typeof(vivid.options)=='object') && vivid.options.hasOwnProperty('method') && (vivid.options.method=='only') )	only = true;
			if( only )
				var me = vivid.options.me;
			vivid_static.ar = andrej_move.calculate_all_estimates( { increase_est : false, kk_me : 0.5, kk_opponent : 0 } );
			if( typeof($("#andrej_vivid_canvas").get(0)) != 'object' )
				$("#field").append('<canvas id="andrej_vivid_canvas" style="position: absolute; left: 0; top: 0; visibility: '+$("#estimate_visibility option:selected").val()+'; "></canvas>');
			$("#andrej_vivid_canvas").attr( "width", $("#field").width() );
			$("#andrej_vivid_canvas").attr( "height", $("#field").height() );
			var ctx = $("#andrej_vivid_canvas").get(0).getContext("2d");
			ctx.beginPath();
			for( var i=vivid_static.ar.i_min; i<=vivid_static.ar.i_max; i++ ) {
				if( typeof(vivid_static.ar[i]) == 'undefined' ) {
					vivid_static.ar[i] = [];
					vivid_static.ar[i].j_min = -4;
					vivid_static.ar[i].j_max = 4;
				};
				for( var j=vivid_static.ar[i].j_min; j<=vivid_static.ar[i].j_max; j++ ) {
					if( typeof(vivid_static.ar[i][j]) == 'undefined' )
						continue;
					var est0, est1;
					est0 = vivid_static.ar[i][j].estimate[0];
					est1 = vivid_static.ar[i][j].estimate[1];
					est0 = Math.log(est0)*0.25;
					est1 = Math.log(est1)*0.25;
					if( est0<0 ) est0 = 0;
					if( est1<0 ) est1 = 0;
					if( est0+est1 == 0 )
						continue;
					if( est0 > 1 ) est0 = 1;
					if( est1 > 1 ) est1 = 1;
					if( only ) {
						if( me!=0 ) est0 = 0;
						if( me!=1 ) est1 = 0;
					}
					var r,g,b;
					r = Math.round( (127*est0-255) * est1 + 255 );
					g = Math.round( (127*est1-255) * est0 + 255 );
					r1 = Math.sqrt( est0*est0 + est1*est1 );
					r2 = 1 - est0; if( 1-est1 < r2 ) r2 = 1-est1;
					sum = ( (765-510*r1)*r2 + 255*r1 ) / ( r1+r2 );
					sum = Math.round( sum );
					b = sum - r - g;
					ctx.fillStyle = 'rgba( '+r+','+g+','+b+',1 )';
					ctx.fillRect( (game.moves[0].x+i)*16, (game.moves[0].y+j)*16, 15, 15 );
				}
			}
		},
		0
	)
};



// == то же с поиском в глубину ==
// TODO: обновить код
function vivid_recursive( arg1, arg2 ){
	if( arg1 == 'stop' ) {
		$("#andrej_vivid_canvas").remove();
		return;
	}
	if( game.moves.length == 0 )
		return;
	arg2 = JSON.parse(arg2);
	var est_func = function() {
		return {moves:[],index:undefined,variants_count:0};
	}
	if( /^ai_(?!003)(.*)/.test(arg1) )
		est_func = function( arg ) { andrej_move.adjust_indexes( arg ); return andrej_move.position_index_recursive( arg, {sort_moves:true,index_for:true} ); }
	if( /^ai_003(.*)/.test(arg1) )
		est_func = function( arg ) { return andrej_move_0_0_3.position_index_recursive( arg, {sort_moves:true,index_for:true} ); }
	var data = est_func( arg2 );
	$('#bench_recursive_estimate').text(Math.round(data.index*10000)/10000);
	if( typeof($("#andrej_vivid_canvas").get(0)) != 'object' )
		$("#field").append('<canvas id="andrej_vivid_canvas" style="position: absolute; left: 0; top: 0; visibility: '+$("#estimate_visibility option:selected").val()+'; "></canvas>');
	$("#andrej_vivid_canvas").attr( "width", $("#field").width() );
	$("#andrej_vivid_canvas").attr( "height", $("#field").height() );
	var ctx = $("#andrej_vivid_canvas").get(0).getContext("2d");
	ctx.beginPath();
	for(var i=0;i<data.moves.length;i++){
		var x = data.moves[i].x + game.moves[0].x;
		var y = data.moves[i].y + game.moves[0].y;
		var calc_est_val = function(arg) {
			if( arg == Infinity ) return {a:1,b:0};
			if( arg == -Infinity ) return {a:0,b:1};
			var est0 = data.moves[i].estimate/15;
			var est1 = -data.moves[i].estimate/15;
			if( isNaN(est0) || (est0<0) ) est0 = 0;
			if( isNaN(est1) || (est1<0) ) est1 = 0;
			if( est0 > 1 ) est0 = 1;
			if( est1 > 1 ) est1 = 1;
			var sum = 1 - (est0 + est1);
			est0 += 0.15*sum;
			est1 += 0.15*sum;
			return {a:est0,b:est1};
		}
		var est = calc_est_val(data.moves[i].estimate);
		var est0 = est.b;
		var est1 = est.a;
		var r,g,b;
		r = Math.round( (127*est0-255) * est1 + 255 );
		g = Math.round( (127*est1-255) * est0 + 255 );
		r1 = Math.sqrt( est0*est0 + est1*est1 );
		r2 = 1 - est0; if( 1-est1 < r2 ) r2 = 1-est1;
		sum = ( (765-510*r1)*r2 + 255*r1 ) / ( r1+r2 );
		sum = Math.round( sum );
		b = sum - r - g;
		ctx.fillStyle = 'rgba( '+r+','+g+','+b+',1 )';
		ctx.fillRect( x*16, y*16, 15, 15 );
	}
}













function Test_moves( l ) {
	this.l = new LL(l);
	this.id = 'test_moves';
	var me = this.l.moves_count & 1;
	var ar = new Andrej_estimates( this.l );
	this.moves = [];
	if( ar.win!==true ) {
		var output = ar.get_moves();

		if( output.length==0 )
			throw new Andrej_error( '(node #'+this.id+') Andrej_node_recursive.get_moves : moves == []' );

		function temp_rel(a) { if(a==1)return 1; return Math.pow( 0.9-0.9*a, 4 ); }
		// сначала посчитаем среднеквадратичную (с вес. коэф.) угрозу противника (из всех ходов!)
		var sum_sq = ar.sum_sq();
		var l2 = new LL(this.l);
		for( var i=0; i<output.length; i++ ) {
		// переберём ходы
			var uv = l2.modify_lines( output[i].x, output[i].y );
			var ar2 = new Andrej_estimates( l2 );
			var sum_sq2 = /*['?','?'];*/ar2.sum_sq();
			var temp_val = [
				andrej_move.ar_estimate_to_val( output[i].estimate_split[ 0 ] ),
				andrej_move.ar_estimate_to_val( output[i].estimate_split[ 1 ] )
			];
			var sign = [1,1];
			sign[1-me] = -1;
			var A = [];
			A[0] = sum_sq[0];
			A[1] = temp_val[0];
			A[2] = sum_sq2[0];
			A[3] = andrej_move.translate.backward(
				andrej_move.translate.forward(sum_sq[0]) +
				sign[0]*(output[i].estimate_split[0]+output[i].estimate_split[1])/sum_sq['sum_k']*
				andrej_move.translate.forward(temp_val[0])
			);
			var B = [];
			B[0] = sum_sq[1];
			B[1] = temp_val[1];
			B[2] = sum_sq2[1];
			B[3] = andrej_move.translate.backward(
				andrej_move.translate.forward(sum_sq[1]) +
				sign[1]*(output[i].estimate_split[0]+output[i].estimate_split[1])/sum_sq['sum_k']*
				andrej_move.translate.forward(temp_val[1])
			);
			// готово, всё собрали, создаём и добавляем объект Andrej_node_move в массив
			this.moves[i] = new Test_moves_move(
				output[i].x, // координаты
				output[i].y,
				A,
				B
			);
			l2.restore_lines( uv );
		}
	} else { // если ar.win === true
		this.reliability = 1;
		this.estimate = ( (ar.winner==0) ? [1,0] : [0,1] );
	}
}

Test_moves.prototype = {
	toString	: function() { return this.moves.join("\n"); },
	toHTML		: function() { return this.moves.join("<br />"); }
}

function Test_moves_move( x, y, A, B ) {
	this.x = x;
	this.y = y;
	this.estimate = [
		{ prev: A[0], val: A[1], next: A[2], next_est: A[3] },
		{ prev: B[0], val: B[1], next: B[2], next_est: B[3] }
	];
}

function Test_moves_move_prototype() {
	this.toString = function() {
		return '( '+this.x+', '+this.y+' )'+"\t"+'[ '+this.estimate[0].prev+' -> +'+this.estimate[0].val+' -> '+this.estimate[0].next+' ( '+this.estimate[0].next_est+' ) ]'+"\t"+'[ '+this.estimate[1].prev+' -> +'+this.estimate[1].val+' -> '+this.estimate[1].next+' ( '+this.estimate[1].next_est+' ) ]';
	}
}

Test_moves_move.prototype = new Test_moves_move_prototype;