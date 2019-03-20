const { resolve } = require('path');
const { readFileSync, writeFileSync, existsSync, unlinkSync } = require('fs');

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
  const requiredDeps = resolveDeps(
    targetPackageJSON,
    tagStandardsPackage.devDependencies
  );

  if (!requiredDeps.length) {
    console.log(
      FgGreen,
      'Hooray, this project already has the necessary dependencies!'
    );
  } else {
    console.log(Reset, `Installing: ${requiredDeps.join(' ')}`);
    // Check for yarn.
    const hasYarn = existsSync(resolve(destDir, 'yarn.lock'));

    // Pinned dependency versions in install command.
    const depsWithVersions = requiredDeps
      .map(dep => {
        return `${dep}@${tagStandardsPackage.devDependencies[dep].substring(
          1
        )}`;
      })
      .join(' ');

    const installCmd = hasYarn
      ? `yarn add -D ${depsWithVersions}`
      : `npm i -D ${depsWithVersions}`;

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

  // Check for configuration files in the target directory.
  try {
    const conflictingConfigs = [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      '.prettierrc',
      '.prettierrc.js',
      '.prettierrc.toml',
      '.prettierrc.yaml',
      '.prettierrc.yml',
      'prettier.config.js',
    ];

    console.log(FgGreen, 'Removing configs that may conflict.');

    // Remove them to prevent unwanted conflicts.
    conflictingConfigs.map(fileName => {
      return (
        existsSync(resolve(destDir, fileName)) &&
        unlinkSync(resolve(destDir, fileName))
      );
    });
  } catch (err) {
    console.log(FgRed, `There was an error removing config files: ${err}`);
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

    // Add husky pre-commit hooks and lint script.
    modifiedPackage.husky = tagStandardsPackage.husky;
    modifiedPackage.scripts.lint = tagStandardsPackage.scripts.lint;

    // Add devDependencies.
    modifiedPackage.devDependencies = {
      ...modifiedPackage.devDependencies,
      ...tagStandardsPackage.devDependencies,
    };

    // Remove package configs.
    if (modifiedPackage.eslintConfig) {
      delete modifiedPackage.eslintConfig;
    }
    if (modifiedPackage.prettier) {
      delete modifiedPackage.prettier;
    }

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
  console.log(
    FgGreen,
    'Configurations for TAG standards successfully installed.'
  );
};
