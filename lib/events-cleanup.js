'use strict';

var LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {string[]]}      [options.methods]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
function wrap(emitter) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var listenerMethods = options && options.methods ? options.methods : LISTENER_METHODS;

    var events = [];

    var proxy = new Proxy(emitter, {
        get: function get(emitter, property) {
            if (listenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function) {
                return function (eventName, listener) {
                    events.push({ eventName: eventName, listener: listener });

                    for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                        rest[_key - 2] = arguments[_key];
                    }

                    return emitter[property].apply(emitter, [eventName, listener].concat(rest));
                };
            }

            return emitter[property];
        }
    });

    proxy.stopListening = function (eventName) {
        events = events.filter(function (event) {
            if (!eventName || event.eventName === eventName) {
                emitter.removeListener(name, event.listener);
                return false;
            }
            return true;
        });
    };

    return proxy;
}

module.exports = wrap;