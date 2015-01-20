<?php 

	/*

	Plugin Name: Fonts

	Plugin URI: http://wpsites.net/plugins/fonts/

	Description: Add More Font Styles & Sizes To Your Visual Editor in WordPress

	Version: 1.0

	Author: Brad Dalton - wpsites

	Author URI: http://wpsites.net/

	License: GPL2

	*/

//Add Font Sytles & Sizes

function add_more_buttons($buttons) {

$buttons[] = 'fontselect';

$buttons[] = 'fontsizeselect';

return $buttons;

}

add_filter("mce_buttons_3", "add_more_buttons");



add_action('wp_dashboard_setup', 'fonts_dashboard_widgets');



function fonts_dashboard_widgets() {

   global $wp_meta_boxes;



   wp_add_dashboard_widget('wpsitesfontswidget', 'Latest Solutions for WordPress', 'fonts_widget');

}

		function fonts_limit( $text, $limit, $finish = ' [&hellip;]') {

			if( strlen( $text ) > $limit ) {

		    	$text = substr( $text, 0, $limit );

				$text = substr( $text, 0, - ( strlen( strrchr( $text,' ') ) ) );

				$text .= $finish;

			}

			return $text;

		}



		function fonts_widget() {

			$options = get_option('wpsitesfontswidget');

			require_once(ABSPATH.WPINC.'/rss.php');

			if ( $rss = fetch_rss( 'http://wpsites.net/feed/' ) ) { ?>

				<div class="feed-widget">

                

				<a href="http://wpsites.net/" title="WP Sites - Solutions for WordPress"><img src="http://wpsites.net/wp-content/uploads/2013/06/wpsitesdotnet.png"  class="alignright" alt="WP Sites.net"/></a>			

				<ul>

                <?php 

				$rss->items = array_slice( $rss->items, 0, 5 );

				foreach ( (array) $rss->items as $item ) {

					echo '<li>';

					echo '<a class="feedwidget" href="'.clean_url( $item['link'], $protocolls=null, 'display' ).'">'. ($item['title']) .'</a> ';

										

					echo '</li>';

				}

				?> 

				</ul>

				<div style="border-top: 1px solid #ddd; padding-top: 10px; text-align:center;">

				<a href="http://feeds.feedburner.com/wpsitesdotnet"><img src="http://wpsites.net/wp-content/uploads/2013/06/feed.png" alt="Subscribe to our Blog" style="margin: 0 5px 0 0; vertical-align: top; line-height: 18px;"/> Subscribe with RSS</a>

				&nbsp; &nbsp; &nbsp;

				<a href="http://feedburner.google.com/fb/a/mailverify?uri=wpsitesdotnet"><img src="http://wpsites.net/wp-content/uploads/2013/06/email.gif" alt="Subscribe via Email"/> Subscribe by email</a>

                &nbsp; &nbsp; &nbsp;

                <a href="http://facebook.com/wpsites.net/"><img src="http://wpsites.net/wp-content/uploads/2013/06/facebook.png" alt="Join us on Facebook" style="margin: 0 5px 0 0; vertical-align: middle; line-height: 18px;" />Join us on Facebook</a>

				</div>

				</div>

			<?php }

		}







?>

