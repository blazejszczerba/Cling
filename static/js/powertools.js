// packager build History/*
/*
---

name: Class.Binds

description: A clean Class.Binds Implementation

authors: Scott Kyle (@appden), Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class, Core/Function]

provides: Class.Binds

...
*/

Class.Binds = new Class({

	$bound: {},

	bound: function(name){
		return this.$bound[name] ? this.$bound[name] : this.$bound[name] = this[name].bind(this);
	}

});

/*
---

name: History

description: History Management via popstate or hashchange.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Events, Core/Element.Event, Class-Extras/Class.Binds]

provides: History

...
*/

(function(){

var events = Element.NativeEvents,
	location = window.location,
	cleanURL = function(url){
		if (url.match(/^https?:\/\//)) url = '/' + url.split('/').slice(3).join('/');
		return url;
	},
	base = cleanURL(location.href),
	history = window.history,
	hasPushState = ('pushState' in history),
	event = hasPushState ? 'popstate' : 'hashchange';

this.History = new new Class({

	Implements: [Class.Binds, Events],

	initialize: hasPushState ? function(){
		events[event] = 2;
		window.addEvent(event, this.bound('pop'));
	} : function(){
		events[event] = 1;
		window.addEvent(event, this.bound('pop'));

		this.hash = location.hash;
		var hashchange = ('onhashchange' in window);
		if (!(hashchange && (document.documentMode === undefined || document.documentMode > 7)))
			this.timer = this.check.periodical(200, this);
	},

	cleanURL: cleanURL,

	push: hasPushState ? function(url, title, state){
		url = cleanURL(url);
		if (base && base != url) base = null;

		history.pushState(state || null, title || null, url);
		this.onChange(url, state);
	} : function(url){
		location.hash = cleanURL(url);
	},

	replace: hasPushState ? function(url, title, state){
		history.replaceState(state || null, title || null, cleanURL(url));
	} : function(url){
		url = cleanURL(url);
		this.hash = '#' + url;
		this.push(url);
	},

	pop: hasPushState ? function(event){
		var url = cleanURL(location.href);
		if (url == base){
			base = null;
			return;
		}
		this.onChange(url, event.event.state);
	} : function(){
		var hash = location.hash;
		if (this.hash == hash) return;

		this.hash = hash;
		this.onChange(cleanURL(hash.substr(1)));
	},

	onChange: function(url, state){
		this.fireEvent('change', [url, state || {}]);
	},

	back: function(){
		history.back();
	},

	forward: function(){
		history.forward();
	},

	getPath: function(){
		return cleanURL(hasPushState ? location.href : location.hash.substr(1));
	},

	hasPushState: function(){
		return hasPushState;
	},

	check: function(){
		if (this.hash != location.hash) this.pop();
	}

});

}).call(this);


/*
---

name: History.handleInitialState

description: Provides a helper method to handle the initial state of your application.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [History]

provides: History.handleInitialState

...
*/

History.handleInitialState = function(base){
	if (!base) base = '';
	var location = window.location,
		pathname = History.cleanURL(location.href).substr(base.length),
		hash = location.hash,
		hasPushState = History.hasPushState();

	if (!hasPushState && pathname.length > 1){
		window.location = (base || '/') + '#' + pathname;
		return true;
	}

	if (!hash || hash.length <= 1) return false;
	if (hasPushState){
		(function(){
			History.push(History.cleanURL(hash.substr(1)));
		}).delay(1);
		return false;
	}

	if (!pathname || pathname == '/') return false;
	window.location = (base || '/') + hash;
	return true;
};

