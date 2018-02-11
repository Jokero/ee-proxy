'use strict';

const EventEmitter = require('events');
const emitterProxy = require('..');
const expect = require('chai').expect;

describe('ee-proxy', function() {
    it('works with example from readme', function() {
        const user = new EventEmitter();
        user.once('disconnect', () => {});

        class Game {
            constructor(user) {
                this._user = emitterProxy(user);
                this._user.once('cancel', () => this._onUserLeft());
            }

            start() {
                this._user.on('message', () => {});
                this._user.on('command', () => {});
            }

            _onUserLeft() {
                this._user.stopListening(); // removes only game listeners (for "message" and "command" events)
            }
        }

        const game = new Game(user);
        game.start();

        expect(user.listenerCount('disconnect')).to.equal(1);
        expect(user.listenerCount('cancel')).to.equal(1);
        expect(user.listenerCount('message')).to.equal(1);
        expect(user.listenerCount('command')).to.equal(1);

        user.emit('cancel');

        expect(user.listenerCount('disconnect')).to.equal(1);
        expect(user.listenerCount('cancel')).to.equal(0);
        expect(user.listenerCount('message')).to.equal(0);
        expect(user.listenerCount('command')).to.equal(0);
    });
});