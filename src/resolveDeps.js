/* eslint-disable no-console */
const colors = require('./colors');

module.exports = (packageJSON, tagDeps) => {
  const existingDeps = packageJSON.devDependencies;

  if (!existingDeps) {
    console.log(
      colors.FgYellow,
      'No Dev Dependencies installed, installing all required dependencies.'
    );
    return Object.keys(tagDeps);
  }

  const installQueue = Object.keys(tagDeps).filter(dep =>
    existingDeps[dep] && existingDeps[dep] === tagDeps[dep]
      ? console.log(colors.FgYellow, `${dep} is installed, skipping.`)
      : dep
  );

  return installQueue;
};
