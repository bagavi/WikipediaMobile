// iOS+PhoneGap-specific setup

function getAboutVersionString() {
	return "3.1RC1";
}

(function() {
	var iOSCREDITS = [
		"<a href='https://github.com/phonegap/phonegap-plugins/tree/master/iPhone/ActionSheet'>PhoneGap ActionSheet plugin</a>, <a href='http://www.opensource.org/licenses/MIT'>MIT License</a>",
		"<a href='https://github.com/devgeeks/ReadItLaterPlugin'>PhoneGap ReadItLater Plugin</a>, <a href='http://www.opensource.org/licenses/MIT'>MIT License</a>",
		"<a href='https://github.com/davejohnson/phonegap-plugin-facebook-connect'>PhoneGap Facebook Connect Plugin</a>, <a href='http://www.opensource.org/licenses/MIT'>MIT License</a>",
		"<a href='https://github.com/facebook/facebook-ios-sdk'>Facebook iOS SDK</a>, <a href='http://www.apache.org/licenses/LICENSE-2.0.html'>Apache License 2.0</a>",
		"<a href='http://stig.github.com/json-framework/'>SBJSON</a>, <a href='http://www.opensource.org/licenses/bsd-license.php'>New BSD License</a>"
	];

	window.CREDITS.push.apply(window.CREDITS, iOSCREDITS);
})();

// Save page supporting code
app.loadCachedPage = function (url) {
	return urlCache.getCachedData(url).then(function(data) {
		chrome.renderHtml(data, url);
		chrome.onPageLoaded();
	}).fail(function(error) {
		console.log('Error: ' + error);
		chrome.hideSpinner();
	});
}

savedPages.doSave = function(url, title) {
	// Get the entire HTML again
	// Hopefully this is in cache
	// What we *really* should be doing is putting all this in an SQLite DataBase. FIXME
	$.get(url,
			function(data) {
				urlCache.saveCompleteHtml(url, data).then(function() {;
					chrome.showNotification(mw.message('page-saved', title).plain());
				});
			}
		 );
}

// @Override
function popupMenu(items, callback, options) {
	if (options.origin) {
		var $origin = $(options.origin),
			pos = $origin.offset();
		options.left = pos.left;
		options.top = 0; // hack pos.top;
		options.width = $origin.width();
		options.height = $origin.height();
	}
	window.plugins.actionSheet.create('', items, callback, options);
}

function shareRIL() {
	var url = app.getCurrentUrl().replace('.m.', '.');
	var title = app.getCurrentTitle();

	window.plugins.readItLaterPlugin.saveToReadItLater(function() {
		console.log("Successfully saved!");
	}, {
		url: url,
		title: title
	});
}

chrome.addPlatformInitializer(function() {
	console.log("Logging in!");
	window.plugins.FB.init("[FB-APP-ID]", function() {
		console.log("failed FB init:(");
	});
	console.log("Logged in!");
});

function shareFB() {
	var url = app.getCurrentUrl().replace('.m.', '.');
	var title = app.getCurrentTitle();

	window.plugins.FB.dialog({
		method: 'feed',
		link: url,
		caption: title
		//FIXME: Also include exerpt?
	});
}

function shareTwitter() {
	var url = app.getCurrentUrl().replace('.m.', '.');
	var title = app.getCurrentTitle();

	window.plugins.twitter.isTwitterAvailable(function(available) {
		if(!available) {
			chrome.showNotification(mw.message("twitter-not-available"));
			return;
		}
		window.plugins.twitter.composeTweet(function() {
			console.log("Success!");
		}, function() {
			console.log("Failed :(");
		}, title + " " + url);
	});
}

chrome.showNotification = function(message) {
	var d = $.Deferred();
	navigator.notification.alert(message, function() {
		d.resolve();
	}, "");
	return d;
};

origDoScrollHack = chrome.doScrollHack;
// @Override
chrome.doScrollHack = function(element, leaveInPlace) {
	// @fixme only use on iOS 4.2?
	if (navigator.userAgent.match(/iPhone OS [34]/)) {
		var $el = $(element),
			scroller = $el[0].scroller;
		if (scroller) {
			window.setTimeout(function() {
				scroller.refresh();
			}, 0);
		} else {
			scroller = new iScroll($el[0]);
			$el[0].scroller = scroller;
		}
		if (!leaveInPlace) {
			scroller.scrollTo(0, 0);
		}
	} else {
		origDoScrollHack(element, leaveInPlace);
	}
}
