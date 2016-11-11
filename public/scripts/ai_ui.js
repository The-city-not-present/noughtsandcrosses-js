// чтобы вывести показания компьютера пользователю

//	этот файл немного сумбурный, но он "прикладного характера"


//	для этого здесь написаны два механизма
//	1. ai_interface.get_status_cb() вызывается по таймеру каждую секунду и служит для того, чтобы всегда отображать актуальный статус движка
//		не важно, что там произошло, искулючение, ошибка... просто всегда обновится в соответствии со значением переменной, "как по часам"
//		слово "всегда" значит "пока существует объект ai_interface" (пока не вызвано destroy() )
//	2. send_report - это вызывает движок, когда посчитает нужным; обычно тоже раз в секунду во время просчёта (во время простоя не обновляется)
//		для этого надо задать коллбэк (движок).send_report_cb, ему надо сунуть (Ai_interface).render_report с правильным контекстом


//	всякие конструкторы-деструкторы - см. низ этой страницы
//	что такое класс коллбэков событий (oncreate, onstart, ondestroy...) - см. файл gameplay.js, самый верх

const ai_interface_width = 600;
$( function(){ document.body.innerHTML +=
	'<style>'+"\n"+
		'#ai_interface_wrapper						{ position: relative; float: left; z-index: 1;'+
												'	  width: '+ai_interface_width+'px; }'+
		'.ai-interface								{ overflow: hidden; }'+

		'.ai-interface-table						{ display: block; margin: block; padding: block; }'+
		'.ai-interface-table td						{ padding: 4px 20px 2px 0; margin: 0; }'+
		'.ai-interface-table-small					{ font-size: 80%; }'+

		'.ai-interface-node-wrapper					{ position: absolute; background: #fff; z-index: 5;'+
													' width: '+ai_interface_width+'px; padding: 10px; border: 1px solid #ccc;  }'+
		'.ai-interface-node-container				{ overflow: hidden; }'+

		'.ai-interface-zeronode-container .ai-interface-output-nodeinfo .ai-interface-outputitem-probability'+
												'	{ display: none; }'+
		/*'.ai-interface-outputline-output .ai-interface-outputitem-reliability'+
												'	{ display: none; }'+*/

		'.ai-interface-output-move-secondary-moves	{ color: #888;}'+

		'.ai-interface-node-close, .ai-interface-node-refresh'+
												'	{ display: none; }'+
		'.ai-interface-node-wrapper .ai-interface-node-close, .ai-interface-node-wrapper .ai-interface-node-refresh'+
												'	{ display: inline-block; }'+
		'.ai-interface-node-close:hover, .ai-interface-node-refresh:hover'+
												'	{ font-weight: bold; text-decoration: initial; }'+
		'.ai-interface-node-close:hover				{ color: #f68; }'+
		'.ai-interface-node-refresh:hover			{ color: #8b8; }'+
	"\n"+'</style>'; } );

function ai_ui_node_close( id, node_id ) {
	$('#ai_interface_'+id+'_node_'+node_id+'_output_node_container').parent().remove();
}
function ai_ui_node_refresh( id, node_id ) {
	return ai_ui_node_show( id, node_id );
}
function ai_ui_node_show( id, node_id ) {
	window['ai_ui_'+id+'_show_node'](node_id);
}




function Ai_interface( opts ) {
	this.info = {
		title:					opts.title,
		version:				opts.version,
	};
	this.get_status_cb =		opts.get_status_cb;
	this.get_node_report_cb =	opts.get_node_report_cb;
	this.id = Ai_interface.next_id();
	this.message_analyze =		opts.message_analyze;
	this.message_stop =			opts.message_stop;
	this.message_clear_hash =	opts.message_clear_hash;
	this.message_refresh =		opts.message_refresh;
	this.message_unload =		opts.message_unload;
	this.message_multi_pv =		opts.message_multi_pv;
	var q = this;
	this.create_window_callbacks();
	setTimeout( function(){q.create_window_elements.call(q)}, 0 );
	this.update_status_interval_id = setInterval(function(){q.update_status.call(q)},1000);
	setTimeout(function(){q.update_status.call(q)},0);
}

