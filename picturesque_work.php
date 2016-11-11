<?php

// 0. head 
require( "includes/header.php" );
head( 'иллюстрация процесса работы', array( 'public/css/style.css', '/public/highslide/highslide.css' ), array('/public/highslide/highslide.js', '/public/highslide/highslide.config.js') );

// 1. looking for files
$result = array();
$dir_address = dirname($_SERVER['SCRIPT_FILENAME']) . '/public/pictures';
$dir_thumb_address = $dir_address;
$src_base = 'public/pictures';
$src_thumb_base = $src_base . '/thumbs';

$dir_handle = opendir( $dir_address );
if( !$dir_handle ) {	echo("<p>не удалось найти каталог `$dir_address`</p>");	return;	}
$result = array();
while( $entry = readdir($dir_handle) ) {
	if( is_file( $dir_address . '/' . $entry ) )
		array_push( $result, $entry );
}
closedir( $dir_handle );

// now test if thumbnails are present
if( !is_dir( $dir_thumb_address ) )
	mkdir( $dir_thumb_address );
$dir_handle = opendir( $dir_thumb_address );
if( !$dir_handle ) {	echo("<p>не удалось найти каталог `$dir_address`</p>");	return;	}
$result_thumb = array();
while( $entry = readdir($dir_handle) ) {
	array_push( $result_thumb, $entry );
}
closedir( $dir_handle );
foreach( $result as $entry )
	if( !in_array( $entry, $result_thumb ) ) {
		echo "<div>$entry thumbnail is missing</div>\n";
	};
sort( $result );
$count = sizeof($result);

// 2. output gallery
?>

<script>
hs.onDimmerClick = function() {	hs.close(); }
hs.dimmingOpacity = 0.60;
hs.Expander.prototype.onImageClick = function( sender ) {	return hs.next(); }
</script>

<div class="highslide-gallery">
	<ul>

<?php
	foreach( $result as $photo ) {
		$src = $src_base . '/' . $photo;
		$thumb = $src_thumb_base . '/' . $photo;
		?>
	<li>
	<a href="<?php echo($src); ?>" class="highslide" 
			title="Нет заголовка"
			onclick="return hs.expand(this, config1 )">
		<img class="thumbnail" src="<?php echo($thumb); ?>"  alt=""
			title="Нет описания" />
	</a>
	</li>
		<?php
	};	

?>
	
	</ul>
</div>
<br clear="all" />

<?php

// 3. finish

require( "includes/footer.php" );

?>
