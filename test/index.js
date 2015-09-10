'use strict';

var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));

global.expect = chai.expect;
global.sinon = sinon;
