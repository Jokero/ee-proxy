'use strict';

const REMOVE_METHOD = 'stopListening';
const ADD_LISTENER_METHODS = ['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny'];
const REMOVE_LISTENER_METHODS = ['off', 'removeListener', 'removeAllListeners'];

/**
 * @param {EventEmitter} emitter
 * @param {Object}       [options={}]
 * @param {boolean}        [options.stopListeningAfterFirstEvent]
 * @param {string}         [options.removeMethod]
 * @param {string[]}       [options.addListenerMethods]
 * @param {string[]}       [options.removeListenerMethods]
 * @param {string[]}       [options.fields=[]]
 *
 * @return {EventEmitter} - Proxied event emitter
 */
module.exports = function(emitter, options={}) {
    const removeMethod = options.removeMethod || REMOVE_METHOD;
    const addListenerMethods = options.addListenerMethods || ADD_LISTENER_METHODS;
    const removeListenerMethods = options.removeListenerMethods || REMOVE_LISTENER_METHODS;
    const polyfillFields = options.fields || [];
    const stopListeningAfterFirstEvent = options.hasOwnProperty('stopListeningAfterFirstEvent')
        ? options.stopListeningAfterFirstEvent
        : false;

    // needed for polyfill, because it should know about all properties at creation time
    const fieldsForPolyfill = [...polyfillFields, removeMethod];
    fieldsForPolyfill.forEach(field => {
        if (!emitter.hasOwnProperty(field)) {
            emitter[field] = {};
        }
    });

    /**
     * @type {{ eventName: string, userListener: Function, realListener: Function }[]}
     */
    let eventListeners = [];

    const stopListening = function(...eventsNames) {
        eventListeners = eventListeners.filter(listener => {
            if (!eventsNames.length || eventsNames.includes(listener.eventName)) {
                emitter.removeListener(listener.eventName, listener.realListener);
                return false;
            }
            return true;
        });
    };

    return new Proxy(emitter, {
        get(emitter, property, proxy) {
            if (property === removeMethod) {
                return (...eventsNames) => {
                    stopListening(...eventsNames);
                    return proxy;
                };
            }

            if (addListenerMethods.includes(property)
                && emitter[property] instanceof Function && emitter[property].length >= 2) {
                return (eventName, userListener, ...rest) => {
                    const realListener = !stopListeningAfterFirstEvent ? userListener : function(...args) {
                        stopListening();
                        return userListener.call(this, ...args);
                    };

                    eventListeners.push({ eventName, userListener, realListener });
                    emitter[property](eventName, realListener, ...rest);
                    return proxy;
                };
            }

            if (removeListenerMethods.includes(property) && emitter[property] instanceof Function) {
                return (eventName, userListener, ...rest) => {
                    const eventListener = eventListeners.find(listener => listener.userListener === userListener);
                    const realListener = eventListener ? eventListener.realListener : userListener;

                    eventListeners = eventListeners.filter(listener =>
                        listener.eventName !== eventName || (userListener && listener.userListener !== userListener)
                    );

                    emitter[property](eventName, realListener, ...rest);
                    return proxy;
                };
            }

            return emitter[property];
        }
    });
};