Ai_interface.prototype = {

	destroy : function() {
		clearInterval( this.update_status_interval_id );
		$('#ai_interface_'+this.id).remove();
		// не совсем безопасненько кажется, но имхо ничего плохого случиться не может
		for( var i in window )
			if( new RegExp('^ai_ui_'+this.id+'_.*').test(i) ) {
				window[i] = function(){};
				// чёрт знает, как всё очистить, чтобы garbage collector точно сработал; останется где ссылка - не хочу хвостов
				delete window[i];
			}
	},

	create_window_callbacks : function() {
		var q = this;
		// книпки внизу панельки
		window['ai_ui_'+this.id+'_analyze'] =		function() { q.message_analyze(); };
		window['ai_ui_'+this.id+'_stop'] =			function() { q.message_stop(); };
		window['ai_ui_'+this.id+'_clear_hash'] =	function() { q.message_clear_hash(); q.message_refresh(); };
		window['ai_ui_'+this.id+'_refresh'] =		function() { q.message_refresh(); };
		window['ai_ui_'+this.id+'_unload'] =		function() { q.message_unload(); };
		// доп для меня, возможности
		window['ai_ui_'+this.id+'_set_multi_pv'] =	function(a) { q.message_multi_pv(a); };
		window['ai_ui_'+this.id+'_show_node'] =		function(a) { q.show_node(a); };
	},

	create_window_elements : function() {
		var div =
		'<div id="ai_interface_'+this.id+'" title="информация анализа движка, обновляется раз в секунду">'+
			'<span id="ai_interface_'+this.id+'_status" style="float: right; " title="статус - последнее состояние движка"></span>'+
			'движок, экземпляр № '+this.id+
			'<table class="ai-interface-table ai-interface-table-small" style="color: #666;">'+
				'<tr>'+
					'<td>'+this.info.title+'<span id="ai_interface_'+this.id+'_title" title="версия файла с хитрыми алгоритмами эволюции вариаций">'+' '+this.info.version+'</span></td>'+
				'</tr>'+
			'</table>'+

			this.create_node_elements()+

			'<ul style="display: block; margin: 0 0 25px 0; padding: 0; font-size: 80%; ">'+
				'<li class="ai-interface-button-analyze" title="запустить движок" style="margin: 0 10px 0 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="javascript: ai_ui_'+this.id+'_analyze()">анализ</a></li>'+
				'<li class="ai-interface-button-stop" title="попросить движок прекратить считать" style="margin: 0 10px 0 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="javascript: ai_ui_'+this.id+'_stop()">остановить</a></li>'+
				'<li class="ai-interface-button-clearhash" title="убрать все просчитанные вариации из хэша" style="margin: 0 10px 0 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="javascript: ai_ui_'+this.id+'_clear_hash()">очистить хэш</a></li>'+
				'<li class="ai-interface-button-sendreport" title="попросить движок заново послать информацию" style="margin: 0 10px 0 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="javascript: ai_ui_'+this.id+'_refresh()">обновить</a></li>'+
				'<li class="ai-interface-button-unload" title="выгрузить движок и убрать эту панельку" style="margin: 0 10px 0 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="javascript: ai_ui_'+this.id+'_unload()">выгрузить</a></li>'+
			'</ul>'+

		'</div>';
		$('#ai_interface').append( div );
		$('#ai_interface_'+this.id+'_output_info').hide();
	},

	create_node_elements : function( node_id ) {
		if( typeof(node_id)=='undefined' )
			node_id = 'zero';
		var str =
		'<div id="ai_interface_'+this.id+'_node_'+node_id+'_output_node_container" class="ai-interface-node-container'+(node_id=='zero'?' ai-interface-zeronode-container':'')+'">'+

			'<div id="ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo_wrapper">'+
				// блочек справа, где номер позиции, крестик и кнопка обновить
				// это по сути див, но сделан table style="display:block;" , чтобы иметь унифицированные отступы
				'<table class="ai-interface-table ai-interface-table-small" style="float: right; ">'+
					'<tr>'+
						'<td style="padding-right: 0; ">'+
							'<span id="ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo_idinfo"></span>'+
							'<a href="javascript: ai_ui_'+this.id+'_show_node('+node_id+')" id="ai_interface_'+this.id+'_node_'+node_id+'_output_refresh" class="ai-interface-node-refresh" title="обновить" style="margin-left: 10px; ">O</a>'+
							'<a href="javascript: ai_ui_node_close('+this.id+','+node_id+')" id="ai_interface_'+this.id+'_node_'+node_id+'_output_close" class="ai-interface-node-close" title="закрыть" style="margin-left: 10px; ">Х</a>'+
						'</td>'+
					'</tr>'+
				'</table>'+

				// панелька, где время, число итераций...
				'<table id="ai_interface_'+this.id+'_node_'+node_id+'_output_info" class="ai-interface-table ai-interface-table-small ai-interface-output-info"><tr></tr></table>'+

				// панелька, где оценка, число вариаций...
				'<table id="ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo" class="ai-interface-table ai-interface-table-small ai-interface-output-nodeinfo" title="информация анализа движка">'+
					'<tr></tr>'+
				'</table>'+
			'</div>'+

			// таблица для основного вывода движка
			'<table id="ai_interface_'+this.id+'_node_'+node_id+'_output" class="ai-interface-table">'+
				'<tr><td>(пусто)</td></tr>'+
			'</table>'+

		'</div>';
		return str;
	},

	render_report : function( areport, node_id ) {
		this.update_status();
		if( typeof(node_id)=='undefined' )
			node_id = 'zero';
		$('#ai_interface_'+this.id+'_node_'+node_id+'_output').empty();
		if( !(areport instanceof Andrej_report) ) {
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output').append('<tr><td colspan=6 style="white-space:nowrap">#error !Andrej_report</td></tr>');
			return ;
		}
		// ['info']
		if( typeof(areport['info'])!='undefined' ) {
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_info').show();
			var str = '';
			for( var j=0; j<areport['info'].length; j++ ) {
				var classname = 'ai-interface-outputitem-'+areport['info'][j].classname;
				str += '<td class="'+classname+'" title="'+areport['info'][j].classname+'" style="white-space:nowrap">'+areport['info'][j]+'</td>';
			}
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_info').empty();
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_info').append('<tr>'+str+'</tr>');
		} else {
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_info').hide();
		}
		// ['nodeinfo']
		if( typeof(areport['nodeinfo'])!='undefined' ) {
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo_wrapper').show();
			var str = '';
			for( var j=0; j<areport['nodeinfo'].length; j++ ) {
				var classname = 'ai-interface-outputitem-'+areport['nodeinfo'][j].classname;
				str += '<td class="'+classname+'" title="'+areport['nodeinfo'][j].classname+'" style="white-space:nowrap">'+areport['nodeinfo'][j]+'</td>';
			}
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo').empty();
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo').append('<tr>'+str+'</tr>');
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo_idinfo').text(areport['nodeinfo']['id']);
		} else {
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output_nodeinfo_wrapper').hide();
		}
		// common data
		for( var i=0; i<areport.length; i++ ) {
			var str = '';
			for( var j=0; j<areport[i].length; j++ ) {
				var fstr = areport[i][j];
				var classname = 'ai-interface-outputitem-'+areport[i][j].classname;
				if( /^message\s+(?:.*[^\w])*error(?:[^\w]|$)/.test( areport[i].message_type ) ) {
					str += '<td class="'+classname+'" title="'+areport[i][j].classname+'" colspan=6 style="white-space:nowrap"><span style="color: #f00;">ошибка: </span>' + fstr + '</td>';
					continue;
				};
				if( /^message(?:[^\w]|$)/.test( areport[i].message_type ) ) {
					str += '<td class="'+classname+'" title="'+areport[i][j].classname+'" colspan=6 style="white-space:nowrap">' + fstr + '</td>';
					continue;
				};
				if( areport[i][j].classname == 'movelist' ) {
					str += '<td class="'+classname+'" title="'+areport[i][j].classname+'" style="white-space:nowrap">' + this.movelist_to_str( areport[i][j] ) + '</td>';
					continue;
				};
				var m = fstr.match(/(.*\s+\/)(\s+.*)/);
				if( m )
					fstr = '<span style="display: inline-block; width: 28px; text-align: right; ">' + m[1] + '</span>' + m[2];
				str += '<td class="'+classname+'" title="'+areport[i][j].classname+'" style="white-space:nowrap">' + fstr + '</td>';
			}
			var classname = 'ai-interface-outputline-'+areport[i].message_type.split(/\s+/).join(' ai-interface-outputline-');
			$('#ai_interface_'+this.id+'_node_'+node_id+'_output').append('<tr class="'+classname+'">'+str+'</tr>');
		}
	},

	show_node : function( id ) {
		if( $('#ai_interface_'+this.id+'_node_'+id+'_output').length==0 ) {
			var basex = 100;
			var basey = 140;
			for( var i=this.max_id; i>=0; i-- )
			if( $('#ai_interface_'+this.id+'_custom_node_'+i).length!=0 ) {
					basex = Number($('#ai_interface_'+this.id+'_custom_node_'+i).css('left').replace(/[^\d]+/,''))+40;
					basey = Number($('#ai_interface_'+this.id+'_custom_node_'+i).css('top').replace(/[^\d]+/,''))+70;
					break;
				}
			var fx = basex;
			var fy = basey;
			var div = '<div id="ai_interface_'+this.id+'_custom_node_'+this.next_custom_node_id()+'" class="ai-interface-node-wrapper" style="left: '+fx+'px; top: '+fy+'px; ">'+this.create_node_elements(id)+'</div>';
			$('#ai_interface').append( div );
		}
		this.render_report( this.get_node_report_cb(id), id );
	},

	update_status : function() {
		var new_text = this.get_status_cb();
		var old_text = this.status_text;
		if( new_text!=old_text )
			$('#ai_interface_'+this.id+'_status').text( new_text );
		this.status_text = new_text;
	},
	// из массива ходов строку на HTML разметке
	movelist_to_str : function( arg ) {
		// вспомогательная функция
		var q = this;
		function gen_div_id( str, id, class_list ) {
			var class_name = '';
			for( var i=0; i<class_list.length; i++ )
				class_name += ' ai-interface-output-move-'+class_list[i];
			var onclick = function(id,node_id){return 'javascript: ai_ui_node_show('+id+','+node_id+')'};
			if( id === false )
				return '<div class="ai-interface-output-move'+class_name+'" style="display: inline;" title="статическая позиция">'+str+'</div>';
			return '<div id="ai_interface_'+q.id+'_output_move_'+id+'" class="ai-interface-output-move ai-interface-output-move-recursive'+class_name+'" onclick="'+onclick(q.id,id)+'" style="display: inline;" title="позиция #'+id+'">'+str+'</div>';
		}
		// координаты хода
		var move_str = gen_div_id( '( '+arg[0].x+', '+arg[0].y+' )', arg[0].id, ['first-move'] );
		// и последующие ходы
		var moves_next_str = '';
		for( var i=1; i<arg.length; i++ )
			moves_next_str += gen_div_id( ' ( '+arg[i].x+', '+arg[i].y+' )', arg[i].id, ['secondary-moves'] );
		return move_str + moves_next_str;
	},

	next_custom_node_id : function() {
		if( !this.hasOwnProperty('max_id') )
			this.max_id = -1;
		return ++this.max_id;
	}

}

