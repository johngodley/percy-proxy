"use strict";

var gulp = require( 'gulp' );
var browserify = require( 'browserify' );
var rename = require( 'gulp-rename' );
var babelify = require( 'babelify' );
var source = require( 'vinyl-source-stream' );

var backgroundName = 'backgroundscript.js';
var popupName = 'popup.js';

function getBuilder( src ) {
    var bundler = browserify( {
        debug: false,
        cache: {},
        packageCache: {},
        fullPaths: false,
        paths: [ './' ]
    } );

    bundler.transform( babelify ).require( src, { entry: true } );

    return bundler.bundle().pipe( source( src ) );
}

gulp.task( 'background', function() {
    var builder = getBuilder( 'js/background.js' );

    builder
        .pipe( rename( backgroundName ) )
        .pipe( gulp.dest( 'extension/' ) );
} );

gulp.task( 'popup', function() {
    var builder = getBuilder( 'js/popup.js' );

    builder
        .pipe( rename( popupName ) )
        .pipe( gulp.dest( 'extension/' ) );
} );

gulp.task( 'default', [ 'background', 'popup' ], function() {
} );
