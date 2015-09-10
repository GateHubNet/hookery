# Hookery

Wtf, is this hookery in distributed manner with some rabbits and events?"

## Description

Hookery is a simple distributed event emmiter library with nodejs.

## Features

- Support for multiple backends: `rabbitmq`


## Usage

```
var Hookery = require('hookery');
var RabbitMQ = Hookery.RabbitMQ;

function Bunny(msg) {
  this.msg = msg;
}

Bunny.prototype.play = function() {
  console.log(this.name + ' is doing well');
  this.msg.ack();
}

var rabbit = new Hookery.RabbitMQ();

var hook = new Hookery();
hook.to(rabbit.exchange('bunnies').durable().key('bunnies.*'));
hook.from(rabbit.queue('bunnies').bindTo('bunnies').cast(Bunny));

hook.on('bunnies.{name}.info', function(name, bunny) {
  bunny.play();
});

hook.on('error', function(err) {
  console.log(err);
});

hook.emit('bunnies.holly.info', {'hair': 'blonde', 'height': 1.7, 'braSize': '32D' })
```