Ai_interface.next_id = function() {
	if( !Ai_interface.hasOwnProperty('max_id') )
		Ai_interface.max_id = -1;
	return ++Ai_interface.max_id;
}







// а теперь связываем наш ИИ Andrej_player и интерфейс Ai_interface
var and;

Game.onstart.push(
	// добавляем деволтный ИИ, который будет думать во время хода человека
	function( arg ) {
		var human_start_id;
		var human_end_id;
		var human_start_interval_id = null; // сложная структура, чтобы запуск движка отменялся, если снова сделан ход
		var cb_start = function() {
			if( and.game.empty() ) // чтобы сразу не запускался когда загружена страница (можно и запускаться, но неудобно)
				return;
			var cbb = function() { // сложная структура, чтобы запуск движка отменялся, если снова сделан ход
				human_start_interval_id = null;
				and.engine.analyze({time:600000});
			}
			if( human_start_interval_id===null )
				human_start_interval_id = setTimeout( cbb, 400 );
		}
		var cb_end = function() {
			if( human_start_interval_id!==null )
				clearTimeout( human_start_interval_id );
			human_start_interval_id = null;
			and.engine.interrupt();
		}
		human_start_id = onhumanmove.push( cb_start );
		human_end_id = onhumanmovemade.push( cb_end );
		and = new Andrej_player( arg );
		arg.ondestroy.push(
			function() {
				and.destroy();
			}
		);
		and.ondestroy.push(
			function() {
				onhumanmove.clear_callback( human_start_id );
				onhumanmovemade.clear_callback( human_end_id );
			}
		);
		return;
	}
)

Andrej_engine.oncreate.push(
	function( aand ) {
		var cb_status = function() {
			return aand.status
		}
		var cb_node = function( arg, param_multi_pv ) {
			if( typeof(param_multi_pv)=='undefined' )
				param_multi_pv = aand.param_multi_pv;
			return new Andrej_report( aand.position_hash.node_by_id(arg), param_multi_pv );
		}
		var fai_interface = new Ai_interface(
			{
				title:				aand.title,
				version:			aand.version,
				get_status_cb:		cb_status,
				get_node_report_cb:	cb_node,
				message_analyze:	function() { aand.analyze(); },
				message_stop:		function() { aand.terminate_condition.force_stop = true; },
				message_clear_hash:	function() { aand.clear_hash(); },
				message_refresh:	function() { aand.send_report(); },
				message_unload:		function() { aand.destroy(); },
				message_multi_pv:	function(n){ aand.param_multi_pv = n; },
			}
		);
		aand.send_report_cb = function( arg ){ fai_interface.render_report.call(fai_interface,arg) };
		aand.ondestroy.push(
			function() {
				fai_interface.destroy();
			}
		)
	}
)



