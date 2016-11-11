<?php

require( "includes/header.php" );
head( 'обсуждение', array( 'public/css/style.css' ), array('//vk.com/js/api/openapi.js?105') );
?>

<!-- Put this script tag to the <head> of your page -->
<script type="text/javascript" src="//vk.com/js/api/openapi.js?113"></script>

<script type="text/javascript">
  VK.init({apiId: 3068821, onlyWidgets: true});
</script>

<!-- Put this div tag to the place, where the Comments block will be -->
<div id="vk_comments"></div>
<script type="text/javascript">
VK.Widgets.Comments("vk_comments", {limit: 10, width: "960", attach: "*"});
</script>


<?php
require( "includes/footer.php" );

?>
