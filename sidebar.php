<?php
if( preg_match( '@(?:^|/)ai_analysis_sidebar\\.php$@', $_SERVER['PHP_SELF'] ) )
	return;

function read_file_ai_options() {
	// 1. прочитать файл
	$file_data = "";
	$dir_address = dirname($_SERVER['SCRIPT_FILENAME']);
	$fd = fopen( $dir_address . '/ai_options.php', 'r' );
	if( !$fd )
		return array();
	while( !feof($fd) )
		$file_data .= fgets( $fd );
	fclose( $fd );
	
	// 2. найти определения функций
	$matches = null;
	preg_match_all('@\\bfunction\\s+(ai_[^}]+)}@si', $file_data, $matches, PREG_PATTERN_ORDER);
	// результаты будут по образцу  [0] => 'function ai_3s()	{ andrej_move({width:[15,[5,[2,[2,[1,null]]]]]}'
	//                              [1] => 'ai_3s()	{ andrej_move({width:[15,[5,[2,[2,[1,null]]]]]'
	$matches = $matches[1];
	for( $i=0; $i<count($matches) ; $i++ ) {
		$m1 = null;
		// найти глубины : все в квадратных скобках или null
		preg_match('@(?:\\[.*\\])|(?:null)@si', $matches[$i], $m1);
		$m2 = null;
		// найти имя функции : с начала и до скобки или пробела
		preg_match('@^[^(\\s]*@si', $matches[$i], $m2);
		$matches[$i] = array( "depth" => $m1[0], "func_name" => $m2[0] );
		echo("<!-- sidebar : function found : ".$m2[0]." -->\n");
	}
	
	// 3. найдем в наборе и подставим
	$result = array();
	global $ai_options;
	for( $i=0; $i<count($ai_options); $i++ ) {
		echo("<!-- sidebar : option found : ".$ai_options[$i]['short_name']." : ");
		$found = -1;
		for($j=0;$j<count($matches);$j++)
			if( $ai_options[$i]['function'] == $matches[$j]['func_name'] )
				$found = $j;
		if( $found >= 0 ) {
			array_push( $result, array('title'=>$ai_options[$i]['short_name'],'func_name'=>$matches[$found]['func_name'],'depth'=>$matches[$found]['depth']) );
		}
		echo( "".( ($found >= 0) ? $found." (".$matches[$found]['func_name'].") -->\n" : "<none> -->\n" ) );
	}

	return $result;
}

function ai_sidebar_recursive_variants_str() {
	global $ai_options;
	$str = '<ul class="flat">';
	$str2 = '';
	try {
		$str_array = read_file_ai_options();
	}catch(Exception $e){};
	for( $i=0; $i<count($str_array); $i++ )
		$str2 .= '<li><a href="javascript: vivid_recursive(\''.$str_array[$i]['func_name'].'\',\''.$str_array[$i]['depth'].'\')">' . $str_array[$i]['title'] . '</a><br /><span style="font-size: 80%; color: #666;">' . $str_array[$i]['depth'] . '</span></li>';
	$str .= $str2 . '</ul>';
	return $str;
}
?>

<script type="text/javascript">
	function ai_analysis_sidebar_manipulate() {
		if( $('#ai_analysis_sidebar_manipulate').text() == '>>' ) {
			$('#ai_analysis_sidebar').animate( {opacity:'0'}, 'slow' ).hide(0);
			$('#ai_analysis_sidebar_manipulate').text( '<<' )
		} else {
			$('#ai_analysis_sidebar').animate( {opacity:'1'}, 'slow' ).show();
			$('#ai_analysis_sidebar_manipulate').text( '>>' )
		}
	}

	function ai_gameviewer_sidebar_manipulate() {
		if( $('#ai_gameviewer_sidebar').css('display') == 'none' ) {
			$('#ai_gameviewer_sidebar').animate( {opacity:'1'}, 'slow' ).show();
		} else {
			$('#ai_gameviewer_sidebar').animate( {opacity:'0'}, 'slow' ).hide(0);
		}
	}

	// TODO: перенести в gameviewer
	var ai_gameviewer_loadedgame;
	function ai_gameviewer_loadgame()	{  ai_gameviewer_loadedgame = new Game_viewer( JSON.parse($('#ai_gameviewer_input').val()) ); }
	function ai_gameviewer_activate()	{
		if( ( game.started ) && ( game.moves.length == 0 ) )
			game.finish();
		ai_gameviewer_loadedgame.activate();
	}
	function ai_gameviewer_deactivate()	{  ai_gameviewer_loadedgame.deactivate(); }
	function ai_gameviewer_prev()		{  ai_gameviewer_loadedgame.prev(); }
	function ai_gameviewer_next()		{  ai_gameviewer_loadedgame.next(); }
	function ai_gameviewer_pretofirst()	{
		while( game.moves.length>0 )
			if( !ai_gameviewer_loadedgame.prev() )
				break;
	}
	function ai_gameviewer_nexttolast()	{
		while( game.moves.length<ai_gameviewer_loadedgame.moves.length )
			if( !ai_gameviewer_loadedgame.next() )
				break;
	}
