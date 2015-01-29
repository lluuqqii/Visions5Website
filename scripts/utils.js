
window.DottoroWP = window.DottoroWP || {}; 

(function () {
	var cssEx = null;
	var enableAspectRatio = true;

	DottoroWP.KeepAspectRatio = function (enable) {
		enableAspectRatio = enable;
	}

	Dottoro.ContentReady (initCssEx, 9);	// init phase
	Dottoro.Ready (buildCssEx);
	Dottoro.AddListener('resize', update, window);

	function initCssEx () {
		if (Dottoro.CssEx && !cssEx) {
			cssEx = Dottoro.CssEx.Create (document.body);
		}
	}

	function buildCssEx () {
		if (cssEx) {
			cssEx.Build ({}, true, enableAspectRatio);
			cssEx.Update ();
		}
	}

	function update () {
		if (cssEx) {
			cssEx.Update ();
		}
	}
}) ();


(function () {
	var loadedStyles = null;
	var loadedScripts = null;
	var handlers = [];
	DottoroWP.AjaxScriptsReady = function (handler) {
		handlers.push (handler);
	}

	DottoroWP.LoadAjaxScripts = function (scripts, styles) {
		if (!scripts) {
			return;
		}
			// pre load scripts and styles
		for (var i = 0; i < handlers.length; i++) {
			Dottoro.CallUserFunc (handlers[i], scripts, styles, 'before');
		}

		if (!loadedStyles) {
			loadedStyles = {};
			for (var i=0; i < document.styleSheets.length; i++) {
				if (document.styleSheets[i].href) {
					loadedStyles[document.styleSheets[i].href] = 1;
				}
			}
		}
		if (!loadedScripts) {
			loadedScripts = {};
			var docScripts = ('scripts' in document) ? document.scripts : document.getElementsByTagName("script");
			for (var i=0; i < docScripts.length; i++) {
				if (docScripts[i].src) {
					loadedScripts[docScripts[i].src] = 1;
				}
			}
		}

		for (var id in styles) {
			if (styles[id] && !(styles[id] in loadedStyles)) {
				Dottoro.LoadStyle (styles[id]);
				loadedStyles[styles[id]] = 1;
			}
		}

		for (var id in scripts) {
				// do not load wp mediaelement, becuase it iterates through the whole document
			if (id == 'wp-mediaelement') {
				continue;
			}
			if (scripts[id] && !(scripts[id] in loadedScripts)) {
				Dottoro.LoadScript (scripts[id]);
				loadedScripts[scripts[id]] = 1;

					// init media element  tags
				if (id == 'mediaelement' && window.mejs) {
					mejs.plugins.silverlight[0].types.push('video/x-ms-wmv');
					mejs.plugins.silverlight[0].types.push('audio/x-ms-wma');
				}
			}
		}

			// post load scripts and styles
		for (var i = 0; i < handlers.length; i++) {
			Dottoro.CallUserFunc (handlers[i], scripts, styles, 'after');
		}
	}

}) ();

DottoroWP.ContactForms = {};
DottoroWP.SendContactForm = function (id) {
	if (!(id in DottoroWP.ContactForms)) {
		DottoroWP.ContactForms[id] = new DottoroWP.ContactForm (id);
	}
	DottoroWP.ContactForms[id].RemoveTooltips ();
	DottoroWP.ContactForms[id].Send ();
	return false;
}

DottoroWP.ContactForm = Dottoro.Class.extend({
// private methods:
	init : function (form_id) {
		this.form_id = form_id;
		this.form = document.getElementById (this.form_id);
		this.preloaderWrapper = document.getElementById (this.form_id + '_preloader');
		this.preloader = null;
		this.tooltips = {};
		this.onsend = false;
	},

	Send : function  ( ) {
		if (!this.form || this.onsend ) {
			return false;
		}
		var form_datas = Dottoro.FormToAssocArray (this.form, "name");
		form_datas.dottoro_action = 'contact_form';
		form_datas['form_html_id'] = this.form_id;

		var params = {callback: [this, "OnResponse"], callbackOnError: [this, "OnSendError"], async:true};
		var ajaxUrl = window.location.href;
		if (window.location.search) {
			ajaxUrl += '&dottoro_ajax=1';
		} else {
			ajaxUrl += '?dottoro_ajax=1';
		}

		if (this.preloaderWrapper) {
			this.preloader = new DottoroWP.Preloader ();
			this.preloader.Show (this.preloaderWrapper);
		}

		this.onsend = true;
		Dottoro.Ajax.PostRequest (ajaxUrl, form_datas, params);
		return false;
	},

	OnResponse : function ( response ) {
		// empty form
		if ('thank_you_msg' in response && response['thank_you_msg'] != '') {
			this.form.reset ();
			var tipElem = Dottoro.CreateElement ('span', null, {innerHTML:response['thank_you_msg']});
			var ownerelem = document.getElementById (this.form_id + '_message');
			if (ownerelem) {
				try {
					var tooltip = new Dottoro.Tooltip ();
					var settings = {direction:'up', ownerelem:ownerelem, tooltipelem:tipElem}
					tooltip.SetSettings (settings);
					tooltip.Activate ();
					tooltip.Show ();
					setTimeout (function () {tooltip.Deactivate ()},3000);
				} catch (e) {}
			}
		}
		if (this.preloader) {
			this.preloader.Remove ();
			delete this.preloader;
		}
		this.onsend = false;
		return false;
	},

	OnSendError : function ( response ) {
		if ('error' in response) {
			for (var i in response['error']) {
				var ownerelem = document.getElementById (this.form_id + '_' + i);
				var direction = 'right';
				if (!ownerelem) {
					ownerelem = document.getElementById (this.form_id + '_errors');
					direction = 'up';
				}
				if (ownerelem) {
					var tipElem = Dottoro.CreateElement ('span', null, {innerHTML:response['error'][i]});
					try {
						var tooltip = new Dottoro.Tooltip ();
						this.tooltips[i] = tooltip;
						var settings = {direction:direction, hideonmouseout:false, ownerelem:ownerelem, tooltipelem:tipElem, offsethorizontal:4, hideontipmouseout:false}

						tooltip.SetSettings (settings);
						tooltip.Activate ();
						tooltip.Show ();
					} catch (e) {}
				}
			}
		}
		if (this.preloader) {
			this.preloader.Remove ();
			delete this.preloader;
		}
		this.onsend = false;
		return false;
	},

	RemoveTooltips : function ( ) {
		for (var i in this.tooltips) {
			this.tooltips[i].Deactivate ();
			delete (this.tooltips[i]);
		}
	}
});

