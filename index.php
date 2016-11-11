<?php

define("script_ver","1.0.2.2");

require( "includes/header.php" );
head(
	'игра в «крестики-нолики» на свободном поле',
	array( 'public/css/style.css' ),
	array(
		'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
		'public/scripts/lines.js',
		'public/scripts/gameplay.js',
		//'public/scripts/gameviewer.js',
		'public/scripts/ai_engine.js',
		'public/scripts/ai_utils.js',
		'public/scripts/ai_nodes.js',
		'public/scripts/ai_estimates.js',
		'public/scripts/ai_ui.js',
		'public/scripts/ai_0_0_6.js',
		'public/scripts/ai_0_0_3.js',
		'public/scripts/ai_0_0_4.js',
		'public/scripts/bench.js',
		'public/scripts/ai_bench_position_utils.js'/*,
		'public/scripts/gamematch.js',
		'public/scripts/gamematch2.js'*/
	)
);	?>

<div class="link-back" style="left: 400px;">
	<ul style="margin: 0; padding: 0; "><li style="margin: 0 10px 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="talk.php">обсуждение</a></li><li style="margin: 0 10px 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="changelog.php">история версий</a></li><li style="margin: 0 10px 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="picturesque_work.php">картинки</a></li><li style="margin: 0 10px 0; padding: 0; list-style-type: none; display: inline; position: relative; "><a href="../noughtsandcrosses_cs/">česky</a></li>
	</ul>
</div>


