// -----------------------------------------------------------------------------------
// http://wowslider.com/
// JavaScript Wow Slider is a free software that helps you easily generate delicious 
// slideshows with gorgeous transition effects, in a few clicks without writing a single line of code.
// Last updated: 2011-09-27
//
//***********************************************
// Obfuscated by Javascript Obfuscator
// http://javascript-source.com
//***********************************************
function ws_fade(options,images){var $=jQuery;images.each(function(Index){if(!Index){$(this).show();}else{$(this).hide();}});this.go=function(new_index,curIdx){$(images.get(new_index)).fadeIn(options.duration);$(images.get(curIdx)).fadeOut(options.duration);return new_index;};}// -----------------------------------------------------------------------------------
// http://wowslider.com/
// JavaScript Wow Slider is a free software that helps you easily generate delicious 
// slideshows with gorgeous transition effects, in a few clicks without writing a single line of code.
// Last updated: 2011-09-27
//
//***********************************************
// Obfuscated by Javascript Obfuscator
// http://javascript-source.com
//***********************************************
jQuery("#wowslider-container1").wowSlider({effect:"fade",prev:"",next:"",duration:10*100,delay:50*100,outWidth:664,outHeight:400,width:664,height:400,autoPlay:true,stopOnHover:false,loop:false,bullets:0,caption:true,controls:false});