DottoroWP.gGoogleMapsScriptElem = null;
DottoroWP.gGoogleMapsLoaded = false;
DottoroWP.gGoogleMaps = [];

DottoroWP.GoogleMapsInit = function () {
	if (!DottoroWP.gGoogleMapsScriptElem) {
		var heads = document.getElementsByTagName ("head");
		if (heads[0]) {
			var scriptElem = Dottoro.CreateElement ('script', heads[0], {src:'http://maps.google.com/maps/api/js?sensor=false&callback=DottoroWP.GoogleMapsCreate'});
			DottoroWP.gGoogleMapsScriptElem = scriptElem;
		}
	}
};

DottoroWP.GoogleMapsCreate = function () {
	DottoroWP.gGoogleMapsLoaded = true;
	for (var i = 0; i < DottoroWP.gGoogleMaps.length; i++) {
		if (DottoroWP.gGoogleMaps[i] && DottoroWP.gGoogleMaps[i].CreateMap) {
			DottoroWP.gGoogleMaps[i].CreateMap ();
		}
	}
};

(function () {
	Dottoro.ContentReady (connectMaps, 20);	// connect phase

	var maps = [];
	DottoroWP.CreateGoogleMaps = function (params) {
		maps.push (new DottoroWP.GoogleMaps (params));
	};
	DottoroWP.GetGoogleMaps = function () {
		return maps;
	};

	function connectMaps (holder) {
		for (var i = 0; i < maps.length; i++) {
			maps[i].Connect ();
		}
		maps = [];
	}
}) ();

DottoroWP.GoogleMaps = Dottoro.Class.extend({
// private methods:
	init : function (params, json) {
		this.geo = null;
		this.map = null;
		this.infowindow = null;
		this.markers = [];
		this.sectionListeners = [];
		if (json) {
			this.params = Dottoro.JSONDecode (params);
		} else {
			this.params = params;
		}
		if (this.params) {
			if (DottoroWP.gGoogleMapsLoaded) {
				this.CreateMap ();
			} else {
				DottoroWP.GoogleMapsInit ();
				DottoroWP.gGoogleMaps.push (this);
			}
		}
	},

	onSectionShow : function () {
		if (this.map) {
			google.maps.event.trigger (this.map, 'resize');
			if (this.markers.length > 0) {
				this.map.setCenter (this.markers[0].getPosition());
			}
		}
	},

	Connect : function () {
		var wrapper = document.getElementById (this.params.id);
		if (wrapper) {
			var section = Dottoro.GetHolderObject (wrapper.parentNode, Dottoro.Section);
			if (section && section.AddListener) {
				this.sectionListeners.push (section.AddListener ('beforeshow', [this, "onSectionShow"]));
			}
		}
	},

	CreateMap : function  () {
		if (!('id' in this.params)) {
			return;
		}
		var wrapper = document.getElementById (this.params.id);
		if (!wrapper) {
			return;
		}

		var styles = ('styles' in this.params) ? this.params.styles : '';
		styles = Dottoro.JSONDecode (styles, true);
		if (!styles) {
			styles = [];
		}

		var latlng = new google.maps.LatLng(this.params.latitude, this.params.longitude)
		var options = {
			zoom: parseInt(this.params.zoom),
			center: latlng,
			mapTypeId: google.maps.MapTypeId[this.params.type],
			styles: styles
		};

		var control = '';
		for (var i=0; i < this.params.controls.length; i++) {
			var control = this.params.controls[i];
			options[control[0]] = control[1];
			switch (control[0]) {
				case 'mapTypeControl' :
					options.mapTypeControlOptions = {style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR}
					break;
				case 'zoomControl' :
					options.zoomControlOptions = {style: google.maps.ZoomControlStyle.SMALL}
					break;
			}
		}

		this.map = new google.maps.Map(wrapper, options);
		var _this = this;
		google.maps.event.addListener(this.map, 'tilesloaded', function() {_this.onTilesLoaded ()});

		if (this.params.address) {
			this.geo = new google.maps.Geocoder();
			var _this = this;
			this.geo.geocode({address:this.params.address}, function (results, status) {_this.geoCallback (results, status);});
		} else {
			this.addMarker ();
		}
	},

	geoCallback : function (results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			this.map.setCenter(results[0].geometry.location);
			this.addMarker ();
		}
	},

	onTilesLoaded : function () {
		if (this.params.showinfooninit && this.infowindow) {
			this.infowindow.open(this.map, this.markers[0]);
		}
	},

	addMarker : function () {
		if (this.params.marker) {
			var marker = new google.maps.Marker({
				position: this.map.getCenter(),
				map: this.map,
				title: ''
			});

			if ('info' in this.params && this.params.info) {
				var contentString = '<div class="infoWindow">'+ this.params.info +'</div>';
				var iw = new google.maps.InfoWindow({
					content: contentString
				});
				this.infowindow = iw;

				google.maps.event.addListener(marker, 'click', function() {iw.open(this.map,marker);});
			}
			this.markers.push (marker);
		}
	}
});

