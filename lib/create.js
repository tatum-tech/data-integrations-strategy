'use strict';
const vm = require('vm');
const Promisie = require('promisie');
const deasync = require('deasync');
const DI = require('@digifi-los/data-integrations-core');

/**
 * Creates an evaluator function
 * @param {Object} segment Configuration details for script and context of a vm that will be evaluated
 * @param {boolean} numeric If true percision evalutions will be performed on all numerical comparisons (uses the numeric npm package)
 * @return {Function} Segment evaluator function
 */
function createEvaluator(segment, module_name, integration = {}, input_variables, output_variables) {
  let script = [
    '"use strict"',
    '_global.passes = [];',
    '_global.rule_results = [];',
    '_global.output_types = {};',
    'let evaluation_result;',
    '_global.passes = _global.passes.indexOf(false) === -1',
  ].join('\r\n');
  let dataintegration = Object.assign({}, integration.credentials, {
    certicate_required: integration.require_security_cert,
  }, { data_provider: integration.data_provider, }, integration);
  /**
   * Evaluates current state against the defined segment rules
   * @param {state} state State data used in evaluation of segment
   * @return {Object} returns the an object with a "passed" flag as well as a reporting object with individual pass/fail flags for each defined condition
   */
  return function evaluator(state) {
    let _state;
    let context;
    let evaluate;
    let result;
    try {
      _state = Object.assign({}, state);
      context = vm.createContext({ _global: { state: _state, }, });
      evaluate = new vm.Script(script);
      evaluate.runInContext(context);
      
      if (context._global.passes) {
        let finished = false;
        let DI_Data;
        DI({ dataintegration, state, segment, input_variables, output_variables, })
          .then(resp => {
            DI_Data = resp;
            finished = true;
          })
          .catch(err => {
            DI_Data = err;
            finished = true;
          });
        deasync.loopWhile(() => {
          return !finished; 
        });
        result = {
          type: 'Data Integration',
          passed: context._global.passes,
          output: DI_Data.result || {},
          raw: DI_Data.response || '',
          name: module_name || '',
          segment: segment.name,
          status: DI_Data.status,
          provider: dataintegration.data_provider,
          rules: context._global.rule_results
        };
      } else {
        result = {
          type: 'Data Integration',
          passed: false,
          name: module_name || '',
          segment: segment.name,
          rules: context._global.rule_results
        };
      }
      if (segment.sync === true) return result;
      return Promisie.resolve(result); 
    } catch (e) {
      state.error = {
        code: '',
        message: e.message,
      };
      if (segment && segment.sync === true) return { error: e.message, result, };
      return Promisie.resolve({ error: e.message, result, });
    }
  };
}

module.exports = createEvaluator;