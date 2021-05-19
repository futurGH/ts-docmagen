<h1 align="center">
    <img width="200" height="200" src="https://raw.githubusercontent.com/futurGH/ts-docmagen/master/ts-docma.png" alt="TS Docma" />
</h1>

<p align="center">
Generate <a href="https://github.com/onury/docma">Docma</a> documentation from TypeScript code annotated with <a href="https://github.com/jsdoc/jsdoc">JSDoc</a>.
</p>

## Install
```shell
$ npm install -g ts-docmagen
```

## Usage

```shell
$ ts-docmagen

Generate Docma (​https://github.com/onury/docma​) documentation from TypeScript
code annotated with JSDoc.

Options:
    --help        Show help                                          [boolean]
    --version     Show version number                                [boolean]
-s, --src         Source directory to read from            [string] [required]
-o, --out         Directory to output documentation to     [string] [required]
    --temp        The directory in which transpiled JavaScript is temporarily stored (auto-deleted by default)
                                                [string] [default: "docmagen"]
-d, --docma       Path to docma.json file
NOTE: If there's a docma.json file in the directory the command is called from, that file will be used by default
                                              [string] [default: "docma.json"]
    --purge-temp  Whether to delete the temporarily generated JavaScript files after documentation has been generated
                                                     [boolean] [default: true]
    --debug       Enable Docma debug output         [boolean] [default: false]
-a, --assets      List of globs to copy over as static assets
                                                         [array] [default: []]
    --ignore      Directories to ignore when generating documentation
                                                         [array] [default: []]
```

```shell
$ ts-docmagen --src ./src --out ./documentation
# Generates documentation in the 'documentation' 
# directory from the code in 'src'
```

```shell
$ ts-docmagen --src ./src --out ./documentation --assets ./assets/**/* --ignore node_modules
# Generates documentation in 'documentation' from 'src', 
# copying all files in 'assets' to the newly created documentation's 
# assets directory, and ignoring 'node_modules' when transpiling
```

## Credit
**The [Docma](https://github.com/onury/docma) project** for making this possible!

**[SoftwareBrothers/better-docs](https://github.com/SoftwareBrothers/better-docs)** for the code in [generate-comments.js](generate-comments.js) and [type-converter.js](type-converter.js) to transpile TypeScript typings to JSDoc type annotations & typedefs 

## License
[MIT](LICENSE) © [futurGH](https://github.com/futurGH).
