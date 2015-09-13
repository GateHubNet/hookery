'use strict';

var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
chai.use(require('sinon-chai'));

global.expect = chai.expect;
global.sinon = sinon;
