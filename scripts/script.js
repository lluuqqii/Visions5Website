// JavaScript Document
$(document).ready(function() {
    $('.aboutButton').click(function() {
		$('.menu').slideUp('slow');
        $('.about').slideToggle('slow');
    });
});

$(document).ready(function() {
    $('.menuButton').click(function() {
		$('.about').slideUp('slow');
        $('.menu').slideToggle('slow');
    });
});

$(document).ready(function() {
    $("#accordion").accordion({collapsible: true, active: false});
});