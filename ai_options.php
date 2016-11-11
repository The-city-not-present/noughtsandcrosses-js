<?php
?>
<script type="text/javascript">
	// пояснение: ai_ns будет думать ~n секунд
	function ai_0_1_0_static() { andrej_move(); }
	function ai_0_1_0_3s()	{ andrej_move(); }
	function ai_0_1_0_6s()	{ andrej_move(); }
	function ai_0_1_0_10s()	{ andrej_move(); }
	function ai_0_1_0_60s()	{ andrej_move(); }
	function ai_0_1_0_300s()	{ andrej_move(); }
	function ai_0_1_0_1200s()	{ andrej_move(); }

	function ai_0_0_6_static() { andrej_move_0_0_6({width:null}); }
	function ai_0_0_6_3s()	{ andrej_move_0_0_6({width:[10,[6,[3,[2,null]]]]}); }
	function ai_0_0_6_6s()	{ andrej_move_0_0_6({width:[15,[5,[3,[2,[1,null]]]]]}); }
	function ai_0_0_6_10s()	{ andrej_move_0_0_6({width:[15,[5,[3,[2,[1,[1,[1,null]]]]]]]}); }
	function ai_0_0_6_60s()	{ andrej_move_0_0_6({width:[15,[6,[4,[3,[2,[2,[1,null]]]]]]]}); }
	function ai_0_0_6_300s()	{ andrej_move_0_0_6({width:[15,[10,[10,[4,[2,[2,[1,null]]]]]]]}); }
	function ai_0_0_6_1200s()	{ andrej_move_0_0_6({width:[16,[10,[10,[5,[4,[2,[2,null]]]]]]]}); }

	function ai_0_0_5_static() { andrej_move_0_0_5({width:null}); }
	function ai_0_0_5_3s()	{ andrej_move_0_0_5({width:[10,[6,[3,[2,null]]]]}); }
	function ai_0_0_5_6s()	{ andrej_move_0_0_5({width:[15,[5,[3,[2,[1,null]]]]]}); }
	function ai_0_0_5_10s()	{ andrej_move_0_0_5({width:[15,[5,[3,[2,[1,[1,[1,null]]]]]]]}); }
	function ai_0_0_5_60s()	{ andrej_move_0_0_5({width:[15,[6,[4,[3,[2,[2,[1,null]]]]]]]}); }
	function ai_0_0_5_300s()	{ andrej_move_0_0_5({width:[15,[10,[10,[4,[2,[2,[1,null]]]]]]]}); }
	function ai_0_0_5_1200s()	{ andrej_move_0_0_5({width:[16,[10,[10,[5,[4,[2,[2,null]]]]]]]}); }

	function ai_0_0_4_static() { andrej_move_0_0_4({width:null}); }
	function ai_0_0_4_3s()	{ andrej_move_0_0_4({width:[10,[6,[3,[2,null]]]]}); }
	function ai_0_0_4_6s()	{ andrej_move_0_0_4({width:[15,[5,[3,[2,[1,null]]]]]}); }
	function ai_0_0_4_10s()	{ andrej_move_0_0_4({width:[15,[5,[3,[2,[1,[1,[1,null]]]]]]]}); }
	function ai_0_0_4_60s()	{ andrej_move_0_0_4({width:[15,[6,[4,[3,[2,[2,[1,null]]]]]]]}); }
	function ai_0_0_4_300s()	{ andrej_move_0_0_4({width:[15,[10,[10,[4,[2,[2,[1,null]]]]]]]}); }
	function ai_0_0_4_1200s()	{ andrej_move_0_0_4({width:[16,[10,[10,[5,[4,[2,[2,null]]]]]]]}); }

	function ai_0_0_3_static() { andrej_move_0_0_3({width:[0]}); }
	function ai_0_0_3_3s()	{ andrej_move_0_0_3({width:[10,6,3,2,0]}); }
	function ai_0_0_3_6s()	{ andrej_move_0_0_3({width:[15,5,3,2,1,0]}); }
	function ai_0_0_3_10s()	{ andrej_move_0_0_3({width:[15,5,3,2,1,1,1,0]}); }
	function ai_0_0_3_60s()	{ andrej_move_0_0_3({width:[15,6,4,3,2,2,1,0]}); }
	function ai_0_0_3_300s()	{ andrej_move_0_0_3({width:[15,10,10,4,2,2,1,0]}); }
	function ai_0_0_3_1200s()	{ andrej_move_0_0_3({width:[16,10,10,5,4,2,2,0]}); }
