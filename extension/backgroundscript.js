(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var Percy_Proxy = require("./percy-proxy");
var Constants = require("./constants");

var Percy_Proxy_Config = function Percy_Proxy_Config(data) {
    this.load(data);
};

Percy_Proxy_Config.prototype.load = function (data) {
    this.mode = data.proxyMode || Percy_Proxy.MODE_OFF;
    this.port = data.proxyPort || Constants.DEFAULT_PORT;
    this.pac = data.proxyPAC || "";
    this.authMode = data.authMode === "undefined" ? true : data.authMode;
    this.safeUrls = data.safeUrls || [];
};

Percy_Proxy_Config.prototype.getMode = function () {
    return this.mode;
};

Percy_Proxy_Config.prototype.getPort = function () {
    return this.port;
};

Percy_Proxy_Config.prototype.getPAC = function () {
    return this.pac;
};

Percy_Proxy_Config.prototype.getSafeUrls = function () {
    return this.safeUrls;
};

Percy_Proxy_Config.prototype.getAuthMode = function () {
    return this.authMode;
};

Percy_Proxy_Config.prototype.setMode = function (mode) {
    this.mode = mode;
};

Percy_Proxy_Config.prototype.setAuthMode = function (mode) {
    this.authMode = mode;
};

Percy_Proxy_Config.prototype.setPort = function (port) {
    this.port = parseInt(port, 10);
};

Percy_Proxy_Config.prototype.setPAC = function (pac) {
    this.pac = pac;
};

Percy_Proxy_Config.prototype.setSafeUrls = function (text) {
    this.safeUrls = text.split("\n").filter(function (item) {
        return item;
    });
};

Percy_Proxy_Config.prototype.addSafeUrl = function (url) {
    this.safeUrls.push(url);
};

Percy_Proxy_Config.prototype.getJSON = function () {
    return {
        proxyPort: this.port,
        proxyPAC: this.pac,
        proxyMode: this.mode,
        authMode: this.authMode,
        safeUrls: this.safeUrls
    };
};

Percy_Proxy_Config.prototype.save = function () {
    chrome.storage.sync.set(this.getJSON(), function () {});
};

module.exports = function (cb) {
    chrome.storage.sync.get(null, function (object) {
        cb(new Percy_Proxy_Config(object));
    });
};
/* global chrome */

},{"./constants":2,"./percy-proxy":5}],2:[function(require,module,exports){
"use strict";

module.exports = {
    CONFIG_CHANGED: "PercyReload",
    MESSAGE_GET_LEAKS: "PercyGetLeaks",
    DEFAULT_PORT: 8080
};

},{}],3:[function(require,module,exports){
"use strict";

var Percy_HTTP_Auth = function Percy_HTTP_Auth(config) {
	this.config = config;
};

Percy_HTTP_Auth.prototype.start = function () {
	// Listen for HTTP basic auth requests
	chrome.webRequest.onAuthRequired.addListener(this.onAuthRequired.bind(this), { urls: ["<all_urls>"] }, ["blocking"]);
};

/**
 * Test if a server/port is in a list. Checks both server on its own, and server:port together
 */
Percy_HTTP_Auth.prototype.isKnownHost = function (host, port) {
	var safe = this.config.getSafeUrls();

	for (var x = 0; x < safe.length; x++) {
		if (host === safe[x] || host + ":" + port === safe[x]) return true;
	}

	return false;
};

Percy_HTTP_Auth.prototype.onAuthRequired = function (details) {
	// Is it one of our safe known servers?
	if (this.isKnownHost(details.challenger.host, details.challenger.port)) return {};

	// Not a known safe server. Alert the user
	if (confirm(this.getAuthMessage(details))) {
		this.addKnownServer(details.challenger.host, details.challenger.port);
		return {}; // Let it fall through to the standard auth prompt
	}

	// Return a cancel message
	return {
		cancel: true
	};
};

Percy_HTTP_Auth.prototype.getAuthMessage = function (details) {
	var message = "WARNING! A request was made to authorize an unknown server.\n\n";

	message += "Request: " + details.url + "\n";
	message += "Server: " + details.challenger.host + ":" + details.challenger.port + "\n\n";

	if (details.realm) message += "Message: " + details.realm + "\n\n";

	message += "Only confirm if you are sure this is a safe server.";
	return message;
};

Percy_HTTP_Auth.prototype.addKnownServer = function (host, port) {
	this.config.addSafeUrl(host + ":" + port);
	this.config.save();
};

module.exports = Percy_HTTP_Auth;
/* global chrome */

},{}],4:[function(require,module,exports){
"use strict";

var Constants = require("./constants");
var Percy_Proxy = require("./percy-proxy");

var Percy_Protected = function Percy_Protected(config) {
	this.config = config;
	this.leakedUrls = 0;
	this.listener = this.onLeakProtected.bind(this);
};

Percy_Protected.prototype.start = function () {
	chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
	this.run();
};

Percy_Protected.prototype.run = function () {
	if (this.config.getMode() === Percy_Proxy.MODE_OFF) chrome.webRequest.onBeforeRequest.addListener(this.listener, { urls: this.config.getSafeUrls() });else chrome.webRequest.onBeforeRequest.removeListener(this.listener);

	this.changeBadge("");
	this.leakedUrls = 0;
};

Percy_Protected.prototype.onMessage = function (request, sender, sendResponse) {
	if (request.greeting === Constants.CONFIG_CHANGED) {
		this.config.load(request.config);
		this.run();
	} else if (request.greeting === Constants.MESSAGE_GET_LEAKS) sendResponse({ leaks: this.leakedUrls });
};

Percy_Protected.prototype.changeBadge = function (count) {
	chrome.browserAction.setBadgeText({ text: count });
};

Percy_Protected.prototype.onLeakProtected = function (x) {
	this.leakedUrls++;
	this.changeBadge(this.leakedUrls.toString());
};

module.exports = Percy_Protected;
/* global chrome */

},{"./constants":2,"./percy-proxy":5}],5:[function(require,module,exports){
"use strict";

var Constants = require("./constants");

var Percy_Proxy = function Percy_Proxy(config) {
	this.config = config;
};

Percy_Proxy.MODE_OFF = "off";
Percy_Proxy.MODE_PAC = "pac";
Percy_Proxy.MODE_ALL = "all";

Percy_Proxy.prototype.start = function () {
	// Handle messages sent by the popup window
	chrome.runtime.onMessage.addListener(this.onMessage.bind(this));

	this.changeMode(this.config.getMode());
};

Percy_Proxy.prototype.changeMode = function (mode) {
	if (mode === Percy_Proxy.MODE_OFF) this.proxyOff();else if (mode === Percy_Proxy.MODE_PAC) this.proxyPAC();else if (mode === Percy_Proxy.MODE_ALL) this.proxyAll();else return;

	var icons = {
		off: "black",
		pac: "green",
		all: "red"
	};

	chrome.browserAction.setIcon({ path: "percy-128-" + icons[mode] + ".png" });
};

Percy_Proxy.prototype.onMessage = function (request, sender, sendResponse) {
	if (request.greeting === Constants.CONFIG_CHANGED) {
		this.config.load(request.config);
		this.changeMode(this.config.getMode());
	}

	return true;
};

Percy_Proxy.prototype.proxyOff = function () {
	chrome.proxy.settings.set({ value: { mode: "direct" }, scope: "regular" }, function () {});
};

Percy_Proxy.prototype.proxyPAC = function () {
	var pac = {
		url: this.config.getPAC(),
		mandatory: true
	};

	chrome.proxy.settings.set({ value: { mode: "pac_script", pacScript: pac }, scope: "regular" }, function () {});
};

Percy_Proxy.prototype.proxyAll = function () {
	var rules = {
		proxyForHttp: {
			scheme: "socks5",
			host: "localhost",
			port: this.config.getPort()
		},
		proxyForHttps: {
			scheme: "socks5",
			host: "localhost",
			port: this.config.getPort()
		}
	};

	chrome.proxy.settings.set({ value: { mode: "fixed_servers", rules: rules }, scope: "regular" }, function () {});
};

module.exports = Percy_Proxy;
/* global chrome */

},{"./constants":2}],6:[function(require,module,exports){
"use strict";

// XXX check into github
// XXX http auth URLS arent same as protected URLs
// XXX check auth alert setting actually toggles auth alerts

var Percy_HTTP_Auth = require("./percy-http-auth");
var Percy_Proxy = require("./percy-proxy");
var Percy_Protected = require("./percy-protected");
var Config = require("./config");

Config(function (config) {
	var proxy = new Percy_Proxy(config);
	var auth = new Percy_HTTP_Auth(config);
	var protect = new Percy_Protected(config);

	auth.start();
	proxy.start();
	protect.start();
});

},{"./config":1,"./percy-http-auth":3,"./percy-protected":4,"./percy-proxy":5}]},{},[6]);
