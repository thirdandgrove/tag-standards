const { resolve } = require('path');
const { readFileSync, writeFileSync, existsSync } = require('fs');

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

  // Read package of target project.
  let targetPackageJSON;
  try {
    targetPackageJSON = JSON.parse(
      readFileSync(resolve(destDir, 'package.json'))
    );
  } catch (err) {
    // Return early if no package is found.
    console.error(colors.FgRed, 'Unable to read package.json');
    console.error(colors.Reverse, 'Make sure you run this in the project root');
    return;
  }

  // Check package for required dependencies.
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
    // Check for yarn.
    const hasYarn = (cwd = process.cwd()) =>
      existsSync(resolve(cwd, 'yarn.lock'));

    const installCmd = hasYarn
      ? `yarn add -D ${requiredDeps.join(' ')}`
      : `npm i -D ${requiredDeps.join(' ')}`;

    // Change working directory.
    try {
      process.chdir(destDir);
      console.log(colors.FgGreen, `New directory: ${process.cwd()}`);
    } catch (err) {
      console.log(colors.FgRed, `chdir: ${err}`);
      return;
    }
    // Install the required dependencies.
    await exec(installCmd)
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

  // Write config files to the target project.
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

  // Add scripts to the target package.
  console.log(colors.Reset, colors.FgCyan, 'Modifying package.json');
  try {
    const modifiedPackage = { ...targetPackageJSON };
    // Add husky pre-commit hooks.
    modifiedPackage.husky = tagStandardsPackage.husky;
    // Add lint script.
    modifiedPackage.scripts.lint = tagStandardsPackage.scripts.lint;
    modifiedPackage.devDependencies = {
      ...tagStandardsPackage.devDependencies,
      ...modifiedPackage.devDependencies,
    };
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
