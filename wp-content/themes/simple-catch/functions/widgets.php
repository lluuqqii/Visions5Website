<?php
/**
 * Register sidebars and widget areas.
 */
function simplecatch_widgets_init() {
	
	register_widget( 'CustomTagWidget' );
	register_widget( 'simplecatch_social_widget' );
	
	register_sidebar( array( 
		'name'          => __( 'sidebar', 'simplecatch' ),
		'id'            => 'sidebar',
		'description'   => __( 'sidebar', 'simplecatch' ),
		'before_widget' => '<div class="widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3>',
		'after_title'   => '</h3><hr/>' 
	) ); 
	
 }
add_action( 'widgets_init', 'simplecatch_widgets_init' );


/** 
 * Extends class wp_widget
 * 
 * Creates a function CustomTagWidget
 * $widget_ops option array passed to wp_register_sidebar_widget().
 * $control_ops option array passed to wp_register_widget_control().
 * $name, Name for this widget which appear on widget bar.
 */
class CustomTagWidget extends WP_Widget {
		
	/**
	 * Constructor
	 *
	 * @return void
	 **/
	function CustomTagWidget() {
		$widget_ops = array( 'classname' => 'simplecatch_tag_widget', 'description' => __( 'Displays Custom Tag Cloud designed for Simple Catch Theme.', 'simplecatch' ) );
		$this->WP_Widget( 'simplecatch_tag_widget', __( 'Simple Catch Tag Clouds', 'simplecatch' ), $widget_ops );
		$this->alt_option_name = 'simplecatch_tag_widget';
	}		
		
	/**
	 * Displays the Widget in the front-end.
	 * 
	 * $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * $instance The settings for the particular instance of the widget
	 */
	function widget( $args, $instance ) {
		extract( $args );
		extract( $instance );
		
		$title = !empty( $instance['title'] ) ? $instance[ 'title' ] : 'Tags';
			
		echo $before_widget;
	
		if ( $title ):
			echo $before_title . $title . $after_title;
		endif;
		
		if ( function_exists( 'simplecatch_custom_tag_cloud' ) ):
			simplecatch_custom_tag_cloud();
		endif;
		
		echo $after_widget;
	}
		
	/**
	 * update the particular instant  
	 * 
	 * This function should check that $new_instance is set correctly.
	 * The newly calculated value of $instance should be returned.
	 * If "false" is returned, the instance won't be saved/updated.
	 *
	 * $new_instance New settings for this instance as input by the user via form()
	 * $old_instance Old settings for this instance
	 * Settings to save or bool false to cancel saving
	 */
	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;
		$instance['title'] = strip_tags($new_instance['title']);
		
		return $instance;
	}	
		
	/**
	 * Creates the form for the widget in the back-end which includes the Title , adcode, image, alt
	 * $instance Current settings
	 */
	function form($instance) {
		$instance = wp_parse_args( ( array ) $instance, array( 'title'=>'Tags' ) );
		$title = esc_attr( $instance[ 'title' ] );
		
		/**
		 * Constructs title attributes  for use in form() field
		 * @return string Name attribute for $field_name
		 */
		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . 'Title:' . '</label><input class="widefat" id="' . 
		$this->get_field_id( 'title' ) . '" name="' .       $this->get_field_name( 'title' ) . '" type="text" value="' . $title . '" /> </p>';
				
	}
}// end CustomTagWidget class


/** 
 * Extends class wp_widget
 * 
 * Creates a function simplecatch_social_widget
 * $widget_ops option array passed to wp_register_sidebar_widget().
 * $control_ops option array passed to wp_register_widget_control().
 * $name, Name for this widget which appear on widget bar.
 */
class simplecatch_social_widget extends WP_Widget {

	/**
	 * Constructor
	 *
	 * @return void
	 **/
	function simplecatch_social_widget() {
		$widget_ops = array( 'classname' => 'simplecatch_social_widget', 'description' => __( 'Displays Social Icons added from Theme Options Panel.', 'simplecatch' ) );
		$this->WP_Widget( 'simplecatch_social_widget', __( 'Simple Catch Social Icons', 'simplecatch' ), $widget_ops );
		$this->alt_option_name = 'simplecatch_social_widget';
	}	
	
	/**
	 * Displays the Widget in the front-end.
	 * 
	 * $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * $instance The settings for the particular instance of the widget
	 */
	function widget( $args, $instance ) {
		extract( $args );
		extract( $instance );
		
		$title = !empty( $instance['title'] ) ? $instance[ 'title' ] : '';
	
		echo $before_widget;
		
		if ( $title != '' ) {
			echo $before_title . apply_filters( 'widget_title', $title, $instance, $this->id_base ) . $after_title;
		} 
		
		if ( function_exists( 'simplecatch_headersocialnetworks' ) ):
			simplecatch_headersocialnetworks();
		endif;
		
		echo $after_widget;
	}
	
	/**
	 * update the particular instant  
	 * 
	 * This function should check that $new_instance is set correctly.
	 * The newly calculated value of $instance should be returned.
	 * If "false" is returned, the instance won't be saved/updated.
	 *
	 * $new_instance New settings for this instance as input by the user via form()
	 * $old_instance Old settings for this instance
	 * Settings to save or bool false to cancel saving
	 */
	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;
		$instance['title'] = strip_tags($new_instance['title']);
		
		return $instance;
	}	
		
	/**
	 * Creates the form for the widget in the back-end which includes the Title , adcode, image, alt
	 * $instance Current settings
	 */
	function form($instance) {
		$instance = wp_parse_args( ( array ) $instance, array( 'title'=>'' ) );
		$title = esc_attr( $instance[ 'title' ] );
		
		/**
		 * Constructs title attributes  for use in form() field
		 * @return string Name attribute for $field_name
		 */
		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . 'Title:' . '</label><input class="widefat" id="' . 
		$this->get_field_id( 'title' ) . '" name="' .       $this->get_field_name( 'title' ) . '" type="text" value="' . $title . '" /> </p>';
				
	}
}// end simplecatch_social_widget class
?>