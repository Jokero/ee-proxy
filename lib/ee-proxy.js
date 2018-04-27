'use strict';

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

    var removeMethod = options && options.removeMethod ? options.removeMethod : REMOVE_METHOD;
    var addListenerMethods = options && options.addListenerMethods ? options.addListenerMethods : ADD_LISTENER_METHODS;
    var removeListenerMethods = options && options.removeListenerMethods ? options.removeListenerMethods : REMOVE_LISTENER_METHODS;

    var events = [];

    // needed for polyfill, because it should know about all properties at creation time
    var fieldsForPolyfill = (options.fields || []).concat(removeMethod);
    fieldsForPolyfill.forEach(function (field) {
        if (!emitter.hasOwnProperty(field)) {
            emitter[field] = {};
        }
    });

    return new Proxy(emitter, {
        get: function get(emitter, property, proxy) {
            if (property === removeMethod) {
                return function (eventName) {
                    events = events.filter(function (event) {
                        if (!eventName || event.eventName === eventName) {
                            emitter.removeListener(event.eventName, event.listener);
                            return false;
                        }
                        return true;
                    });
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