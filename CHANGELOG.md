# Change Log
All notable changes to this project will be documented in this file.

## Unreleased
### Fixed
- Conflict with other extensions using babel's polyfill ([#5](https://github.com/nicolo-ribaudo/brackets-svg-font/issues/5))
- Svg fonts couldn't be opened twice.

## 0.4.3 - 2015-04-27
### Fixed
- FontForge was opened at startup on Linux ([#4](https://github.com/nicolo-ribaudo/brackets-svg-font/issues/4))

  > Thanks to [@glepretre](https://github.com/glepretre) and [@fedor1113](https://github.com/fedor1113)

## 0.4.2 - 2015-04-25
### Fixed
- `svg` files which aren't fonts couldn't be open.
- `svg` glyphs were too dark using dark themes.

## 0.4.1 - 2015-04-21
### Fixed
- The conversion can be canceled.
- The extension didn't work on linux ([#3](https://github.com/nicolo-ribaudo/brackets-svg-font/issues/3)) (Again)
- Glyphs were too dark using dark themes.

## 0.4.0 - 2015-04-18
### Addedd
- Font conversions.

### Fixed
- The extension didn't work on linux ([#3](https://github.com/nicolo-ribaudo/brackets-svg-font/issues/3))

## 0.3.0 - 2015-04-06
### Addedd
- Support for TrueType, OpenType and WOFF fonts (Using [FontForge](http://fontforge.github.io))

### Fixed
- Svg fotns weren't viewd on Windows 7+

## 0.2.1 - 2014-12-18
### Added
 - Support for themes
   Now the background and the color of the glyphs are got by the theme

### Fixed
- When a svg file is opened and it isn't a font, it will be shown as normal code. ([#1](https://github.com/nicolo-ribaudo/brackets-svg-font/issues/1#issuecomment-67485742))

## 0.2.0 - 2014-12-16
### Added
- Support for TrueType fonts (`.ttf` files).

### Fixed
- The function that should sort glyphs didn't work.


## 0.1.0 - 2014-11-20
Initial release.
