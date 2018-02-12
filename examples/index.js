const EventEmitter = require('events');
const emitterProxy = require('ee-proxy');

const user = new EventEmitter();
user.once('disconnect', () => console.log('User disconnected'));

class Game {
    constructor(user) {
        this._user = emitterProxy(user);
        this._user.once('cancel', () => this._onUserLeft());
    }

    start() {
        this._user.on('message', message => console.log('message', message));
        this._user.on('command', command => console.log('command', command));
    }

    _onUserLeft() {
        console.log('User left the game');
        this._user.stopListening(); // removes only game listeners (for "message" and "command" events)
    }
}

const game = new Game(user);
game.start();

console.log(user.eventNames());
user.emit('cancel');
console.log(user.eventNames());