'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var REMOVE_METHOD = 'stopListening';
var ADD_LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];
var REMOVE_LISTENER_METHODS = ['off', 'removeListener', 'removeAllListeners'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {string}         [options.removeMethod]
 * @param {string[]}       [options.addListenerMethods]
 * @param {string[]}       [options.removeListenerMethods]
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

    // needed for polyfill, because it should know about all properties at creation time
    var fieldsForPolyfill = [].concat(_toConsumableArray(polyfillFields), [removeMethod]);
    fieldsForPolyfill.forEach(function (field) {
        if (!emitter.hasOwnProperty(field)) {
            emitter[field] = {};
        }
    });

    /**
     * @type {{ eventName: string, listener: Function }[]}
     */
    var events = [];

    var stopListening = function stopListening() {
        var eventName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

        events = events.filter(function (event) {
            if (!eventName || event.eventName === eventName) {
                emitter.removeListener(event.eventName, event.listener);
                return false;
            }
            return true;
        });
    };

    return new Proxy(emitter, {
        get: function get(emitter, property, proxy) {
            if (property === removeMethod) {
                return function (eventName) {
                    stopListening(eventName);
                    return proxy;
                };
            }

            if (addListenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function && emitter[property].length >= 2) {
                return function (eventName, listener) {
                    for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                        rest[_key - 2] = arguments[_key];
                    }

                    events.push({ eventName: eventName, listener: listener });
                    emitter[property].apply(emitter, [eventName, listener].concat(rest));
                    return proxy;
                };
            }

            if (removeListenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function) {
                return function (eventName, listener) {
                    for (var _len2 = arguments.length, rest = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                        rest[_key2 - 2] = arguments[_key2];
                    }

                    events = events.filter(function (event) {
                        return event.eventName !== eventName || listener && event.listener !== listener;
                    });
                    emitter[property].apply(emitter, [eventName, listener].concat(rest));
                    return proxy;
                };
            }

            return emitter[property];
        }
    });
};