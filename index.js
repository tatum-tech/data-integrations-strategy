'use strict';
const { create, } = require('./lib/index');
const Promisie = require('promisie');

/**
 * Creates data integrations evaluators
 * @param {Object|Object[]} configurations A single configuration object or an array of configuration objects
 * @return {Object|Function} A single evaluator or an object containing evalutors indexed by name
 */
function generate(options, cb) {
  try {
    let evaluations;
    let { segments, module_name, integration, input_variables, output_variables, } = options;
    if (!Array.isArray(segments)) evaluations = create(segments, module_name, integration, input_variables, output_variables);
    else {
      evaluations = segments.reduce((result, configuration) => {
        result[configuration.name] = create(configuration, module_name, integration, input_variables, output_variables);
        return result;
      }, {});
    }
    return (typeof cb === 'function') ? cb(null, evaluations) : Promisie.resolve(evaluations);
  } catch (e) {
    return (typeof cb === 'function') ? cb(e) : Promisie.reject(e);
  }
}

module.exports = generate;