DottoroWP.GrayImage = Dottoro.ClassEventsSettings.extend({
	init : function () {
		this._super ();
		this.initSettings ();

		this.image = null;
		this.useCanvas = false;
		this.colorImage = null;
		this.eventHandlers = [];
		this.timerID = null;

		this.origSrc = '';

		this.onloadHandler = [];
		this.imgPixels = null;
		this.grayPixels = [];
		this.outPixels = null;
		this.width = 0;
		this.height = 0;
		this.outCanvas = null;
	},

	initSettings : function () {
		this.settings['ownerelem'] = null;
		this.settings['startopac'] = 0.5;
		this.settings['endopac'] = 1;
	},

	initImage : function () {
		var img = this.image;
		if (!img.complete) {
			if (this.onloadHandler.length == 0) {
				this.onloadHandler.push (Dottoro.AddListener("load", [this, "initImage"], img));
				this.onloadHandler.push (Dottoro.AddListener("readystatechange", [this, "initImage"], img));
			}
			return;
		}

		if (this.onloadHandler.length > 0) {
			for (var i=0; i < this.onloadHandler.length; i++) {
				Dottoro.RemoveListener(this.onloadHandler[i]);
			}
		}

		this.origSrc = img.src;
		if (img) {
				// get natural width
			if ('naturalWidth' in img) {
				this.width = img.naturalWidth;
				this.height = img.naturalHeight;
			}
			else {
				var tmpImg = new Image();
				tmpImg.src = img.src;
				this.width = tmpImg.width;
				this.height = tmpImg.height;
			}
			var elem = (this.settings['ownerelem'])? this.settings['ownerelem'] : img;
			this.eventHandlers.push (Dottoro.AddListener("mouseenter", [this, "onMouseEnter"], elem));
			this.eventHandlers.push (Dottoro.AddListener("mouseleave", [this, "onMouseLeave"], elem));
			this.createGrayImage (img.src);
			this.onShowHide (0);
		}
	},

	createGrayImage : function (src){
		var canvas = document.createElement('canvas');
		if (canvas.getContext) {
			this.useCanvas = true;
			var ctx = canvas.getContext('2d');
			var imgObj = new Image();
			imgObj.src = src;
			imgObj.width = canvas.width = this.width;
			imgObj.height = canvas.height = this.height;
					// cross-origin policy
			try {
				ctx.drawImage(imgObj, 0, 0);
				this.imgPixels = ctx.getImageData(0, 0, this.width, this.height);
			} catch (e) {
				this.useCanvas = false;
				return false;
			}

			this.outPixels = ctx.createImageData(this.width, this.height);
			var opd = this.outPixels.data;

			var len = this.width * this.height;
			for (var i = 0; i < len; i++) {
				var idx = 4 * i;
				var gray = this.imgPixels.data[idx] * 0.3 + this.imgPixels.data[idx + 1] * 0.59 + this.imgPixels.data[idx + 2] * 0.11;
				this.grayPixels[i] = gray;
				opd[idx + 3] = this.imgPixels.data[idx + 3];
			}
		}
	},

	getImage : function (t) {
		var len = this.width * this.height;
		var data = this.outPixels.data;
		var ipd = this.imgPixels.data;

		for (var i = 0; i < len; i++) {
			var idx = 4 * i;
			var gray = this.grayPixels[i];

			gray = (1-t) * gray;
			data[idx] = ((gray + t * ipd[idx]) >> 0);
			data[idx + 1] = ((gray + t * ipd[idx+1]) >> 0);
			data[idx + 2] = ((gray + t * ipd[idx+2]) >> 0);
		}

		if (!this.outCanvas) {
			this.outCanvas = document.createElement('canvas');
			this.outCanvas.width = this.width;
			this.outCanvas.height = this.height;
		}
		var ctx = this.outCanvas.getContext('2d');

		ctx.putImageData(this.outPixels, 0, 0);

		return this.outCanvas.toDataURL();
	},

	onMouseEnter : function () {
		this.ShowHide(true);
	},

	onMouseLeave : function () {
		this.ShowHide(false);
	},

	SetImage : function (img) {
		this.image = img;
	},

	ShowHide : function (show) {
		if (this.timerID) {
			var back = Dottoro.Timer.IsBack (this.timerID);
			if ((show && back) || (!show && !back)) {
				Dottoro.Timer.TurnBack (this.timerID);
			}
		} else {
			this.timerID = Dottoro.Timer.Add ([this, 'onShowHide'], {duration: 300, back:!show});
			Dottoro.SetFilter (this.image.parentNode, 'gray', false);
		}
	},

	onShowHide : function (t) {
		if (t < 0) {
			this.timerID = null;
			return;
		}
		var opac = t * this.settings['endopac'] + (1 - t) * this.settings['startopac'];
		Dottoro.SetOpacity (this.image, opac);

		if (this.useCanvas) {
			this.image.src = this.getImage (t);
		} else {
			if (t == 0) {
				Dottoro.SetFilter (this.image.parentNode, 'gray', true);
			}
		}
	}
});


(function () {
	Dottoro.RegisterTagParser ('grayimage', parseTag);

	function parseTag (tag) {
		var grayImage = new DottoroWP.GrayImage ();
		var settings = tag.getAttribute ("data-dottoro_params");
		grayImage.ReadSettings (settings);
		var owner = grayImage.GetSetting ("ownerelem");
		if (!owner) {
			owner = tag;
			grayImage.SetSetting ("ownerelem", owner);
		}
		var images = owner.getElementsByTagName ("img");
		for (var j=0; j < images.length; j++) {
			grayImage.SetImage (images[j]);
			break;
		}
		grayImage.initImage ();
	}
}) ();


DottoroWP.WinScroll = Dottoro.ClassEventsSettings.extend({
	init : function (elem) {
		this._super ();

		this.elem = elem;
		this.eventHandlers = [];
		if (this.elem) {
			this.eventHandlers.push (Dottoro.AddListener("scroll", [this, "onScroll"], window));
			this.eventHandlers.push (Dottoro.AddListener("scroll", [this, "onScroll"], document.body));
			this.maxOpac = Dottoro.GetStyle (this.elem, 'opacity');
		}

		this.anim = null;
	},

	onScroll : function () {
		var back = (parseInt(Dottoro.GetDocScrollTop()) <= 0);
		if (this.anim) {
			if (this.anim.IsRunning () || back) {
				this.anim.Start ({back:back});
			}
		}
		else {
			if (!back) {
				var items = [{elem:this.elem, props:{opacity:{from:0, to: this.maxOpac}}}];
				this.anim = new Dottoro.Anim (items, 300, {callback: [this, 'onShowAnim']});
				this.elem.style.display = 'block';
			}
		}
	},

	onShowAnim : function (anim, timerId, t)
	{
		if (t < 0) {	// when timer is being cleared
			if (Dottoro.Timer.IsBack (timerId)) {
				this.elem.style.display = 'none';
				this.anim = null;
			}
		}
	}
});

