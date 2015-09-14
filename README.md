# Hookery

Wtf, is this hookery?

## Description

Hookery is a simple distributed event emmiter library with nodejs.

[API docs](http://gatehubnet.github.io/hookery/)

## Features

- Multiple message source
- Multiple message sinks
- Smart hooks
- Support for multiple message passing backends: `ampq`

## Usage

```
var Hookery = require('hookery');
var Ampq = Hookery.Ampq;

function Bunny(msg) {
  this.msg = msg;
}

Bunny.prototype.play = function() {
  console.log(this.name + ' is doing well');
  this.msg.ack();
}

var ampq = new Hookery.Ampq();

var hook = new Hookery();
hook.to(ampq.exchange('bunnies').durable().key('bunnies.*'));
hook.from(ampq.queue('bunnies').bindTo('bunnies').cast(Bunny));

hook.on('bunnies.{name}.info', function(name, bunny) {
  bunny.play();
});

hook.on('error', function(err) {
  console.log(err);
});

hook.emit('bunnies.holly.info', {'hair': 'blonde', 'height': 1.7, 'braSize': '32D' })
```
