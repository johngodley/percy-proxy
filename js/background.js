"use strict";

let Percy_HTTP_Auth = require( './percy-http-auth' );
let Percy_Proxy = require( './percy-proxy' );
let Config = require( './config' );

Config( ( config ) => {
	let proxy = new Percy_Proxy( config );
	let auth = new Percy_HTTP_Auth( config );

	auth.start();
	proxy.start();
} );
