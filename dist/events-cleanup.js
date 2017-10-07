(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.eventsCleanup = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var REMOVE_METHOD = 'stopListening';
var LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {string}         [options.removeMethod]
 * @param {string[]}       [options.listenerMethods]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
module.exports = function (emitter) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var removeMethod = options && options.removeMethod ? options.removeMethod : REMOVE_METHOD;
    var listenerMethods = options && options.listenerMethods ? options.listenerMethods : LISTENER_METHODS;

    var events = [];

    // needed for polyfill, because it should know about all properties at creation time
    if (!emitter[removeMethod]) {
        emitter[removeMethod] = function () {};
    }

    return new Proxy(emitter, {
        get: function get(emitter, property) {
            if (property === removeMethod) {
                return function (eventName) {
                    events = events.filter(function (event) {
                        if (!eventName || event.eventName === eventName) {
                            emitter.removeListener(event.eventName, event.listener);
                            return false;
                        }
                        return true;
                    });
                };
            }

            if (listenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function && emitter[property].length >= 2) {
                return function (eventName, listener) {
                    for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                        rest[_key - 2] = arguments[_key];
                    }

                    events.push({ eventName: eventName, listener: listener });
                    return emitter[property].apply(emitter, [eventName, listener].concat(rest));
                };
            }

            return emitter[property];
        }
    });
};
},{}]},{},[1])(1)
});