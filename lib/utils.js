const fs = require('fs');
const yaml = require('js-yaml');
const handlebars = require('handlebars');

module.exports = {
  /*
   * Read file
   *
   * @param {string} fileAbsPath  absolute path to file
   * @returns {string} file content
   */
  readFile(fileAbsPath) {
    let content;
    try {
      content = fs.readFileSync(fileAbsPath, 'utf-8');
    } catch (err) {
      throw new Error(`could not read "${fileAbsPath}" file: ${err}`);
    }

    return content;
  },

  /**
   * Render handlebar template
   *
   * @param {string} template file content
   * @param {object} data object to render template
   * @returns {string} template rendered
   */
  renderTemplate(content, data) {
    let rendered;
    try {
      const compile = handlebars.compile(content);
      rendered = compile(data);
    } catch (err) {
      throw new Error(`could not render "${content}" template: ${err}`);
    }

    return rendered;
  },

  /**
   * Parse string content to yaml object
   *
   * @param {string} yaml string content
   * @returns {object} js yml rendered
   */
  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["yamlLoad"] }] */
  yamlLoad(content) {
    let ymlObject;
    try {
      ymlObject = yaml.safeLoad(content);
    } catch (err) {
      throw new Error(`invalid yaml content "${content}": ${err}`);
    }

    return ymlObject;
  },
};