/* global chrome */
"use strict";

let Constants = require( './constants' );

let Percy_Proxy = function( config ) {
	this.config = config;
};

Percy_Proxy.MODE_OFF = 'off';
Percy_Proxy.MODE_PAC = 'pac';
Percy_Proxy.MODE_ALL = 'all';

Percy_Proxy.prototype.start = function() {
	// Handle messages sent by the popup window
	chrome.runtime.onMessage.addListener( this.onMessage.bind( this ) );

	this.changeMode( this.config.getMode() );
};

Percy_Proxy.prototype.changeMode = function( mode ) {
	if ( mode === Percy_Proxy.MODE_OFF )
		this.proxyOff();
	else if ( mode === Percy_Proxy.MODE_PAC )
		this.proxyPAC();
	else if ( mode === Percy_Proxy.MODE_ALL )
		this.proxyAll();
	else
		return;

	let icons = {
		off: 'black',
		pac: 'green',
		all: 'red'
	};

	chrome.browserAction.setIcon( { path: 'percy-128-' + icons[mode] + '.png' } );
};

Percy_Proxy.prototype.onMessage = function( request, sender, sendResponse ) {
	if ( request.greeting === Constants.CONFIG_CHANGED ) {
		this.config.load( request.config );
		this.changeMode( this.config.getMode() );
	}

	return true;
};

Percy_Proxy.prototype.proxyOff = function() {
	chrome.proxy.settings.set( { value: { mode: 'direct' }, scope: 'regular' }, function() {});
};

Percy_Proxy.prototype.proxyPAC = function() {
	let pac = {
		url: this.config.getPAC(),
		mandatory: true
	};

	chrome.proxy.settings.set( { value: { mode: 'pac_script', pacScript: pac }, scope: 'regular' }, function() {});
};

Percy_Proxy.prototype.proxyAll = function() {
	let rules = {
		proxyForHttp: {
			scheme: 'socks5',
			host: 'localhost',
			port: this.config.getPort()
		},
		proxyForHttps: {
			scheme: 'socks5',
			host: 'localhost',
			port: this.config.getPort()
		}
	};

	chrome.proxy.settings.set( { value: { mode: 'fixed_servers', rules: rules }, scope: 'regular' }, function() {});
};

module.exports = Percy_Proxy;
