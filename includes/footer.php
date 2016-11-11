<?php

?>

<p class="credits">
создание и разработка <a href="http://andreyputilov.ru/">Андрей Путилов</a>
<?php
if( defined("script_ver") ) {
?>
<br />
последнее изменение скрипта <?php echo( date ("j M Y H:i:s", filemtime($_SERVER['SCRIPT_FILENAME'])) ) ?> UTC
<?php
}
?>
</p>

<?php require( '../includes/counter.php' ); ?>

</body>

</html>