DottoroWP.AjaxPagination = Dottoro.ClassEventsSettings.extend({
// private methods:
	init : function () {
		this._super ();
		this.initSettings ();
		this.eventHandlers = [];
		this.scrollHandlers = [];
		this.changedIE8Elems = [];
		this.no_more_entry_text = '';
	},

	initSettings : function () {
		this.settings['wrapper'] = null;
		this.settings['base_id'] = '';
		this.settings['ajax_pagination'] = true;
		this.settings['paging_animation'] = 'none';
		this.settings['pagination_type'] = 'number';
		this.settings['paging_duration'] = 0;
		this.settings['load_more_above_bottom'] = 300;
		this.settings['next_page_url'] = '';
		this.settings['post_type'] = '';
		this.settings['extra_items'] = [];
	},

	build : function () {
		if (!this.settings['wrapper']) {
			return;
		}
		this.InitEffect ();
		if (this.settings['ajax_pagination']) {
			this.initComponent ('filters', [this, 'onFilter']);
			this.initComponent ('pagination', [this, 'onPagination']);
			if (this.settings['pagination_type'] == 'scroll') {
				this.addScrollHandler ();
			}

			Dottoro.History.AddListener ('popstate', [this, "onPopState"]);
		}
	},

	addScrollHandler : function () {
		if (this.scrollHandlers.length == 0) {
			this.scrollHandlers.push (Dottoro.AddListener('scroll', [this, 'onScroll'], window));
			this.scrollHandlers.push (Dottoro.AddListener('scroll', [this, 'onScroll'], document.body));
		}
	},

	removeScrollHandler : function () {
		if (this.scrollHandlers.length > 0) {
			Dottoro.RemoveListener(this.scrollHandlers);
			this.scrollHandlers = [];
		}
	},

	getComponent : function (suffix) {
		return document.getElementById (this.settings['base_id'] + '_' + suffix);
	},

	initComponent : function (suffix, handler) {
		var elem = this.getComponent (suffix);
		if (elem && handler) {
			var buttons = elem.getElementsByTagName ("a");
			for (var i in buttons) {
				if (buttons[i].getAttribute && buttons[i].getAttribute('href')) {
					this.eventHandlers.push (Dottoro.AddListener('click', handler, buttons[i]));
				}
			}
		}
	},

	updateComponent : function (suffix, handler, newContent) {
		var elem = this.getComponent (suffix);
		if (elem) {
			elem.innerHTML = newContent;
		}
		this.initComponent (suffix, handler);
	},

	clearComponent : function (suffix) {
		var elem = this.getComponent (suffix);
		if (elem) {
			elem.innerHTML = '';
		}
	},

	checkScrollPos : function () {
		var box = Dottoro.GetBox (this.settings['wrapper']);
		if (box.bottom - this.settings['load_more_above_bottom'] < Dottoro.GetClientWinHeight ()) {
			if (this.settings['next_page_url']) {
				this.GetContent (this.settings['next_page_url'], {suffix: 'pagination'});
			} else {
				this.updateComponent ('pagination', null, this.no_more_entry_text);
			}
		}
	},

	onPopState : function (type, event) {
		Dottoro.CancelEvent (event);
		var state = event.state;
		var args = {removeOld: true};
		if (this.settings['pagination_type'] == 'more_button_scroll') {
			args.listenScroll = false;
		}
		this.GetContent (location.href, args);
		return false;
	},

	onPagination : function (event, elem) {
		Dottoro.CancelEvent (event);
		var href = elem.getAttribute ('href');
		var args = {suffix: 'pagination'};
		if (this.settings['pagination_type'] == 'text' || this.settings['pagination_type'] == 'number') {
			args.pushState = true;
			args.removeOld = true;
		}
		if (this.settings['pagination_type'] == 'more_button_scroll') {
			args.listenScroll = true;
		}
		this.GetContent (href, args);
		return false;
	},

	onScroll : function (event, elem) {
		this.checkScrollPos ();
	},

	onFilter : function (event, elem) {
		Dottoro.CancelEvent (event);
		var href = elem.getAttribute ('href');
		var args = {pushState: true, removeOld: true, suffix: 'filters'};
		if (this.settings['pagination_type'] == 'more_button_scroll') {
			args.listenScroll = false;
		}
		this.GetContent (href, args);
		return false;
	},

	GetContent : function (href, callbackArgs, msg) {
		if (this.waitResponse || this.duringAnim) {
			return false;
		}

		if (!callbackArgs) {
			callbackArgs = {};
		}
		if (!msg) {
			msg = {};
		}
		for (var i in this.settings) {
			if (!(i in msg) && i != 'wrapper' && i != 'base_id' && i != 'extra_items') {
				msg[i] = this.settings[i];
			}
		}

		var datas = {dottoro_ajax:1,dottoro_action:'post_list', settings:msg};

		callbackArgs.requestUrl = href;
		this.waitResponse = true;
		if (callbackArgs.suffix) {
			this.showPreloader (callbackArgs.suffix);
		}
		var _this = this;
		var params = {callback: function (response){_this.OnResponse(response, callbackArgs)}, callbackOnError: [this, "OnSendError"], async:true};
		Dottoro.Ajax.PostRequest (href, datas, params);
		return false;
	},

	OnResponse : function (response, args) {
		this.waitResponse = false;
		var newContent = '';
		if ('contents' in response) {
			newContent = response.contents.content;
		}

		if (!newContent) {
			this.removePreloader ();
			return;
		}

		this.settings['next_page_url'] = '';
		if ('next_page_url' in response.contents) {
			this.settings['next_page_url'] = response.contents.next_page_url;
		}

		if ('listenScroll' in args) {
			if (args.listenScroll) {
				this.addScrollHandler ();
			} else {
				this.removeScrollHandler ();
			}
		}

		if (args.removeOld) {
			Dottoro.CallContentRemovedHandlers (this.settings['wrapper']);

			var wrapper = this.settings['wrapper'];
			if ('filters' in response.contents) {
				var elem = this.getComponent ('filters');
				if (elem) {
					wrapper = elem;
				}
			}
			var scroller = new Dottoro.ScrollerElem ();
			scroller.SetSettings ({targetelem: wrapper, vertoffset: -30});
			scroller.Activate ();

			if (args.pushState) {
				Dottoro.History.PushState ({}, '', args.requestUrl);
			}
		}

		args.filters = response.contents.filters;
		args.pagination = response.contents.pagination;

		args.extra_items = [];
		if ("extra_items" in response.contents) {
			args.extra_items = response.contents.extra_items;
		}
		this.no_more_entry_text = response.contents.no_more_entry_text;
		args.wrapper = Dottoro.CreateElement ('div', document.body);
			// because IE < 9 HTML 5 tags
		args.wrapper.style.display = "none";
		Dottoro.SetElemHtml (args.wrapper, newContent);
		args._styles = response._styles;
		args._scripts = response._scripts;

		var items = [];
		if (args.removeOld) {
			var extra_items = this.GetExtraItems (this.settings['extra_items']);
			items = this.GetTopMostArticleChilds (this.settings['wrapper'], extra_items);
			items = items.concat (extra_items);
		}
		this.settings['extra_items'] = args.extra_items;
		this.InitEffect (items, args);
	},

	GetExtraItems : function (extra_items) {
		var items = [];
		if (extra_items && Dottoro.IsArray (extra_items)) {
			for (var i=0; i < extra_items.length; i++) {
				var item = document.getElementById (extra_items[i]);
				if (item) {
					items.push (item);
				}
			}
		}
		return items;
	},

	GetTopMostArticleChilds : function (elem, extra_items) {
		var childs = [];
		extra_items = extra_items || [];
		var arts = elem.getElementsByTagName ("article");
		for (var i=0; i < arts.length; i++) {
			var paren = arts[i].parentNode;
			var isTopMost = true;
			while (paren && paren != elem) {
				if (paren.nodeName.toLowerCase () == 'article' || Dottoro.InArray (extra_items, paren) ) {
					isTopMost = false;
					break;
				}
				paren = paren.parentNode;
			}
			if (isTopMost) {
				childs.push (arts[i]);
			}
		}
		return childs;
	},

	IE8FilterPosStatic : function (elem) {
		for (var i=0; i < elem.children.length; i++) {
			var currElem = elem.children[i];
			var o_pos = Dottoro.GetStyle (currElem, 'position', false);
			if (o_pos == 'relative') {
				currElem.style.position = 'static';
				this.changedIE8Elems.push (currElem);
			}
			this.IE8FilterPosStatic (currElem);
		}
	},

	IE8FilterPosBack : function (elem) {
		for (var i=0; i < this.changedIE8Elems.length; i++) {
			var currElem = this.changedIE8Elems[i];
			currElem.style.position = 'relative';
		}
		this.changedIE8Elems = [];
	},

	InitEffect : function (items, args) {
		this.duringAnim = true;
		var effect = Dottoro.CreateAnimGroups (this.settings['paging_animation'], this.settings['paging_duration']);
		effect.SetSettings ({holderfrom: this.settings['wrapper']});
		effect.SetSettings ({holderto: this.settings['wrapper']});
		if (items && args.removeOld) {
			effect.SetSettings ({elemsfrom: items});
		}
		if (!args) {
			args = {};
		}
		var _this = this;
		effect.AddListener ('replacecontent', function (eventName, effect) {_this.ReplaceContent (eventName, effect, args);});
		effect.AddListener ('newcontentinitialized', function () {_this.NewContentInitialized (args);});
		effect.AddListener ('end', function () {_this.onAnimEnd (args);});
		effect.Start ();
	},

	ReplaceContent : function (eventName, effect, args) {
		var holder = this.settings['wrapper'];
		if (args.wrapper) {
			var holderNew = args.wrapper;
			holderNew.style.visibility = "hidden";
			holderNew.style.display = "block";
			if (holder) {
				holder.style.overflow = 'hidden';
				if (holder.childNodes.length == 1) {
					var origHeight = holder.firstChild.offsetHeight;
				} else {
					var origHeight = holder.offsetHeight;
				}
				holder.style.height = origHeight + 'px';

				if (args.removeOld) {
/*
						// bug fix for chrome, src of video must be cleared before it is removed from the document to avoid memory leaks
					var videos = holder.getElementsByTagName ('video');
					var len = videos.length;
					for (var i = 0; i < len; i++) {
						videos[i].src = '';
					}
*/
					holder.innerHTML = "";
				}
				holder.appendChild (holderNew);
				var newHeight = holderNew.offsetHeight;
				if (!args.removeOld) {
					newHeight += origHeight;
				}

				if (origHeight != newHeight) {
					var anim = new Dottoro.Anim ({elem: holder, props:{height: {from: origHeight, to: newHeight}}}, 500, {callback: [this, 'onResize']});
				}
			}
			var extra_items = this.GetExtraItems (args.extra_items);
			var items = this.GetTopMostArticleChilds (holderNew, extra_items);
			items = items.concat (extra_items);
		}
		else {
			var extra_items = this.GetExtraItems (this.settings['extra_items']);
			var items = this.GetTopMostArticleChilds (holder, extra_items);
			items = items.concat (extra_items);
		}
		effect.SetSettings ({elemsto: items});
	},

	NewContentInitialized : function (args) {
		var holder = args.wrapper ? args.wrapper : this.settings['wrapper'];
		holder.style.visibility = "visible";
		if (args.wrapper) {
			if (args['_scripts'] && args['_styles']) {
				DottoroWP.LoadAjaxScripts (args['_scripts'], args['_styles']);
			}
			Dottoro.CallContentReadyHandlers (args.wrapper, 'zero');
			if (Dottoro.CssEx) {
				Dottoro.CssEx.Attach (args.wrapper, true);
			}
		}

		if (args.pagination != null) {
			if (args.pagination == '') {
				this.clearComponent ('pagination');
			} else {
				this.updateComponent ('pagination', [this, 'onPagination'], args.pagination);
			}
		}
		if (args.removeOld) {
			if (args.filters == '') {
				this.clearComponent ('filters');
			} else {
				this.updateComponent ('filters', [this, 'onFilter'], args.filters);
			}
		}
		this.removePreloader ();
	},

	onResize : function (anim, timerId, t) {
		if (t < 0) {	// when timer is being cleared
			var holder = this.settings['wrapper'];
			holder.style.height = "auto";
		}
	},

	onAnimEnd : function (args) {
		if (Dottoro['isIE8']) {
			this.IE8FilterPosBack ();
		}
		this.duringAnim = false;
		if (args.wrapper) {
			Dottoro.CallContentReadyHandlers (args.wrapper, 'nonzero');
		}
		if (this.scrollHandlers.length > 0) {
			this.checkScrollPos ();
		}
	},

	createPreloader : function (suffix) {
		if (!this.preloader) {
			var where = this.getComponent (suffix);
			if (where) {
				this.preloader = {};
				this.preloader.orig = where.getElementsByTagName("div")[0];
				var sizes = Dottoro.GetSize (this.preloader.orig);
				this.preloader.holder = Dottoro.CreateElement ('div', where, {className:'pagination_preloader'}, {width:sizes.width + 'px', height:sizes.height + 'px'});
				this.preloader.obj = new DottoroWP.Preloader ();
				this.preloader.orig.style.display = 'none';
			}
		}
	},

	showPreloader : function (suffix) {
		this.createPreloader (suffix);
		if (this.preloader) {
			this.preloader.obj.Show (this.preloader.holder);
		}
	},

	removePreloader : function () {
		if (this.preloader) {
			this.preloader.obj.Remove ();
			Dottoro.RemoveNode (this.preloader.holder);
			this.preloader.orig.style.display = 'block';
		}
		delete this.preloader;
	},

	OnSendError : function (response) {
		this.waitResponse = false;
		if ('error' in response) {
			for (var i in response['error']) {
			}
		}
		return false;
	},

	Activate : function (response) {
		this.build ();
	}
});

