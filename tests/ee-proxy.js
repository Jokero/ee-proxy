'use strict';

const EventEmitter = require('events');
const emitterProxy = require('../lib/ee-proxy');
const expect = require('chai').expect;

describe('ee-proxy', function() {
    it('works with example from readme', function() {
        const user = new EventEmitter();
        user.once('disconnect', () => {});

        class Game extends EventEmitter {
            constructor(user) {
                super();
                this._user = emitterProxy(user);
                this._user.once('game:cancel', () => this._onUserLeft());
                this._user.once('disconnect', () => this._onUserLeft());
            }

            start() {
                this._user.on('game:message', () => {});
                this._user.on('game:command', () => {});
            }

            _onUserLeft() {
                this._user.stopListening(); // removes only game listeners (for "message" and "command" events)
                this.emit('canceled');
            }
        }

        const game = new Game(user);
        game.start();

        expect(user.listenerCount('disconnect')).to.equal(2);
        expect(user.listenerCount('game:cancel')).to.equal(1);
        expect(user.listenerCount('game:message')).to.equal(1);
        expect(user.listenerCount('game:command')).to.equal(1);

        game.once('canceled', () => {
            expect(user.listenerCount('disconnect')).to.equal(1);
            expect(user.listenerCount('game:cancel')).to.equal(0);
            expect(user.listenerCount('game:message')).to.equal(0);
            expect(user.listenerCount('game:command')).to.equal(0);
        });

        user.emit('game:cancel');
    });

    it('does not prevent removing of already existent listener', function() {
        const user = new EventEmitter();

        const messageListener = () => {};
        user.on('message', messageListener);

        const wrappedUser = emitterProxy(user);

        expect(user.listenerCount('message')).to.equal(1);
        wrappedUser.removeListener('message', messageListener);
        expect(user.listenerCount('message')).to.equal(0);
    });

    it('stops listening of all events when stopListeningAfterFirstEvent=true', function() {
        const user = new EventEmitter();
        user.once('disconnect', () => {});

        const wrappedUser = emitterProxy(user, { stopListeningAfterFirstEvent: true });
        wrappedUser.once('game:start', () => {});
        wrappedUser.once('game:cancel', () => {});
        wrappedUser.once('disconnect', () => {});

        user.emit('game:cancel');

        expect(user.listenerCount('disconnect')).to.equal(1);
        expect(user.listenerCount('game:start')).to.equal(0);
        expect(user.listenerCount('game:cancel')).to.equal(0);
    });

    it('allows to stop listening of several events at once', function() {
        const user = new EventEmitter();

        const wrappedUser = emitterProxy(user);
        wrappedUser.once('game:start', () => {});
        wrappedUser.once('game:cancel', () => {});

        wrappedUser.stopListening('game:start', 'game:cancel');

        expect(user.listenerCount('game:start')).to.equal(0);
        expect(user.listenerCount('game:cancel')).to.equal(0);
    });

    it('sets "this" value of called listener to the proxy instance', function() {
        const user = new EventEmitter();
        const wrappedUser = emitterProxy(user);

        wrappedUser.once('game:start', function() {
            expect(this).to.equal(wrappedUser);
        });

        wrappedUser.emit('game:start');
    });
});