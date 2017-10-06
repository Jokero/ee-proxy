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

    // remove method should not be set to emitter, it's needed for polyfill
    emitter[removeMethod] = function (eventName) {
        events = events.filter(function (event) {
            if (!eventName || event.eventName === eventName) {
                emitter.removeListener(event.eventName, event.listener);
                return false;
            }
            return true;
        });
    };

    return new Proxy(emitter, {
        get: function get(emitter, property) {
            if (listenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function) {
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