/* global chrome, document, window */
"use strict";

let Config = require( './config' );
let Constants = require( './constants' );

let Percy_Popup = function( config ) {
    this.config = config;
};

Percy_Popup.prototype.start = function() {
    this.setMode( this.config.getMode() );
    this.setPort( this.config.getPort() );
    this.setPAC( this.config.getPAC() );
    this.setAuthMode( this.config.getAuthMode() );
    this.setSafeUrls( this.config.getSafeUrls() );

	document.querySelectorAll( 'input[type=submit]' )[0].addEventListener( 'click', this.onSubmit.bind( this ) );

	chrome.browserAction.getBadgeText( {}, this.setBadgeStyle.bind( this ) );
};

Percy_Popup.prototype.setMode = function( mode ) {
    let proxy = document.querySelectorAll( 'input[type=radio]' );

    for ( let i = 0; i < proxy.length; i++ ) {
        // Is this the mode one?
        if ( proxy[i].value === mode )
            proxy[i].checked = true;
    }
};

Percy_Popup.prototype.setPort = function( port ) {
    this.getPortNode().value = port;
};

Percy_Popup.prototype.setPAC = function( pac ) {
    this.getPACNode().value = pac;
};

Percy_Popup.prototype.setAuthMode = function( mode ) {
    this.getAuthNode().checked = mode;
};

Percy_Popup.prototype.setSafeUrls = function( urls ) {
    this.getSafeUrlNode().value = urls.join( "\n" );
};

Percy_Popup.prototype.setBadgeStyle = function( leaks ) {
    let leaksNode = document.getElementById( 'leaks' );

    leaksNode.style.display = 'none';

    if ( parseInt( leaks, 10 ) > 0 )
        leaksNode.style.display = 'block';
};

Percy_Popup.prototype.getPortNode = function() {
    return document.querySelectorAll( '#port' )[0];
};

Percy_Popup.prototype.getPACNode = function() {
    return document.querySelectorAll( '#pac' )[0];
};

Percy_Popup.prototype.getAuthNode = function() {
    return document.querySelectorAll( '#auth' )[0];
};

Percy_Popup.prototype.getModeNode = function() {
    return document.querySelectorAll( 'input[name=proxy]:checked' )[0];
};

Percy_Popup.prototype.getSafeUrlNode = function() {
    return document.querySelectorAll( '#safe' )[0];
};

Percy_Popup.prototype.onSubmit = function() {
    this.config.setMode( this.getModeNode().value );
    this.config.setPort( this.getPortNode().value );
    this.config.setPAC( this.getPACNode().value );
    this.config.setAuthMode( this.getAuthNode().checked );
    this.config.setSafeUrls( this.getSafeUrlNode().value );

    this.config.save();

	chrome.runtime.sendMessage( {
		greeting: Constants.CONFIG_CHANGED,
        config: this.config.getJSON()
	} );

	window.close();
};

document.addEventListener( 'DOMContentLoaded', () => {
    Config( ( config ) => {
        let popup = new Percy_Popup( config );

        popup.start();
    } );
} );