<script>
	window['data_inited'] = false;
	var game; // объявление в этой области видимости
	// извините за разный стиль, я знаю, что обе строчки вверху - одинаковые глобальные переменные
	// просто мне так нравится исходя из моей логики - в одном случае просто переменная, а в другом свойство window
	// ну нравится мне, не запрещено же
	onhumanmove = new Event_callback_list();
	onhumanmove.delay = 0;
	onhumanmovemade = new Event_callback_list();

	Game.default_first_move = function() { return { x: $('#field').width()/32|0, y: 12 } }


	// TODO: правило форы для крестиков
	// TODO: отображение статуса, чей ход и как долго думает компьютер
	// TODO: сравнить с прошлой формулой оценки, вернуть эту формулу в архив
	// TODO: посчитать итоговое число побед (счет)
	function game_log( msg ) {
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
		$('#game_log').append('<p><span style="font-weight: bold; display: inline-block; width: 100px; ">'+datestr+'</span>'+msg+'</p>');
		setTimeout(
			function() {
				if( typeof( $('#msg_box').get(0) ) != 'object' )
					$('#field').append( '<div id="msg_box" style="position: absolute; width: 480px; background: #fff; z-index: 15; left: 50%; top: 100px; margin-left: -240px; color: #777; font-family: Helvetica; font-size: 24px; padding: 16px; text-align: center; display: none; "></div>' );
				$('#msg_box').text( msg );
				$('#msg_box').css( 'opacity', '1' );
				$('#msg_box').css( 'display', 'block' );
				$('#msg_box').animate( { opacity: 0 }, 'slow' );
				setTimeout( function() { $('#msg_box').css( 'display', 'none' ); }, 800 );
			},
			0
		);
	};

	Game.onwin.push(
		function( winner ) {
			var resignation = ( game.hasOwnProperty('win_by_resignation') && game.win_by_resignation );
			var draw = ( game.hasOwnProperty('win_but_draw') && game.win_but_draw );
			var no_reason = ( ( !resignation && !draw ) && ( (winner!=0) && (winner!=1) ) );
			var winner_name = [ 'крестики', 'нолики' ];
			var text_case = [ 'ходов', 'ход', 'хода', 'хода', 'хода', 'ходов', 'ходов', 'ходов', 'ходов', 'ходов' ];
			var text_case_index = game.moves.length%10;
			if( (game.moves.length>=10) && (game.moves.length<=20) )
				text_case_index = 0;
			// нарисуем линию
			if( typeof($("#winline_canvas").get(0)) == 'object' )
				$("#winline_canvas").remove();
			if( !resignation && !draw && !no_reason ) {
				var x1, y1, x2, y2, left, top, width, height;
				x1 = game.windata[0].x;
				y1 = game.windata[0].y;
				x2 = game.windata[1].x;
				y2 = game.windata[1].y;
				if( x1<x2 ) { left = x1; width = x2-x1+1; } else { left = x2; width = -x2+x1+1; };
				x1 = x1-left; x2 = x2-left;
				if( y1<y2 ) { top = y1; height = y2-y1+1; } else { top = y2; height = -y2+y1+1; };
				y1 = y1-top; y2 = y2-top;
				if( x1==x2 ) { x1=x1+.5; x2=x2+.5; } else if( x1<x2 ) { x2++ } else { x1++ };
				if( y1==y2 ) { y1=y1+.5; y2=y2+.5; } else if( y1<y2 ) { y2++ } else { y1++ };
				$("#field").append('<canvas id="winline_canvas" style="position: absolute; left: '+(left*16)+'px; top: '+(top*16)+'px; "></canvas>');
				$("#winline_canvas").attr( "width", width*16 );
				$("#winline_canvas").attr( "height", height*16 );
				var ctx = $("#winline_canvas").get(0).getContext("2d");
				ctx.beginPath();
				//ctx.scale( 1, 1 );
				//ctx.lineWidth = 2;
				ctx.moveTo( x1*16, y1*16 );
				ctx.lineTo( x2*16, y2*16 );
				ctx.stroke();
			}
			// покажем сообщение
			game_log( ( !no_reason ? ( !draw ? 'победили ' + winner_name[winner] + (resignation?' (противник сдался)':'') : 'ничья' ) : 'игра прекращена без указания причины' ) + '  ('+game.moves.length+' полу'+text_case[text_case_index]+')' );
		}
	);
	Game.onmovemade.push(
		function( x, y, moves_count ) {
			window['data_human_move']=false;
			window['l'] = game.l;
			$("#field").unbind('mousedown');
			onhumanmovemade.fire_events();
			// найдём class_name (css классы)
			var class_name;
			if( 0==(moves_count&1) )
				class_name = 'img-move img-move-x img-move-active';
			else
				class_name = 'img-move img-move-o img-move-active';
			if( moves_count==0 )
				class_name += ' img-move-first';
			$('.img-move').removeClass('img-move-active');
			$("#field").append('<div id="img_move_n_'+moves_count+'" class="'+class_name+'" style="left: '+x*16+'px; top: '+y*16+'px; "></div>');
		}
	);
	Game.onstart.push(
		function() {
			$("#field").empty();
		}
	)

	$(function() {
		setTimeout(
			function() {
				window['data_inited'] = true;
				start_game();
				game.verbose = 2;
			}
		)
		$('.button').mousedown(
			function() {
				$(this).addClass('button-pressed');
			}
		);
		$(window).mouseup(
			function() {
				$('.button-pressed').removeClass('button-pressed');
			}
		);
		$('.button-select').click(
			function(e) {
				if( (e.target.className=='button-select') || (e.target.className=='select-heading') ) {
					$(this).find('.button-select-node').show();
					$('body').append('<div id="button_select_node_back" style="position: absolute; left: 0px; top: 0px; width: 100%; height: 100%; z-index: 2; " onclick="$(this).remove(),$(\'.button-select-node\').hide()"></div>');
				}
			}
		)
 	});
 	function human() {
		window['data_human_move']=true;
		$("#field").unbind('mousedown');
		$("#field").mousedown(
			function( e ) {
				// если не клик левой кнопкой
				if( e.which != 1 )
					return;
				// сначала найдём координаты
				pos = $(this).position();
				x = e.pageX - pos.left;
				y = e.pageY - pos.top;
				x = x / 16 | 0;
				y = y / 16 | 0;
				// теперь сделаем ход
				if( !game.move( x, y ) )
					game_log('недопустимый ход!');
			}
		);
		onhumanmove.fire_events();
		return 'you are welcome!';
 	}
 	human.ai_status = 'human';
 	human.title = 'human';
 	
	function start_game() {
		var checked = $('#button_square_rule').is(':checked');
		cb1 = window['data_player_0'].property;
		if( typeof(cb1) == 'string' )	cb1 = window[cb1];
		cb2 = window['data_player_1'].property;
		if( typeof(cb2) == 'string' )	cb2 = window[cb2];
		if( ( typeof(cb1) != 'function' ) || ( typeof(cb2) != 'function' ) ) {
			game_log('неправильно заданы параметры игроков');
			return;
		}
		if( typeof(andrej_move)!='undefined' )
			andrej_move.rule_square = checked;
		if( typeof(andrej_move_0_0_6)!='undefined' )
			andrej_move_0_0_6.rule_square = checked;
		if( typeof(andrej_move_0_0_5)!='undefined' )
			andrej_move_0_0_5.rule_square = checked;
		if( typeof(andrej_move_0_0_4)!='undefined' )
			andrej_move_0_0_4.rule_square = checked;
		if( typeof(andrej_move_0_0_3)!='undefined' )
			andrej_move_0_0_3.rule_square = checked;
		if( ( typeof(game)=='undefined' ) || game.can_be_restarted() ) {
			if( game instanceof Game )
				game.destroy();
			game = new Game( cb1, cb2 );
			window['l'] = game.l;
		} else {
			game_log('игра уже идёт. Остановите игру, чтобы начать новую');
			return;
		};
		game.rules.square = checked;
		game_log('началась игра!');
	};
	function finish_game() {
		if( !window['data_human_move'] ) {
			game_log('противник думает, прекратить игру можно только при своём ходе');
			return false;
		}
		if( !game.finish() ) {
			game_log('нельзя прервать игру');
			return false;
		};
		$("#field").unbind('mousedown');
		window['data_human_move']=false;
		onhumanmovemade.fire_events();
		game_log('игра прервана');
		return true;
	};
	function stop_game() {
		game.players = [ new Player(human), new Player(human) ];
	}
	function undo_move() {
		if( !game.started ) {
			game_log('нельзя отменить; игра уже закончилась или ещё не началась');
			return;
		}
		if( !window['data_human_move'] ) {
			game_log('противник думает, отменить ход можно только при своём ходе');
			return;
		}
		if( game.empty() ) {
			game_log('нельзя отменить; ни одного хода не сделано');
			return;
		}
		game.moves.splice(-1,1);
		game.l = new LL(game);
		window['l'] = game.l;
		// надо заново вызвать callback`и
		$('.img-move:last').remove();
		if( game.moves.length > 0 ) {
			$('.img-move:last').remove();
			// onmovemade - значит, ход сделан. Надо заново послать приглашение ходить
			Game.onmovemade.push_once( human );
			Game.onmovemade.fire_events( game.moves[game.moves.length-1].x, game.moves[game.moves.length-1].y, game.moves.length-1 );
			game.onmovemade.fire_events( game.moves[game.moves.length-1].x, game.moves[game.moves.length-1].y, game.moves.length-1 );
		} else
			human();
		game_log('ход отменён; теперь ходит человек');
	}
	

