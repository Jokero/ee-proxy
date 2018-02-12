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
        this._user.on('message', () => console.log('message', message));
        this._user.on('command', () => console.log('command', message));
    }

    _onUserLeft() {
        console.log('User left the game');
        this._user.stopListening(); // removes only game listeners (for "message" and "command" events)
    }
}

const game = new Game(user);
game.start();

console.log(user.listenerCount('disconnect')); // 1
console.log(user.listenerCount('cancel')); // 1
console.log(user.listenerCount('message')); // 1
console.log(user.listenerCount('command')); // 1

user.emit('cancel');

console.log(user.listenerCount('disconnect')); // 1
console.log(user.listenerCount('cancel')); // 0
console.log(user.listenerCount('message')); // 0
console.log(user.listenerCount('command')); // 0