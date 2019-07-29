'use strict';

const chai = require('chai');
const expect = chai.expect;
const Promisie = require('promisie');
const MOCKS = require('../mocks');
const path = require('path');
const GENERATE = require(path.join(__dirname, '../../index'));
chai.use(require('chai-spies'));

describe('evaluators', function () {
  describe('handling errors in evaluator', function () {
    it('should handle an error when a callback is passed', done => {
      GENERATE({ segment: null, }, (_, evaluator) => {
        evaluator({})
          .then(result => {
            expect(result).to.have.property('error');
            done();
          })
          .catch(e => {
            done(e);
          });
      });
    });
    it('should return a function when no callback is passed', done => {
      GENERATE({ segments: null, })
        .then(evaluator => {
          expect(evaluator).to.be.a('function');
          done();
        })
        .catch(e => {
          done(e);
        });
    });
  });
});