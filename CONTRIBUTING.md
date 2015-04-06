# Contributing
If you'd like to code, follow this steps.

## 1. Requirements
- [Git](http://git-scm.com)
- [node.js](http://nodejs.org)
- grunt-cli
  
  Run
  ```
  npm install -g grunt-cli
  ```
  
## 2. Setup
1. Fork the repo
2. Clone the repo into the extenions folder.
  ```
  cd < Path to Brackets >/www/extensions/dev
  git clone https://github.com/< Your username >/brackets-svg-font.git brackets-svg-font
  ```
3. Install dependencies
  ```
  npm install
  ```
4. Create a branch in which work.
  ```
  git checkout -b < Branch name >
  ```
5. Compile `src/` (From EcmaScript6 to EcmaScript5)
  ```
  grunt init
  ```

## 3. Coding
You should only change files in the `src/` direcotry.
To compile them, run
- `grunt compile:js` when you change a javascript file (`src/main.js`, `src/modules/*.js`, `src/node/*.js`)
- `grunt compile:css` when you change a scss file (`src/style/*.scss`)
- `grunt copy:html` when you change an html file (`src/html/*.html`)
- `grunt copy:ff` when you change a fontforge file (`src/node/fontforge/*.ff`)

Or you can just run `grunt watch` each time you start coding :wink:

The code must pass JSHint tests. Run
```
grunt jshint:all
```
before committing.
