'use strict';

const REMOVE_METHOD = 'stopListening';
const LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {string}         [options.removeMethod]
 * @param {string[]}       [options.listenerMethods]
 * @param {string[]}       [options.fields=[]]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
module.exports = function(emitter, options={}) {
    const removeMethod = options && options.removeMethod ? options.removeMethod : REMOVE_METHOD;
    const listenerMethods = options && options.listenerMethods ? options.listenerMethods : LISTENER_METHODS;

    let events = [];

    // needed for polyfill, because it should know about all properties at creation time
    if (!emitter[removeMethod]) {
        emitter[removeMethod] = () => {};
    }

    const fieldsForPolyfill = options.fields || [];
    fieldsForPolyfill.forEach(field => emitter[field] = {});

    return new Proxy(emitter, {
        get(emitter, property, proxy) {
            if (property === removeMethod) {
                return eventName => {
                    events = events.filter(event => {
                        if (!eventName || event.eventName === eventName) {
                            emitter.removeListener(event.eventName, event.listener);
                            return false;
                        }
                        return true;
                    });
                    return proxy;
                };
            }

            if (listenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function && emitter[property].length >= 2) {
                return (eventName, listener, ...rest) => {
                    events.push({ eventName, listener });
                    emitter[property].apply(emitter, [eventName, listener, ...rest]);
                    return proxy;
                };
            }

            return emitter[property];
        }
    });
};