# ee-proxy

Event emitter proxy for easy local listeners cleanup

[![NPM version](https://img.shields.io/npm/v/ee-proxy.svg)](https://npmjs.org/package/ee-proxy)
[![Build status](https://img.shields.io/travis/Jokero/ee-proxy.svg)](https://travis-ci.org/Jokero/ee-proxy)

**Note:** This module works in browsers and Node.js >= 6.0. Use `Proxy` polyfill for Internet Explorer

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
    - `[removeMethod]` (string) - Name of the method for listeners cleanup (default - `stopListening`)
    - `[addListenerMethods]` (string[]) - Methods which are intercepted by `ee-proxy` for keeping attached to emitter listeners (default - `['on', 'once', 'addListener', 'prependListener', 'prependOnceListener', 'onceAny', 'onAny']`)
    - `[fields]` (string[]) - Option specially for `Proxy` polyfill (see [below](#polyfill))

#### Return value

(EventEmitter) - Proxy object (which is `!==` original emitter)

### Example

```js
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

console.log(user.listenerCount('disconnect')); // 1
console.log(user.listenerCount('cancel')); // 1
console.log(user.listenerCount('message')); // 1
console.log(user.listenerCount('command')); // 1

user.emit('cancel');

console.log(user.listenerCount('disconnect')); // 1
console.log(user.listenerCount('cancel')); // 0
console.log(user.listenerCount('message')); // 0
console.log(user.listenerCount('command')); // 0
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
    fields: 'something'
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