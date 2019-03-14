const { resolve } = require('path');
const { readFileSync, writeFileSync, existsSync } = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const resolveDeps = require('./resolveDeps');
const { FgCyan, FgGreen, FgRed, Reset, Reverse } = require('./colors');

const tagStandardsPackage = require('../package.json');
const eslintConfig = require('../.eslintrc.json');
const prettierConfig = require('../.prettierrc.json');

const destDir = resolve(process.cwd());

module.exports = async () => {
  console.log(FgCyan, `TAG-STANDARDS VERSION: ${tagStandardsPackage.version}`);
  console.log(FgCyan, `Working in project directory: ${destDir}`);

  // Read package of target project.
  let targetPackageJSON;
  try {
    targetPackageJSON = JSON.parse(
      readFileSync(resolve(destDir, 'package.json'))
    );
  } catch (err) {
    // Return early if no package is found.
    console.error(FgRed, 'Unable to read package.json');
    console.error(Reverse, 'Make sure you run this in the project root');
    return;
  }

  // Check package for required dependencies.
  console.log(Reset, FgCyan, 'Checking for existing dependencies');
  const requiredDeps = resolveDeps(targetPackageJSON);

  if (!requiredDeps.length) {
    console.log(
      FgGreen,
      'Hooray, this project already has the necessary dependencies!'
    );
  } else {
    console.log(Reset, `Installing: ${requiredDeps.join(' ')}`);
    // Check for yarn.
    const hasYarn = (cwd = process.cwd()) =>
      existsSync(resolve(cwd, 'yarn.lock'));

    const installCmd = hasYarn
      ? `yarn add -D ${requiredDeps.join(' ')}`
      : `npm i -D ${requiredDeps.join(' ')}`;

    // Change working directory.
    try {
      process.chdir(destDir);
      console.log(FgGreen, `New directory: ${process.cwd()}`);
    } catch (err) {
      console.log(FgRed, `chdir: ${err}`);
      return;
    }
    // Install the required dependencies.
    await exec(installCmd)
      .then(() => {
        console.log(FgGreen, 'Dependencies installed successfully');
      })
      .catch(err => {
        console.error(
          FgRed,
          `An error ocurred while installing dependencies ${err}`
        );
      });
  }

  // Write config files to the target project.
  console.log(Reset, FgCyan, 'Copying configuration files');
  try {
    writeFileSync(
      resolve(destDir, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );
    writeFileSync(
      resolve(destDir, '.prettierrc.json'),
      JSON.stringify(prettierConfig, null, 2)
    );
    console.log(Reset, FgGreen, 'Configuration files written successfully');
  } catch (err) {
    console.log(
      Reset,
      FgRed,
      `There was a problem writing the configuration files: ${err}`
    );
  }

  // Add scripts to the target package.
  console.log(Reset, FgCyan, 'Modifying package.json');
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
    console.log(Reset, FgGreen, 'Package.json modified successfully');
  } catch (err) {
    console.log(
      Reset,
      FgRed,
      `There was a problem writing the configuration files`
    );
  }
};
