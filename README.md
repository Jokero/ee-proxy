# ee-proxy

Event emitter proxy for easy local listeners cleanup

[![NPM version](https://img.shields.io/npm/v/ee-proxy.svg)](https://npmjs.org/package/ee-proxy)
[![Build status](https://img.shields.io/travis/Jokero/ee-proxy.svg)](https://travis-ci.org/Jokero/ee-proxy)

**Note:** This module works in browsers and Node.js >= 6.0. Use `Proxy` and `Array` polyfills for Internet Explorer

## Table of Contents

- [Demo](#demo)
- [Installation](#installation)
  - [Node.js](#nodejs)
  - [Browser](#browser)
- [Overview](#overview)
- [Usage](#usage)
  - [emitterProxy(object, [options])](#emitterProxy-object-options)
    - [Parameters](#parameters)
    - [Return value](#return-value)
  - [Example](#example)
  - [Polyfill](#polyfill)
- [Build](#build)
- [Tests](#tests)
- [License](#license)

## Demo

Try [demo](https://runkit.com/npm/ee-proxy) on RunKit.

## Installation

```sh
npm install ee-proxy
```

### Node.js
```js
const emitterProxy = require('ee-proxy');
```

### Browser
```
<script src="node_modules/ee-proxy/dist/ee-proxy.js">
```
or minified version
```
<script src="node_modules/ee-proxy/dist/ee-proxy.min.js">
```

You can use the module with AMD/CommonJS or just use `window.emitterProxy`.

## Overview

`ee-proxy` allows you to easily and safely remove listeners attached to event emitter without touching listeners added in other pieces of code.
Unlike other similar modules (for example, [ultron](https://www.npmjs.com/package/ultron)) this one works seamlessly and allows to call your custom methods on event emitter:

```js
const emitterProxy = require('ee-proxy');
const EventEmitter = require('events');

class Game extends EventEmitter {
    start() {
        console.log('Game started');
    }
}

const game = emitterProxy(new Game());
game.start(); // Game started

console.log(game instanceof EventEmitter); // true
console.log(game instanceof Game); // true
```

## Usage

### emitterProxy(emitter, [options])

#### Parameters

- `emitter` (EventEmitter)
- `[options]` (Object)
    - `[stopListeningAfterFirstEvent]` (boolean) - If `true`, `ee-proxy` removes all listeners attached to the wrapped emitter when first event is triggered (might be useful in some cases)
    - `[removeMethod]` (string) - Name of the method for listeners cleanup (default - `stopListening`)
    - `[addListenerMethods]` (string[]) - Methods which are intercepted by `ee-proxy` for keeping attached to emitter listeners (default - `['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny']`)
    - `[fields]` (string[]) - Option specially for `Proxy` polyfill (see [below](#polyfill))

#### Return value

(EventEmitter) - Proxy object (which is `!==` original emitter)

```js
const user = new EventEmitter();
user.once('disconnect', () => console.log('User disconnected'));

const wrappedUser = emitterProxy(user);
wrappedUser.once('game:start', () => console.log('User is ready to start the game'));
wrappedUser.once('game:cancel', () => console.log('User cancelled the game'));
wrappedUser.once('disconnect', () => console.log('User disconnected'));

wrappedUser.stopListening(); // removes all attached to the wrapped emitter listeners
console.log(user.listenerCount('disconnect')); // 1

// wrappedUser.stopListening('game:start'); // you can specify a particular event
// wrappedUser.stopListening('game:start', 'game:cancel'); // or even list several events
```

### Examples

#### Basic example

```js
const EventEmitter = require('events');
const emitterProxy = require('ee-proxy');

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

console.log(user.listenerCount('disconnect')); // 2
console.log(user.listenerCount('game:cancel')); // 1
console.log(user.listenerCount('game:message')); // 1
console.log(user.listenerCount('game:command')); // 1

game.once('canceled', () => {
    console.log(user.listenerCount('disconnect')); // 1
    console.log(user.listenerCount('game:cancel')); // 0
    console.log(user.listenerCount('game:message')); // 0
    console.log(user.listenerCount('game:command')); // 0
});

user.emit('game:cancel');
```

#### Using of "stopListeningAfterFirstEvent" option

Sometimes you may need to listen to several events and you want to react only on first one.
For example, your user can have a choice: to start the game, to cancel it or the user can even disconnect.
In that case you can call `stopListening()` in every event listener but it's much easier just to set `stopListeningAfterFirstEvent=true`:

```js
const user = new EventEmitter();
user.once('disconnect', () => console.log('User disconnected'));

const wrappedUser = emitterProxy(user, { stopListeningAfterFirstEvent: true });
wrappedUser.once('game:start', () => console.log('User is ready to start the game'));
wrappedUser.once('game:cancel', () => console.log('User cancelled the game'));
wrappedUser.once('disconnect', () => console.log('User disconnected'));

user.emit('game:cancel');

console.log(user.listenerCount('disconnect')); // 1
console.log(user.listenerCount('game:start')); // 0
console.log(user.listenerCount('game:cancel')); // 0
```

### Polyfill

Internet Explorer and some other outdated browsers don't support `Proxy` (see [caniuse](https://caniuse.com/#search=proxy)). In this case you can use [polyfill](https://github.com/GoogleChrome/proxy-polyfill).
But keep in mind that all emitter properties you will use **must be known at proxy creation time** because polyfill seals an emitter object, preventing new properties from being added to it. But you can workaround it by using `fields` option:

```js
const emitterProxy = require('ee-proxy');
const EventEmitter = require('events');

class Game extends EventEmitter {
    start() {
        console.log('Game started');
    }
}

const game = emitterProxy(new Game(), {
    fields: ['something']
});
game.something = '123456';
```

## Build

```sh
npm install
npm run build
```

## Tests

```sh
npm install
npm test
```

## License

[MIT](LICENSE)