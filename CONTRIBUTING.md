# Contributing
If you'd like to code, follow this steps.

## 1. Requirements
- [Git](http://git-scm.com)
- [node.js](http://nodejs.org)
- gulp
  
  Run
  ```bash
  npm install -g gulp
  ```
  
## 2. Setup
1. Fork the repo
2. Clone the repo into the extenions folder.
  ```bash
  cd < Path to Brackets >/www/extensions/dev
  git clone https://github.com/< Your username >/brackets-svg-font.git brackets-svg-font
  ```
3. Install dependencies
  ```bash
  npm install
  ```
4. Create a branch in which work.
  ```bash
  git checkout -b < Branch name >
  ```
5. Compile `src/` (From EcmaScript6 to EcmaScript5)
  ```bash
  gulp compile
  ```

## 3. Coding
You should only change files in the `src/` direcotry.
To compile them, run
- `gulp js.compile` when you change a javascript or fontforge file (`src/main.js`, `src/modules/*.js`, `src/node/*.js`, `src/node/fontforge/*.ff`)
- `gulp css` when you change a scss file (`src/style/*.scss`)
- `gulp html` when you change an html file (`src/html/*.html`)

Or you can just run `gulp watch` each time you start coding :wink:

The code must pass JSHint tests. Run
```bash
gulp js
```
before committing.
