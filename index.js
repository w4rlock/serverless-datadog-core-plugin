const _ = require('lodash');
const R = require('ramda');
const path = require('path');
const slsIamFnRolePlugin = require('serverless-iam-roles-per-function');
const utils = require('./lib/utils.js');

const LOG_PREFFIX = '[ServerlessDatadogPlugin] - ';

const DD_FN_ID = 'DatadogLogForward';
const DD_FN_YML_PATH = 'resources/datadog.yml.tpl';
const DD_USR_CONF = 'datadogLogForward';
const DD_ZIP_PATH = 'resources/aws-dd-forwarder-3.5.0.zip';

class ServerlessDatadogPlugin {
  /**
   * Default serverless constructor
   *
   * @param {object} serverless serverless instance
   * @param {object} options command line arguments
   */
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.pluginPath = __dirname;

    const disabled = this.getConfValue(`${DD_USR_CONF}.disabled`, false);
    if (disabled) {
      this.log('plugin disabled');
      return;
    }

    this.hooks = {
      'after:package:initialize': this.injectResources.bind(this),
    };

    this.serverless.pluginManager.addPlugin(slsIamFnRolePlugin);
  }

  /**
   * Load user config rendered
   *
   */
  loadUserConfig() {
    this.cfg = {};
    this.cfg.apiKey = this.getConfValue(`${DD_USR_CONF}.apiKey`);
    this.cfg.bucket = this.getConfValue(`${DD_USR_CONF}.bucket`);
    this.cfg.functionName = this.getConfValue(`${DD_USR_CONF}.functionName`);
    this.cfg.extendsFn = this.getConfValue(
      `${DD_USR_CONF}.extendsFn`,
      false,
      {}
    );
  }

  /**
   * Log to stdout
   *
   * @param {object|string} entity to log
   */
  log(entity) {
    const str = R.when(R.is(Object), JSON.stringify, entity);
    this.serverless.cli.log(`${LOG_PREFFIX} ${str}`);
  }

  /**
   * Get multiprovider configuration
   *
   * @param {string} key configuration key
   * @param {boolean} required=true if value is null throw a error
   * @param {string|object} defaultValue=undefined defaultValue value to return
   * @returns {string} configuration value
   */
  getConfValue(key, required = true, defaultValue = undefined) {
    const fromEnv = (k) => process.env[k];
    const fromCmdArg = (k) => this.options[k];
    const fromYaml = (k) => _.get(this.serverless, `service.custom.${k}`);
    /* eslint no-underscore-dangle: ["error", { "allow": ["__"] }] */
    const replaceDot = R.replace(/\./g, R.__);

    let k = replaceDot('-')(key);
    let val = fromCmdArg(k);
    if (val) return val;

    k = replaceDot('_')(key);
    val = fromEnv(k.toUpperCase());
    if (val) return val;

    k = key;
    val = fromYaml(k);
    if (val) return val;

    if (required && !defaultValue) {
      throw new Error(
        `property value for "${key}" is missing.
       check in serverless.yml\n\t custom:\n\t   ${k}`
      );
    }

    return defaultValue;
  }

  /**
   * Is necessary inject resources before package initialize.. to render
   * cloud formation
   *
   */
  injectResources() {
    this.prepareFunction();
  }

  /**
   * Inject datadog template function in serverless functions
   * this function allow override
   * @returns {object} datadog function
   *
   */
  prepareFunction() {
    // call there to get resolved serverless variables
    this.loadUserConfig();
    const datadogResource = this.getTemplateObject(DD_FN_YML_PATH, this.cfg);
    const fnLogForward = _.get(datadogResource, `functions.${DD_FN_ID}`);

    if (_.isEmpty(fnLogForward)) {
      throw new Error(
        `template "${DD_FN_YML_PATH}" should has a "${DD_FN_ID}" tag`
      );
    }

    this.updatePackageArtifact(fnLogForward);

    // merge base function with user function
    _.merge(fnLogForward, this.cfg.extendsFn);
    _.merge(this.serverless.service, datadogResource);
  }

  /**
   * Update artifact zip with python lambda handler code
   *
   * @param {object} yml function object
   */
  updatePackageArtifact(fn) {
    const datadogLambdaZip = path.join(this.pluginPath, DD_ZIP_PATH);
    // safe path setter
    _.set(fn, 'package.artifact', datadogLambdaZip);
  }

  /**
   * Render yml handlebar template
   *
   * @param {string} filePath relative path to template
   * @param {object} data data source to render template
   * @returns {object} obj rendered
   */
  getTemplateObject(filePath, data) {
    const fileAbsPath = path.resolve(this.pluginPath, filePath);
    const fileContent = utils.readFile(fileAbsPath);
    const template = utils.renderTemplate(fileContent, data);
    const ymlContent = utils.yamlLoad(template);

    return ymlContent;
  }
}

module.exports = ServerlessDatadogPlugin;