</script>


<?php	require( 'ai_options.php' );
	require( 'site_notice.php' ); ?>

<div id="manipulate" style="margin-top: -10px; font-size: 85%; ">
	<div class="button" onclick="start_game()">начать игру</div>
	<div class="button" onclick="finish_game()">закончить игру</div>
	<span style="display: inline-block; padding-left: 35px; ">За крестики играет </span>
	<div id="select_player_0" class="button-select"><span class="select-heading">человек ▼</span>
<?php print_button_select_node( 'player_0' ) ?>
	</div>
	<span style="display: inline-block; ">, за нолики </span>
	<div id="select_player_1" class="button-select"><span class="select-heading">andrej ??? ▼</span>
<?php print_button_select_node( 'player_1' ) ?>
	</div>
	<span style="padding-right: 20px; ">.</span>
	<div class="button" onclick="undo_move()">отменить ход</div>
	<span style="margin-right: 20px; "></span>
	<label id="button_square_rule_label" style="padding: 2px 10px; display: inline-block;" title="второй ход крестики должны сделать вне квадрата 5х5, считая, что первый ход сделан в центр этого квадрата"><input id="button_square_rule" type="checkbox" checked="checked"> правило квадрата для крестиков</label>
</div>

<?php require( 'sidebar.php' ) ?>

<div id="ai_interface_wrapper" style="position: relative; float: left; z-index: 1; "><div id="ai_interface"></div></div>


<div id="field" class="show-first-move"></div>

<div id="game_log" style="background: #ddd; margin: 10px 0 0; padding: 10px; "></div>



<?php
require( "includes/footer.php" );

?>
