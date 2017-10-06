'use strict';

const LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {string[]]}      [options.methods]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
function wrap(emitter, options={}) {
    const listenerMethods = options && options.methods ? options.methods : LISTENER_METHODS;

    let events = [];

    const proxy = new Proxy(emitter, {
        get(emitter, property) {
            if (listenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function) {
                return function(eventName, listener, ...rest) {
                    events.push({ eventName, listener });
                    return emitter[property].apply(emitter, [eventName, listener, ...rest]);
                };
            }

            return emitter[property];
        }
    });

    proxy.stopListening = function(eventName) {
        events = events.filter(event => {
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