(function () {
	Dottoro.RegisterTagParser ('ajax_pagination', parseTag);

	function initPagination (settings) {
		var pagination = new DottoroWP.AjaxPagination ();
		pagination.SetSettings (settings);
		pagination.Activate ();
	}

	function parseTag (tag) {
		var settings = Dottoro.GetNodeSettings (tag);
		initPagination (settings);
	}
		// allows to build a pagination from script
	DottoroWP.AjaxPagination.Build = function (settings) {
		initPagination (settings);
	}
}) ();


DottoroWP.Preloader = Dottoro.ClassEventsSettings.extend({
// private methods:
	init : function () {
		this.preloader = null;
		this.timer = null;
		this.items = null;
		this.step = null;
	},

	Create : function () {
		if (!this.preloader) {
			this.preloader = Dottoro.CreateElement ('span', null, {className:'preloader'});
			this.items = [];
			for (var i=0; i < 5; i++) {
				var elem = Dottoro.CreateElement ('span', this.preloader, {className:'button active'});
				Dottoro.SetOpacity (elem, 20);
				this.items.push (elem);
			}
		}
	},

	Remove : function () {
		if (this.preloader) {
			Dottoro.RemoveNode (this.preloader);
			if (this.timer) {
				clearInterval (this.timer);
				delete this.timer;
			}
		}
		delete this.preloader;
	},

	Show : function (where) {
		if (!this.timer) {
			this.Create ();
			where.appendChild (this.preloader);
			this.step = 2;
			var _this = this;
			this.timer = setInterval (function () {_this.Anim ()}, 100);
			this.Anim ();
		}
	},

	Anim : function () {
		var n = this.items.length;
		var s = this.step % n;
		var ss = this.step % (2*n);
		for (var i = 0; i < n ; i++) {
			var o = 0.2;
			if (i < ss && ss < i + 6) {
				o = ((i - s + n) % n) * 0.15 + 0.2;
			}
			Dottoro.SetOpacity (this.items[i], o);
		}
		this.step++;
	},

	Detach : function () {
		this.Remove ();
	}
});

