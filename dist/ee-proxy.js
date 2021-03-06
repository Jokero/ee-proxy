(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.emitterProxy = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var REMOVE_METHOD = 'stopListening';
var ADD_LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'addEventListener', 'onceAny', 'onAny'];
var REMOVE_LISTENER_METHODS = ['off', 'removeListener', 'removeAllListeners', 'removeEventListener'];
var REMOVE_ONE_LISTENER_METHODS = ['removeListener', 'removeEventListener', 'off'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {boolean}        [options.stopListeningAfterFirstEvent]
 * @param {string}         [options.removeMethod]
 * @param {string[]}       [options.addListenerMethods]
 * @param {string[]}       [options.removeListenerMethods]
 * @param {string}         [options.removeOneListenerMethod]
 * @param {string[]}       [options.fields=[]]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
module.exports = function (emitter) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var removeMethod = options.removeMethod || REMOVE_METHOD;
    var addListenerMethods = options.addListenerMethods || ADD_LISTENER_METHODS;
    var removeListenerMethods = options.removeListenerMethods || REMOVE_LISTENER_METHODS;
    var polyfillFields = options.fields || [];
    var stopListeningAfterFirstEvent = options.hasOwnProperty('stopListeningAfterFirstEvent') ? options.stopListeningAfterFirstEvent : false;
    var removeOneListenerMethod = options.removeOneListenerMethod || REMOVE_ONE_LISTENER_METHODS.find(function (method) {
        return emitter[method] instanceof Function;
    });

    // needed for polyfill, because it should know about all properties at creation time
    var fieldsForPolyfill = [].concat(_toConsumableArray(polyfillFields), [removeMethod]);
    fieldsForPolyfill.forEach(function (field) {
        if (!emitter.hasOwnProperty(field)) {
            emitter[field] = {};
        }
    });

    /**
     * @type {{ eventName: string, userListener: Function, realListener: Function }[]}
     */
    var eventListeners = [];

    var stopListening = function stopListening() {
        for (var _len = arguments.length, eventsNames = Array(_len), _key = 0; _key < _len; _key++) {
            eventsNames[_key] = arguments[_key];
        }

        eventListeners = eventListeners.filter(function (listener) {
            if (!eventsNames.length || eventsNames.includes(listener.eventName)) {
                emitter[removeOneListenerMethod](listener.eventName, listener.realListener);
                return false;
            }
            return true;
        });
    };

    return new Proxy(emitter, {
        get: function get(emitter, property, proxy) {
            if (property === removeMethod) {
                return function () {
                    stopListening.apply(undefined, arguments);
                    return proxy;
                };
            }

            if (addListenerMethods.includes(property) && emitter[property] instanceof Function && emitter[property].length >= 2) {
                return function (eventName, userListener) {
                    for (var _len2 = arguments.length, rest = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                        rest[_key2 - 2] = arguments[_key2];
                    }

                    var realListener = !stopListeningAfterFirstEvent ? userListener.bind(proxy) : function () {
                        stopListening();

                        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                            args[_key3] = arguments[_key3];
                        }

                        return userListener.call.apply(userListener, [proxy].concat(args));
                    };

                    eventListeners.push({ eventName: eventName, userListener: userListener, realListener: realListener });
                    emitter[property].apply(emitter, [eventName, realListener].concat(rest));
                    return proxy;
                };
            }

            if (removeListenerMethods.includes(property) && emitter[property] instanceof Function) {
                return function (eventName, userListener) {
                    for (var _len4 = arguments.length, rest = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
                        rest[_key4 - 2] = arguments[_key4];
                    }

                    var eventListener = eventListeners.find(function (listener) {
                        return listener.userListener === userListener;
                    });
                    var realListener = eventListener ? eventListener.realListener : userListener;

                    eventListeners = eventListeners.filter(function (listener) {
                        return listener.eventName !== eventName || userListener && listener.userListener !== userListener;
                    });

                    emitter[property].apply(emitter, [eventName, realListener].concat(rest));
                    return proxy;
                };
            }

            if (emitter[property] instanceof Function) {
                return emitter[property].bind(emitter);
            }

            return emitter[property];
        }
    });
};
},{}]},{},[1])(1)
});
