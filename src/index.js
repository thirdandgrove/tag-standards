const { resolve } = require('path');
const { readFileSync, writeFileSync } = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const resolveDeps = require('./resolveDeps');
const colors = require('./colors');

const tagStandardsPackage = require('../package.json');
const eslintConfig = require('../.eslintrc.json');
const prettierConfig = require('../.prettierrc.json');

const destDir = resolve(process.cwd());

module.exports = async () => {
  console.log(
    colors.FgCyan,
    `TAG-STANDARDS VERSION: ${tagStandardsPackage.version}`
  );
  console.log(colors.FgCyan, `Working in project directory: ${destDir}`);

  // Read package of target project
  let targetPackageJSON;
  try {
    targetPackageJSON = JSON.parse(
      readFileSync(resolve(destDir, 'package.json'))
    );
  } catch (err) {
    // return early if no package is found
    console.error(colors.FgRed, 'Unable to read package.json');
    console.error(colors.Reverse, 'Make sure you run this in the project root');
    return;
  }

  // check package for required dependencies
  console.log(
    colors.Reset,
    colors.FgCyan,
    'Checking for existing dependencies'
  );
  const requiredDeps = resolveDeps(targetPackageJSON);

  if (!requiredDeps.length) {
    console.log(
      colors.FgGreen,
      'Hooray, this project already has the necessary dependencies!'
    );
  } else {
    console.log(colors.Reset, `Installing: ${requiredDeps.join(' ')}`);

    // install the required dependencies
    await exec(`npm i -D ${requiredDeps.join(' ')}`)
      .then(() => {
        console.log(colors.FgGreen, 'Dependencies installed successfully');
      })
      .catch(err => {
        console.error(
          colors.FgRed,
          `An error ocurred while installing dependencies ${err}`
        );
      });
  }

  // write config files to the target project
  console.log(colors.Reset, colors.FgCyan, 'Copying configuration files');
  try {
    writeFileSync(
      resolve(destDir, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );
    writeFileSync(
      resolve(destDir, '.prettierrc.json'),
      JSON.stringify(prettierConfig, null, 2)
    );
    console.log(
      colors.Reset,
      colors.FgGreen,
      'Configuration files written successfully'
    );
  } catch (err) {
    console.log(
      colors.Reset,
      colors.FgRed,
      `There was a problem writing the configuration files: ${err}`
    );
  }

  // add scripts to the target package
  console.log(colors.Reset, colors.FgCyan, 'Modifying package.json');
  try {
    const modifiedPackage = { ...targetPackageJSON };
    // add husky pre-commit hooks
    modifiedPackage.husky = tagStandardsPackage.husky;
    // add lint script
    modifiedPackage.scripts.lint = tagStandardsPackage.scripts.lint;
    writeFileSync(
      resolve(destDir, 'package.json'),
      JSON.stringify(modifiedPackage, null, 2)
    );
    console.log(
      colors.Reset,
      colors.FgGreen,
      'Package.json modified successfully'
    );
  } catch (err) {
    console.log(
      colors.Reset,
      colors.FgRed,
      `There was a problem writing the configuration files`
    );
  }
};
