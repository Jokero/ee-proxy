'use strict';

const EventEmitter = require('events');
const emitterProxy = require('..');
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

        user.emit('game:cancel');

        game.once('canceled', () => {
            expect(user.listenerCount('disconnect')).to.equal(1);
            expect(user.listenerCount('game:cancel')).to.equal(0);
            expect(user.listenerCount('game:message')).to.equal(0);
            expect(user.listenerCount('game:command')).to.equal(0);
        });
    });
});