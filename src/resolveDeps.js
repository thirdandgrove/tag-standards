const colors = require('./colors');

const tagDeps = Object.keys(require('../package.json').devDependencies);

module.exports = packageJSON => {
  const existingDeps = packageJSON.devDependencies;

  if (!existingDeps) {
    console.log(
      colors.FgYellow,
      'No Dev Dependencies installed, installing all required dependencies.'
    );
    return tagDeps;
  }

  const installQueue = tagDeps.filter(dep =>
    existingDeps[dep]
      ? console.log(colors.FgYellow, `${dep} is installed, skipping.`)
      : dep
  );

  return installQueue;
};
