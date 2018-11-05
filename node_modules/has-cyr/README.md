# Has Cyr

Module that searches for cyrillic letters in the text. Can demonstrate the results directly in the text.

![preview](https://raw.githubusercontent.com/tpkn/has-cyr/master/preview.png)

If you need to separately handle each match, you can use the preprocessor function (second argument)


## Installation
```bash
npm install has-cyr
```


## Usage
```javascript
const chalk = require('chalk');
const hasCyr = require('has-cyr');

function chalkHighlighter(str){
   return chalk.red.bold(str);
}

let text = 'Lогем iрsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod темроr incididunt ut labоге et dolore magna aliqua. Ut хуй ad minim veniam, quis nostrud ехегсitation ullamco laboris nisi ut aliquip eх ea соммоdo сопsequat. Duis aute irure dolor в reprehenderit in voluptate velit esse cillum dоlоre eu fugiat nulla pariatur. Ехсерtеr sint occaecat cupidatat поп proident, sunt in сиlра qui officia deserunt mollit anim id est laborum.';

let cyr = hasCyr(text, chalkHighlighter);
if(cyr){
   console.log(cyr);
}
```

As an additional feature it can transliterate matches.
```javascript
let cyr = hasCyr(text, chalkHighlighter, true);
```

![translit](https://raw.githubusercontent.com/tpkn/has-cyr/master/translit.png)