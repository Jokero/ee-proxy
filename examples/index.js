const EventEmitter = require('events');
const emitterProxy = require('../lib/ee-proxy');

const user = new EventEmitter();
user.once('disconnect', () => console.log('User disconnected'));

class Game extends EventEmitter {
    constructor(user) {
        super();
        this._user = emitterProxy(user);
        this._user.once('game:cancel', () => this._onUserLeft());
        this._user.once('disconnect', () => this._onUserLeft());
    }

    start() {
        this._user.on('game:message', message => console.log('game:message', message));
        this._user.on('game:command', command => console.log('game:command', command));
    }

    _onUserLeft() {
        console.log('User left the game');
        this._user.stopListening(); // removes only game listeners ("game:message" and "game:command" events)
        this.emit('canceled');
    }
}

const game = new Game(user);
game.start();

console.log(user.eventNames());
game.once('canceled', () => {
    console.log(user.eventNames());
});

user.emit('game:cancel');