(function () {
	Dottoro.RegisterTagParser ('popup_handler', parseTag);

	function parseTag (tag) {
		var params = tag.getAttribute ("data-dottoro_params");
		var params = Dottoro.SplitSettings (params);
		var elem = tag;
		if (params['for']) {
			elem = document.getElementById (params['for']);
		}
		if (elem) {
			Dottoro.AddListener("click", function () {DottoroWP.OpenPopup (params.id, params.contentArgs, params.windowArgs, params.args);}, elem);
		}
	}
}) ();

DottoroWP.Popup = Dottoro.Dialog.extend({
// private:
	init : function () {
		this._super ();
		this.AddBaseClass ("popup");
		this.showOnCreate = false;

		var defaults = {createokbutton: false, createcancelbutton: false, position: 'centered', framecalcsize: false, modal: true, actiononclose: 'destroy', mediapreload: true, autofocus: true};
		this.SetSettings (defaults);
	},

// public:
	ShowOnCreate : function (show) {
		this.showOnCreate = show;
	},

	InitAndCreate : function (settings, windowArgs) {
		if (settings.showanimprops) {
			try {
				var literal = Dottoro.Trim (settings.showanimprops);
				settings.showanimprops = (new Function ("return " + literal))();
			}
			catch (e) {}
		}
		if (!Dottoro.IsObject (settings.showanimprops)) {
			delete settings.showanimprops;
		}

		this.SetSettings (settings);
		if (windowArgs) {
			this.SetSettings (windowArgs);
		}

		if (!this.settings.showtitle) {
			delete this.settings.title;
		}

		this.Create ();

		if (this.showOnCreate) {
			this.Show ();
		}
	},

// override
	Show : function () {
		if (!this.IsCreated ()) {
			this.showOnCreate = true;
			return;
		}

		this._super ();
	},

	Hide : function () {
		if (!this.IsCreated ()) {
			this.showOnCreate = false;
			return;
		}

		this._super ();
	}
});