</script>
<?php

$ai_options_default = 3;
$ai_options = array(
	array(
		'id' => 'human',
		'short_name' => 'человек',
		'full_name' => 'человек',
		'function' => 'human'
	),
//	сначала старая версия 0.0.4.10, с выверенными коэффициентами
	array(
		'id' => 'andrej_move_0_0_4/null',
		'short_name' => 'andrej 0.0.4.10, статич.',
		'full_name' => 'andrej (экстремум) : по статической оценке',
		'function' => 'ai_0_0_4_static'
	),
	array(
		'id' => 'andrej_move_0_0_4/[10,[6,[3,[2,null]]]]',
		'short_name' => 'andrej 0.0.4.10, ~3 сек',
		'full_name' => 'andrej (экстремум) : ~3 сек/ход',
		'function' => 'ai_0_0_4_3s'
	),
	array(
		'id' => 'andrej_move_0_0_4/[15,[5,[3,[2,[1,null]]]]]',
		'short_name' => 'andrej 0.0.4.10, ~6 сек',
		'full_name' => 'andrej (экстремум) : ~6 сек/ход',
		'function' => 'ai_0_0_4_6s'
	),
	array(
		'id' => 'andrej_move_0_0_4/10s',
		'short_name' => 'andrej 0.0.4.10, ~10 сек',
		'full_name' => 'andrej (экстремум) : ~10 сек/ход',
		'function' => 'ai_0_0_4_10s'
	),
	array(
		'id' => 'andrej_move_0_0_4/60s',
		'short_name' => 'andrej 0.0.4.10, ~1 мин',
		'full_name' => 'andrej (экстремум) : ~1 мин/ход',
		'function' => 'ai_0_0_4_60s'
	),
	array(
		'id' => 'andrej_move_0_0_4/300s',
		'short_name' => 'andrej 0.0.4.10, ~5 мин',
		'full_name' => 'andrej (экстремум) : ~5 мин/ход',
		'function' => 'ai_0_0_4_300s'
	),
	array(
		'id' => 'andrej_move_0_0_4/1200s',
		'short_name' => 'andrej 0.0.4.10, ~20 мин',
		'full_name' => 'andrej (экстремум) : ~20 мин/ход',
		'function' => 'ai_0_0_4_1200s'
	),
//	теперь новая версия 0.0.6
	array(
		'id' => 'andrej_move_0_0_6/null',
		'short_name' => 'andrej 0.0.6, статич.',
		'full_name' => 'andrej (новый) : по статической оценке',
		'function' => 'ai_0_0_6_static'
	),
	array(
		'id' => 'andrej_move_0_0_6/[10,[6,[3,[2,null]]]]',
		'short_name' => 'andrej 0.0.6, ~3 сек',
		'full_name' => 'andrej (новый) : ~3 сек/ход',
		'function' => 'ai_0_0_6_3s'
	),
	array(
		'id' => 'andrej_move_0_0_6/[15,[5,[3,[2,[1,null]]]]]',
		'short_name' => 'andrej 0.0.6, ~6 сек',
		'full_name' => 'andrej (новый) : ~6 сек/ход',
		'function' => 'ai_0_0_6_6s'
	),
	array(
		'id' => 'andrej_move_0_0_6/10s',
		'short_name' => 'andrej 0.0.6, ~10 сек',
		'full_name' => 'andrej (новый) : ~10 сек/ход',
		'function' => 'ai_0_0_6_10s'
	),
	array(
		'id' => 'andrej_move_0_0_6/60s',
		'short_name' => 'andrej 0.0.6, ~1 мин',
		'full_name' => 'andrej (новый) : ~1 мин/ход',
		'function' => 'ai_0_0_6_60s'
	),
	array(
		'id' => 'andrej_move_0_0_6/300s',
		'short_name' => 'andrej 0.0.6, ~5 мин',
		'full_name' => 'andrej (новый) : ~5 мин/ход',
		'function' => 'ai_0_0_6_300s'
	),
	array(
		'id' => 'andrej_move_0_0_6/1200s',
		'short_name' => 'andrej 0.0.6, ~20 мин',
		'full_name' => 'andrej (новый) : ~20 мин/ход',
		'function' => 'ai_0_0_6_1200s'
	),
//	теперь арктангенс - старая версия, именуемая 0.0.3
	array(
		'id' => 'andrej_move_0_0_3/null',
		'short_name' => 'andrej 0.0.3, статич.',
		'full_name' => 'andrej (арктангенс) : по статической оценке',
		'function' => 'ai_0_0_3_static'
	),
	array(
		'id' => 'andrej_move_0_0_3/6s',
		'short_name' => 'andrej 0.0.3 : ~6 сек',
		'full_name' => 'andrej (арктангенс) : ~6 сек/ход',
		'function' => 'ai_0_0_3_6s'
	),
	array(
		'id' => 'andrej_move_0_0_3/10s',
		'short_name' => 'andrej 0.0.3 : ~10 сек',
		'full_name' => 'andrej (арктангенс) : ~10 сек/ход',
		'function' => 'ai_0_0_3_10s'
	),
	array(
		'id' => 'andrej_move_0_0_3/60s',
		'short_name' => 'andrej 0.0.3 : ~1 мин',
		'full_name' => 'andrej (арктангенс) : ~1 мин/ход',
		'function' => 'ai_0_0_3_60s'
	),
	array(
		'id' => 'andrej_move_0_0_3/300s',
		'short_name' => 'andrej 0.0.3 : ~5 мин',
		'full_name' => 'andrej (арктангенс) : ~5 мин/ход',
		'function' => 'ai_0_0_3_300s'
	),
	array(
		'id' => 'andrej_move_0_0_3/1200s',
		'short_name' => 'andrej 0.0.3 : ~20 мин',
		'full_name' => 'andrej (арктангенс) : ~20 мин/ход',
		'function' => 'ai_0_0_3_1200s'
	)
);


