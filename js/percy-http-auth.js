/* global chrome */
"use strict";

let Percy_HTTP_Auth = function( config ) {
	this.config = config;
};

Percy_HTTP_Auth.prototype.start = function() {
	// Listen for HTTP basic auth requests
	chrome.webRequest.onAuthRequired.addListener( this.onAuthRequired.bind( this ), { urls: [ "<all_urls>" ] }, [ 'blocking' ] );
};

/**
 * Test if a server/port is in a list. Checks both server on its own, and server:port together
 */
Percy_HTTP_Auth.prototype.isKnownHost = function( host, port ) {
	let safe = this.config.getSafeUrls();

	for ( let x = 0; x < safe.length; x++ ) {
		if ( host === safe[x] || ( host + ':' + port === safe[x] ) )
			return true;
	}

	return false;
};

Percy_HTTP_Auth.prototype.onAuthRequired = function( details ) {
	// Is it one of our safe known servers?
	if ( this.isKnownHost( details.challenger.host, details.challenger.port ) )
		return {};

	// Not a known safe server. Alert the user
	if ( confirm( this.getAuthMessage( details ) ) ) {
		this.addKnownServer( details.challenger.host, details.challenger.port );
		return {};   // Let it fall through to the standard auth prompt
	}

	// Return a cancel message
	return {
		cancel: true
	};
};

Percy_HTTP_Auth.prototype.getAuthMessage = function( details ) {
	let message = "WARNING! A request was made to authorize an unknown server.\n\n";

	message += "Request: " + details.url + "\n";
	message += "Server: " + details.challenger.host + ':' + details.challenger.port + "\n\n";

	if ( details.realm )
		message += "Message: " + details.realm + "\n\n";

	message += "Only confirm if you are sure this is a safe server.";
	return message;
};

Percy_HTTP_Auth.prototype.addKnownServer = function( host, port ) {
	this.config.addSafeUrl( host + ':' + port );
	this.config.save();
};

module.exports = Percy_HTTP_Auth;