(function () {
	var popups = {};
	var staticPopups = {};
	var loadingPopups = {};

	function onPopupsReceived (response) {
		if (response) {
			if (!response['popups']) {
				return;
			}
			if (response['_scripts'] && response['_styles']) {
				DottoroWP.LoadAjaxScripts (response['_scripts'], response['_styles']);
			}

			var popups = response['popups'];
			var openKeys = {};
			for (var key in popups) {
				if (!staticPopups[key]) {
					staticPopups[key] = loadingPopups[key];
					staticPopups[key].windowArgs = staticPopups[key].windowArgs || {};
					Dottoro.Extend (staticPopups[key].windowArgs, popups[key]);
				}

				if (loadingPopups[key].open) {
					openKeys[key] = 1;
				}
				delete loadingPopups[key];
			}

			checkPreloaderAnim ();

			for (var key in openKeys) {
				var popup = staticPopups[key];
				DottoroWP.OpenPopup (popup.instanceId, popup.contentArgs, popup.windowArgs, {show: 'nochange'});
			}
		}
	}

	function onPopupsError (keys) {
		for (var key in keys) {
			delete loadingPopups[key];
		}
		checkPreloaderAnim ();
	}

	var preloader = null;
	function checkPreloaderAnim () {
		var show = false;
		for (var key in loadingPopups) {
			if (loadingPopups[key].preloaderAnim) {
				show = true;
				break;
			}
		}

		if (show) {
			if (!preloader) {
				preloader = {};
				preloader.opacDiv = Dottoro.CreateElement ("div", document.body, {className: "popup_ajax_preloader"}, {});
				preloader.anim = new Dottoro.PreloaderAnim (preloader.opacDiv, 0, 'nobg');
			}
		}
		else {
			if (preloader) {
				preloader.anim.Stop ();
				Dottoro.RemoveNode (preloader.opacDiv);
				preloader = null;
			}
		}
	}

	DottoroWP.AddStaticPopup = function (id, settings, contentArgs, instanceId) {
		var key = '' + (instanceId || id);
		staticPopups[key] = {id: id, contentArgs: contentArgs, windowArgs: settings};
	}

		// popups: [{id:, instanceId:, contentArgs:, windowArgs:, open:, preloaderAnim:}]
	DottoroWP.PreloadPopups = function (popups) {
		var data = {dottoro_ajax:1, dottoro_action:'get_popups', popups: {}};
		var keys = {};
		var len = 0;
		for (var i = 0; i < popups.length; i++) {
			var popup = popups[i];
			var key = '' + (popup.instanceId || popup.id);
			if (staticPopups[key] || loadingPopups[key]) {
				continue;
			}

			len++;
			keys[key] = 1;
			loadingPopups[key] = popup;
			data.popups[key] = popup;
		}

		if (len) {
			var params = {callback: onPopupsReceived, callbackOnError: function () {onPopupsError (keys);}, async:true};
			data.popups = Dottoro.JSONEncode (data.popups);
			Dottoro.Ajax.PostRequest (location.href, data, params);

			checkPreloaderAnim ();
		}
	}

	DottoroWP.GetPopup = function (id) {
		if (id in popups) {
			return popups[id];
		}
		return null;
	},

		// args: {show: true, instanceId: ''}
	DottoroWP.OpenPopup = function (id, contentArgs, windowArgs, args) {
			// backward compatibility
		if (typeof (args) == 'boolean') {
			args = {show: args};
		}

		args = Dottoro.Extend ({show: true, instanceId: '', preloaderAnim: false}, args);
		var setShow = (args.show != 'nochange');

		var key = '' + (args.instanceId || id);
		var popup = popups[key];
			// IsCreated is need for popup during preload (loadingPopups)
		if (popup && popup.IsCreated ()) {
			if (contentArgs) {
				popup.SetDialArgs (contentArgs);
			}
			if (windowArgs) {
				popup.SetSettings (windowArgs);
			}
			if (setShow && args.show) {
				popup.Show ();
			}
			return popup;
		}

		if (!popup) {
			popup = new DottoroWP.Popup ();
			popups[key] = popup;
			popup.AddListener ('destroyed', function () {if (key in popups) {delete popups[key];}});
		}

		if (setShow) {
			popup.ShowOnCreate (args.show);
		}

		if (staticPopups[key]) {
			if (contentArgs) {
				popup.SetDialArgs (contentArgs);
			}
			popup.InitAndCreate (staticPopups[key].windowArgs, windowArgs);
		}
		else {
			if (key in loadingPopups) {
				loadingPopups[key].open = true;
				if (windowArgs) {
					loadingPopups[key].windowArgs = windowArgs;
				}
				if (contentArgs) {
					loadingPopups[key].contentArgs = contentArgs;
				}
				if (args.preloaderAnim) {
					loadingPopups[key].preloaderAnim = true;
					checkPreloaderAnim ();
				}
			}
			else {
				DottoroWP.PreloadPopups ([{id: id, instanceId: key, contentArgs: contentArgs, windowArgs: windowArgs, open: true, preloaderAnim: args.preloaderAnim}]);
			}
		}
		return popup;
	}

	DottoroWP.ClosePopup = function (id, instanceId) {
		var key = '' + (instanceId || id);
		if (key in popups) {
			popups[key].Close ();
		}
	}

	DottoroWP.GetOwnerPopup = function (elem) {
		return Dottoro.GetHolderObject (elem, Dottoro.Dialog);
	}
}) ();


(function () {
	Dottoro.ContentReady (removeFocusBorder, 0);

	function removeFocusBorder (holder) {
		if ('hideFocus' in document.body) {
			var tags = holder.getElementsByTagName ('a');
			Dottoro.HideFocus (tags);
		}
	}
}) ();

