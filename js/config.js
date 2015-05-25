/* global chrome */
"use strict";

let Percy_Proxy = require( './percy-proxy' );
let Constants = require( './constants' );

let Percy_Proxy_Config = function( data ) {
    this.load( data );
};

Percy_Proxy_Config.prototype.load = function( data ) {
    this.mode = data.proxyMode || Percy_Proxy.MODE_OFF;
    this.port = data.proxyPort || Constants.DEFAULT_PORT;
    this.pac = data.proxyPAC || '';
    this.authMode = data.authMode === 'undefined' ? true : data.authMode;
    this.safeUrls = data.safeUrls || [];
};

Percy_Proxy_Config.prototype.getMode = function() {
    return this.mode;
};

Percy_Proxy_Config.prototype.getPort = function() {
    return this.port;
};

Percy_Proxy_Config.prototype.getPAC = function() {
    return this.pac;
};

Percy_Proxy_Config.prototype.getSafeUrls = function() {
    return this.safeUrls;
};

Percy_Proxy_Config.prototype.getAuthMode = function() {
    return this.authMode;
};

Percy_Proxy_Config.prototype.setMode = function( mode ) {
    this.mode = mode;
};

Percy_Proxy_Config.prototype.setAuthMode = function( mode ) {
    this.authMode = mode;
};

Percy_Proxy_Config.prototype.setPort = function( port ) {
    this.port = parseInt( port, 10 );
};

Percy_Proxy_Config.prototype.setPAC = function( pac ) {
    this.pac = pac;
};

Percy_Proxy_Config.prototype.setSafeUrls = function( text ) {
    this.safeUrls = text.split( "\n" ).filter( ( item ) => {
        return item;
    } );
};

Percy_Proxy_Config.prototype.addSafeUrl = function( url ) {
    this.safeUrls.push( url );
};

Percy_Proxy_Config.prototype.getJSON = function() {
    return {
        proxyPort: this.port,
        proxyPAC: this.pac,
        proxyMode: this.mode,
        authMode: this.authMode,
        safeUrls: this.safeUrls
    };
};

Percy_Proxy_Config.prototype.save = function() {
    chrome.storage.sync.set( this.getJSON(), () => {
    } );
};

module.exports = function( cb ) {
    chrome.storage.sync.get( null, ( object ) => {
        cb( new Percy_Proxy_Config( object ) );
    } );
};
