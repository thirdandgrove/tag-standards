const { resolve } = require('path');
const { readFileSync } = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const resolveDeps = require('./resolveDeps');
const colors = require('./colors');

const destDir = resolve(process.cwd());

module.exports = async () => {
  console.log(
    colors.Reset,
    colors.FgCyan,
    `Working in project directory: ${destDir}`
  );

  let packageJSON;
  try {
    packageJSON = JSON.parse(readFileSync(resolve(destDir, 'package.json')));
  } catch (err) {
    console.error(colors.FgRed, 'Unable to read package.json');
    console.error(colors.Reverse, 'Make sure you run this in the project root');
    return;
  }

  console.log(
    colors.Reset,
    colors.FgCyan,
    'Checking for existing dependencies'
  );
  const requiredDeps = resolveDeps(packageJSON);

  if (!requiredDeps.length) {
    console.log(
      colors.FgBlack,
      colors.BgGreen,
      'Hooray, this project already has the necessary dependencies!'
    );
  } else {
    console.log(colors.Reset, `Installing: ${requiredDeps.join(' ')}`);

    await exec(`npm i -D ${requiredDeps.join(' ')}`)
      .then(() => {
        console.log(
          colors.BgGreen,
          colors.FgBlack,
          'Dependencies installed successfully'
        );
      })
      .catch(err => {
        console.error(
          colors.Reset,
          colors.FgRed,
          `An error ocurred while installing dependencies ${err}`
        );
      });
  }
  console.log(colors.Reset, colors.FgCyan, 'Copying configuration files');
  // TODO: copy configs
  console.log(colors.Reset, colors.FgCyan, 'Modifying package.json');
  // modify package with appropriate scripts
  // tests?
};
