const colors = require('./colors');

const tagDeps = require('../tagDeps');

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
      ? console.log(colors.FgYellow, `${dep} Installed, skipping.`)
      : dep
  );

  return installQueue;
};
