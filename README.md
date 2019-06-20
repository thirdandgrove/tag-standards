# TAG JS Standards

## Dependencies

- babel-eslint
- eslint
- eslint-config-airbnb
- eslint-config-prettier
- eslint-plugin-import
- eslint-plugin-jsx-a11y
- eslint-plugin-prettier
- eslint-plugin-react
- eslint-plugin-react-hooks
- husky
- prettier
- pretty-quick

## Requirements

ensure that your editor has the proper packages/extensions installed and configured.

#### Sublime
```
JSPrettier
Eslint
```

#### Atom
```
linter
linter-eslint
prettier-atom
```

#### VSCode
```
ESLint
Prettier - Code formatter
```

## Usage

no need to install, just run the binary in the root of your project through `npx` and you're good to go!

`npx tag-standards`

## Contributions

this package copies over its own configuration into the target project. So any updates that are concerned with the target configuration only need to update dependencies and appropriate configuration files.