(function () {
	var meConstruct = null;
	var meInit = null;
	var meSetPlayerSize = null;
	Dottoro.ContentReady (initMediaElements, 0);

	function initMediaElements (holder) {
		if (window.mejs) {
			wrapMEPlayer ();
			if (window.jQuery) {
				var elems = jQuery(holder).find ('.wp-audio-shortcode, .wp-video-shortcode');
				elems.mediaelementplayer();
			}
		}
	}

	function initCSSExMEPlayer (player, elem, w, h) {
		try {
			if (player.container) {
					// mediaelement js adds the CSS classes of the video element to the container
					// add a player reference to the container to prevent duplicated init (wp-mediaelement runs later)
				var cont = player.container[0];
				cont.player = player;

				if (w > 0 && h > 0) {
					Dottoro.ModifyCSSClass (cont,['js-keep-aspect-ratio', 'js-flex-height']);
					cont.setAttribute ('data-aspect_ratio', w / h);
					cont.setAttribute ('data-dottoro_init_width', w + 'px');
					cont.setAttribute ('data-dottoro_init_height', h + 'px');
					Dottoro.ModifyCSSClass (elem, ['js-no-aspect-ratio', 'js-no-flex-height']);
				}
			}
		} catch (e) {}
	}

	function wrapMEPlayer () {
		if (window.mejs) {
			if (!meInit) {
				meInit = mejs.MediaElementPlayer.prototype.init;
				mejs.MediaElementPlayer.prototype.init = function (elem) {
					var w = Number (this.media.getAttribute('width'));
					var h = Number (this.media.getAttribute('height'));
					meInit.apply (this, arguments);
					initCSSExMEPlayer (this, this.media, w, h);
				}

				meSetPlayerSize = mejs.MediaElementPlayer.prototype.setPlayerSize;
				mejs.MediaElementPlayer.prototype.setPlayerSize = function () {
					var container = this.container[0];
					var id = Dottoro._getData (container, 'cssex/aspectRatioId');
					if (id) {
						return;
					}
					meSetPlayerSize.apply (this, arguments);
				}

				mejs.MediaElementPlayer.prototype.dottoroSetPlayerSize = function () {
					var container = this.container[0];
					var media = this.$node[0];

					var w = container.offsetWidth;
					var h = container.offsetHeight;

					media.style.width = w + 'px';
					media.style.height = h + 'px';
					media.style.maxWidth = 'none';

					meSetPlayerSize.apply (this, [w, h]);
/*
					var w = Dottoro.GetStyle (container, 'width');
					var h = Dottoro.GetStyle (container, 'height');

					media.style.width = w;
					media.style.height = h;
					media.style.maxWidth = 'none';


					w = Dottoro.GetPixelLength (container, 'width');
					h = Dottoro.GetPixelLength (container, 'height');
					meSetPlayerSize.apply (this, [w, h]);
*/

//					this.setControlsSize ();
				}
			}
		}
	}

	DottoroWP.wrapMEPlayer = wrapMEPlayer;
}) ();

(function () {
	Dottoro.ContentReady (initPlaceholders, 0);

	function initPlaceholders (holder) {
		var inputs = holder.getElementsByTagName ('input');
		var len = inputs.length;
		for (var i = 0; i < len; i++) {
			var input = inputs[i];
			Dottoro.PlaceHolder (input);
		}
	}
}) ();


(function () {
	Dottoro.Ready (initScrollToTop);

	function initScrollToTop () {
		var topScroller = document.getElementById ('to_top');
		if (topScroller) {
			new DottoroWP.WinScroll (topScroller);
		}
	}
}) ();

(function () {
	Dottoro.ContentReady (addWModeToObjects, 0);

	function addWModeToObjects (holder) {
		var objectTags = holder.getElementsByTagName ('object');
		for (var i=0; i < objectTags.length; i++) {
			try {
				var objectTag = objectTags[i];
				if ('object' in objectTag && 'wmode' in objectTag.object) {
					var wMode = objectTag.object.wmode;
					if (!wMode || wMode.toLowerCase () == 'window') {
						objectTag.object.wmode = 'transparent';
					}
				}
			} catch (e) {};
		}
		var embeds = holder.getElementsByTagName ('embed');
		for (var i=0; i < embeds.length; i++) {
			try {
				var embed = embeds[i];
				if ('wmode' in embed) {
					var wMode = embed.wmode;
					if (!wMode || wMode.toLowerCase () == 'window') {
						embed.wmode = 'transparent';
					}
				}
				else {
					var wMode = embed.getAttribute ("wmode");
					if (!wMode || wMode.toLowerCase () == 'window') {
						embed.setAttribute ("wmode", "transparent");
					}
				}
			} catch (e) {};
		}
	}
}) ();

(function () {
	Dottoro.ContentReady (setDataSrcForImgs, 0);

	function setDataSrcForImgs (holder) {
		var imgs = holder.getElementsByTagName ('img');
		for (var i=0; i < imgs.length; i++) {
			var img = imgs[i];
			var s = img.getAttribute("data-dottoro_src");
			if (s) {
				Dottoro._setData (img, 'load_listener', Dottoro.AddListener('load', Dottoro.Medias.RemoveLoadingClass, img));
				Dottoro.ModifyCSSClass (img, 'loading', '');

					// bug fix for IE11
					// clear the src before set a new value (especially when the original src was an SVG)
					// otherwise IE crashes after some time (randomly, sometimes on page load, sometimes when the mouse hovers over a slideshow button, etc.)					
				if (Dottoro.isIE) {
					img.src = '';
					Dottoro._setData (img, 'cssex/checkheight', 1);	// the height of the element is invalid for a while, mark the element for the cssex
				}

				img.src = s;
				img.removeAttribute ("data-dottoro_src");
				Dottoro._setData (img, 'dynamicSrc', s);
			}
			if (img.src.indexOf('.png') > 0 && Dottoro.isIEOlder (9)) {
				srcToAlphaImageLoader (img);
			}
		}
	}

	function srcToAlphaImageLoader (img) {
		var w = parseFloat (img.getAttribute ('width'));
		var h = parseFloat (img.getAttribute ('height'));
		if (w && h) {
			img.style.width = w + 'px';
			img.style.height = h + 'px';

			img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+ img.src +"', sizingMethod='scale')";
			img.src = "data:image/gif;base64,R0lGODlhAQABAJH/AP///wAAAMDAwAAAACH5BAEAAAIALAAAAAABAAEAAAICVAEAOw==";
		}
	}
}) ();
