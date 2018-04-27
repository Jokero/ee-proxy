'use strict';

const REMOVE_METHOD = 'stopListening';
const ADD_LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];
const REMOVE_LISTENER_METHODS = ['off', 'removeListener', 'removeAllListeners'];

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
module.exports = function(emitter, options={}) {
    const removeMethod = options && options.removeMethod ? options.removeMethod : REMOVE_METHOD;
    const addListenerMethods = options && options.addListenerMethods ? options.addListenerMethods : ADD_LISTENER_METHODS;
    const removeListenerMethods = options && options.removeListenerMethods ? options.removeListenerMethods : REMOVE_LISTENER_METHODS;

    let events = [];

    // needed for polyfill, because it should know about all properties at creation time
    const fieldsForPolyfill = (options.fields || []).concat(removeMethod);
    fieldsForPolyfill.forEach(field => {
        if (!emitter.hasOwnProperty(field)) {
            emitter[field] = {};
        }
    });

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

            if (addListenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function && emitter[property].length >= 2) {
                return (eventName, listener, ...rest) => {
                    events.push({ eventName, listener });
                    emitter[property].apply(emitter, [eventName, listener, ...rest]);
                    return proxy;
                };
            }

            if (removeListenerMethods.indexOf(property) !== -1 && emitter[property] instanceof Function) {
                return (eventName, listener, ...rest) => {
                    events = events.filter(event => event.eventName !== eventName || (listener && event.listener !== listener));
                    emitter[property].apply(emitter, [eventName, listener, ...rest]);
                    return proxy;
                };
            }

            return emitter[property];
        }
    });
};