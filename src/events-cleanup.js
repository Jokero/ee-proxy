'use strict';

const REMOVE_METHOD = 'stopListening';
const LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {string}         [options.removeMethod]
 * @param {string[]}       [options.listenerMethods]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
module.exports = function(emitter, options={}) {
    const removeMethod = options && options.removeMethod ? options.removeMethod : REMOVE_METHOD;
    const listenerMethods = options && options.listenerMethods ? options.listenerMethods : LISTENER_METHODS;

    let events = [];

    // remove method should not be set to emitter, it's needed for polyfill
    emitter[removeMethod] = eventName => {
        events = events.filter(event => {
            if (!eventName || event.eventName === eventName) {
                emitter.removeListener(event.eventName, event.listener);
                return false;
            }
            return true;
        });
    };

    return new Proxy(emitter, {
        get(emitter, property) {
            if (listenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function) {
                return (eventName, listener, ...rest) => {
                    events.push({ eventName, listener });
                    return emitter[property].apply(emitter, [eventName, listener, ...rest]);
                };
            }

            return emitter[property];
        }
    });
};