function print_button_select_node( $player_id ) {
	global $ai_options;
?>
		<div class="button-select-node">
<?php
	foreach( $ai_options as $key ) :
?>
			<div class="button-select-option" onclick="set_button_select('<?php echo($player_id); ?>','<?php echo($key['id']); ?>','<?php echo($key['short_name']); ?>',<?php echo($key['function']); ?>)"><?php echo($key['full_name']); ?></div>
<?php
	endforeach;
?>
		</div>
	
<?php
}
?>

<script>
	window['data_inited'] = false;

	function set_button_select( select_id, option_id, human_readable, property ) {
		if( !window.hasOwnProperty('data_'+select_id) )
			window['data_'+select_id] = {};
		window['data_'+select_id].active = option_id;
		window['data_'+select_id].property = property;
		$('#select_'+select_id).find('.select-heading').text(human_readable+' ▼');
		$('#select_'+select_id).find('.button-select-node').hide();
		$('#button_select_node_back').remove();
		if( window['data_inited'] )
			if( ( ( typeof(game) == 'undefined' ) || game.empty() ) && ( window['data_player_0'].active == 'human' ) )
				start_game();
	}

	$(
		function() {
			set_button_select('player_0','human','человек','human');
			set_button_select('player_1','<?php echo($ai_options[$ai_options_default]['id']); ?>','<?php echo($ai_options[$ai_options_default]['short_name']); ?>','<?php echo($ai_options[$ai_options_default]['function']); ?>');
	 	}
	 );
</script>

<?
?>

