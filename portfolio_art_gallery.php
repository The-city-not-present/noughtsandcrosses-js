<?php

// we need to know post slug
global $post;


// ok, looking for files
$result = array();
$dir_address = dirname($_SERVER['SCRIPT_FILENAME']) . '/portfolio_data/'.$post->post_name;
$dir_thumb_address = $dir_address . '/thumbs';
$src_base = '/portfolio_data/'.$post->post_name;
$src_thumb_base = $src_base . '/thumbs';

$dir_handle = opendir( $dir_address );
if( !$dir_handle ) {	echo("<p>не удалось найти каталог `$dir_address`</p>");	return;	}
$result = array();
while( $entry = readdir($dir_handle) ) {
	if( is_file( $dir_address . '/' . $entry ) && ('thumb.jpg'!=$entry) )
		array_push( $result, $entry );
}
closedir( $dir_handle );


// ok, created
sort( $result );
$count = sizeof($result);
$echoed = array_fill( 0, $count, false );

// begin outputting
//   O U T P U T
// now we printing the result


// w will set $content variable up now
global $more;
$more = 1;
$content = get_the_content('it sucks!');
$content = apply_filters('the_content', $content);

// replace {{img0}} with actual image tags
$matches = null;
while( preg_match( '@^([\\s\\S]*)({[\\s\\S]*})([\\s\\S]*)$@', $content, $matches ) ) {
	$r = mb_substr( $matches[2], 1, mb_strlen($matches[2])-2 );
	$img = array_search( $r, $result );
	if( false !== $img ) {
		$echoed[$img] = true;
		$img = $result[$img];
		$img = $src_base . '/' . $img;
		$dom_el = '<img style="display: block; margin: 10px 0 10px; padding: 0; font-size: 0; width: 800px; " src="'.$img.'" />'."\n";
	} else {
		$dom_el = "Файла `$r` не найдено\n";
	}
	$content = $matches[1] . $dom_el . $matches[3];	
}

for( $i=0; $i<$count; $i++ )
	if( !$echoed[$i] ) {
		$img = $src_base . '/' . $result[$i];
		$dom_el = '<img style="display: block; margin: 10px 0 10px; padding: 0; font-size: 0; width: 800px; " src="'.$img.'" />'."\n";
		$content .= $dom_el;
	}

echo $content . "\n";
?>

<br clear="all" />