</script>

<!--  AI ANALYSIS SIDEBAR  -->
<div id="ai_analysis_sidebar_wrapper" style="position: relative; float: right; height: 500px; z-index: 1; width: 200px; ">
        <a href="javascript: ai_analysis_sidebar_manipulate()" style="background: #fff; float: right; font-size: 18px; margin: -3px 22px 0 0; padding: 0 4px; position: relative; z-index: 5;" id="ai_analysis_sidebar_manipulate">&gt;&gt;</a>
<div id="ai_analysis_sidebar" style="background: #fff;">


<div class="div1">
<div class="div1-heading-wrapper"><span class="div1-heading">комментарии оценки</span></div>
<p><a href="javascript: commentary_on_estimates()">показывать</a></p>
<span style="font-size: 9px; color: #a37022; ">наведите курсор над полем, чтобы увидеть комментарии</span>
</div><!-- </div1> -->

<div class="div1">
<div class="div1-heading-wrapper"><span class="div1-heading">статич. оценки графически</span></div>
<p>показывать <a href="javascript: vivid( { method: 'both' } )">обоих игроков</a>, <a href="javascript: vivid( { method: 'only', me: 0 } )">крестиков</a>, <a href="javascript: vivid( { method: 'only', me: 1 } )">ноликов</a></p>
<p><a href="javascript: vivid( 'stop' )">скрыть</a>
</div><!-- </div1> -->

<div class="div1">
<div class="div1-heading-wrapper"><span class="div1-heading">оценки функций графически</span></div>
<div style="height:310px;overflow:auto;">
<div style="padding-bottom: 10px;">
<div style="float: right; ">( <a href="javascript: vivid_recursive( 'stop' )">скрыть</a> )</div>оценка: <span style="overflow: hidden;" id="bench_recursive_estimate"></span></div>
<?php echo(ai_sidebar_recursive_variants_str()); ?>
</div>
</div><!-- </div1> -->
</div><!-- </ai_analysis_sidebar> -->
</div><!-- </ai_analysis_sidebar_wrapper> -->


<!--  LOAD GAMES SIDEBAR  -->
<div id="ai_gameviewer_sidebar_wrapper" style="position: relative; float: right; height: 50px; z-index: 1; width: 200px; ">
       <div class="button" style="margin: 10px 0 0 10px; " onclick="ai_gameviewer_sidebar_manipulate()">просмотр игры:</div>
       <!-- <a href="javascript: ai_gameviewer_sidebar_manipulate()" style="background: #fff; float: right; font-size: 18px; margin: -3px 22px 0 0; padding: 0 4px; position: relative; z-index: 5;" id="ai_gameviewer_sidebar_manipulate">&gt;&gt;</a> -->
<div id="ai_gameviewer_sidebar" style="background: #fff; display: none; ">

<div class="div1">
<div class="div1-heading-wrapper"><span class="div1-heading">загруженные игры</span></div>
	<p>загрузить новую:
	<input type="text" value="" id="ai_gameviewer_input" style=" border: 1px solid #777; width: 160px">
	<a href="javascript: ai_gameviewer_loadgame()">загрузить</a>
	</p>
	<p><a href="javascript: ai_gameviewer_activate()">активировать</a> &nbsp;&nbsp;<a href="javascript: ai_gameviewer_deactivate()">отключить</a></p>
	<p>текущая игра:<br />
	<a href="javascript: ai_gameviewer_prevtofirst()">&lt&lt;</a> &nbsp;<a href="javascript: ai_gameviewer_prev()">&lt;</a> &nbsp;&nbsp;<a href="javascript: ai_gameviewer_next()">&gt;</a> &nbsp;<a href="javascript: ai_gameviewer_nexttolast()">&gt;&gt;</a></p>
</div><!-- </div1> -->

</div><!-- </ai_gameviewer_sidebar> -->
</div><!-- </ai_gameviewer_sidebar_wrapper> -->


