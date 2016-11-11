<?php

date_default_timezone_set( 'UTC' );



function show_error ( $text ) {
	echo( '<span class="error">'.$text.'</span>' );
	include( "footer.php" );
};



function head( $title, $css, $js ) {
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="ru-RU">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title> <?php echo($title); ?> // скрипторий на сайте Андрея Путилова </title>
	<meta name="author" content="Андрей Путилов" />
	<link rel="icon" type="image/png" href="http://andreyputilov.ru/public/favicon.png" />
	<!-- additional page css -->
<?php foreach( $css as $text ) { ?>
	<link rel="stylesheet" type="text/css" href="<?php echo($text); ?>" />
<?php }; ?>
	<!-- additional page js -->
<?php foreach( $js as $text ) { ?>
	<script type="text/javascript" src="<?php echo($text); ?>"></script>
<?php }; ?>
</head>
<body>

	<h1><?php echo($title); ?></h1>
		<div class="link-back">
			<div>
<?php
				$link_back_text = 'к <a href="./" title="игра в «крестики-нолики» на свободном поле">игровому скрипту</a>';
				if( preg_match('@noughtsandcrosses/index\.php$@',$_SERVER['PHP_SELF']) )
					$link_back_text = 'к <a href="/" title="назад">скрипторию</a>';
?>
				&#x21b0; назад <?php echo($link_back_text); ?>
			</div>



<?php
			// test if this script has its version number
			if( defined("script_ver") ) {
?>
			<div>
				<p><?php echo 'версия '.script_ver; ?><sup> <a title="история версий" href="/noughtsandcrosses/changelog.php">(?)</a></sup></p>
			</div>
<?php
			};
?>
		</div>
<?php
}
?>
