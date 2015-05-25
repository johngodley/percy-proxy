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

},{"./constants":2,"./percy-proxy":3}],2:[function(require,module,exports){
"use strict";

module.exports = {
    CONFIG_CHANGED: "PercyReload",
    MESSAGE_GET_LEAKS: "PercyGetLeaks",
    DEFAULT_PORT: 8080
};

},{}],3:[function(require,module,exports){
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

},{"./constants":2}],4:[function(require,module,exports){
"use strict";

var Config = require("./config");
var Constants = require("./constants");

var Percy_Popup = function Percy_Popup(config) {
    this.config = config;
};

Percy_Popup.prototype.start = function () {
    this.setMode(this.config.getMode());
    this.setPort(this.config.getPort());
    this.setPAC(this.config.getPAC());
    this.setAuthMode(this.config.getAuthMode());
    this.setSafeUrls(this.config.getSafeUrls());

    document.querySelectorAll("input[type=submit]")[0].addEventListener("click", this.onSubmit.bind(this));

    chrome.browserAction.getBadgeText({}, this.setBadgeStyle.bind(this));
};

Percy_Popup.prototype.setMode = function (mode) {
    var proxy = document.querySelectorAll("input[type=radio]");

    for (var i = 0; i < proxy.length; i++) {
        // Is this the mode one?
        if (proxy[i].value === mode) proxy[i].checked = true;
    }
};

Percy_Popup.prototype.setPort = function (port) {
    this.getPortNode().value = port;
};

Percy_Popup.prototype.setPAC = function (pac) {
    this.getPACNode().value = pac;
};

Percy_Popup.prototype.setAuthMode = function (mode) {
    this.getAuthNode().checked = mode;
};

Percy_Popup.prototype.setSafeUrls = function (urls) {
    this.getSafeUrlNode().value = urls.join("\n");
};

Percy_Popup.prototype.setBadgeStyle = function (leaks) {
    var leaksNode = document.getElementById("leaks");

    leaksNode.style.display = "none";

    if (parseInt(leaks, 10) > 0) leaksNode.style.display = "block";
};

Percy_Popup.prototype.getPortNode = function () {
    return document.querySelectorAll("#port")[0];
};

Percy_Popup.prototype.getPACNode = function () {
    return document.querySelectorAll("#pac")[0];
};

Percy_Popup.prototype.getAuthNode = function () {
    return document.querySelectorAll("#auth")[0];
};

Percy_Popup.prototype.getModeNode = function () {
    return document.querySelectorAll("input[name=proxy]:checked")[0];
};

Percy_Popup.prototype.getSafeUrlNode = function () {
    return document.querySelectorAll("#safe")[0];
};

Percy_Popup.prototype.onSubmit = function () {
    this.config.setMode(this.getModeNode().value);
    this.config.setPort(this.getPortNode().value);
    this.config.setPAC(this.getPACNode().value);
    this.config.setAuthMode(this.getAuthNode().checked);
    this.config.setSafeUrls(this.getSafeUrlNode().value);

    this.config.save();

    chrome.runtime.sendMessage({
        greeting: Constants.CONFIG_CHANGED,
        config: this.config.getJSON()
    });

    window.close();
};

document.addEventListener("DOMContentLoaded", function () {
    Config(function (config) {
        var popup = new Percy_Popup(config);

        popup.start();
    });
});
/* global chrome, document, window */

},{"./config":1,"./constants":2}]},{},[4]);
