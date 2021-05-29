#!/usr/bin/env node
const argv = require("yargs/yargs")(require("yargs/helpers").hideBin(process.argv))
  .scriptName("ts-docmagen")
  .command("$0", `Generate ${require("../terminal-link.js")("Docma", "https://github.com/onury/docma")} documentation from TypeScript code annotated with JSDoc.`)
  .option("src", {
    alias: "s",
    describe: "Source directory to read from",
    type: "string",
    demand: true,
    demand: "Specify directory to read from"
  })
  .option("out", {
    alias: "o",
    describe: "Directory to output documentation to",
    type: "string",
    demand: true,
    demand: "Specify directory to output to"
  })
  .option("temp", {
    describe: "The directory in which transpiled JavaScript is temporarily stored (auto-deleted by default)",
    type: "string",
    default: "docmagen"
  })
  .option("docma", {
    alias: "d",
    describe: "Path to docma.json file\nNOTE: If there's a docma.json file in the directory the command is called from, that file will be used by default",
    type: "string",
    default: "docma.json"
  })
  .option("keep-js", {
    describe: "Don't delete the temporarily generated JavaScript files after documentation has been generated",
    type: "boolean",
    default: false
  })
  .option("no-docs", {
    describe: "Don't generate Docma documentation (really only useful with --keep-js)",
    type: "boolean",
    default: false
  })
  .option("debug", {
    describe: "Enable Docma debug output",
    type: "boolean",
    default: false
  })
  .conflicts("debug", "no-docs")
  .option("assets", {
    alias: "a",
    describe: "List of globs to copy over as static assets",
    type: "array",
    default: []
  })
  .option("ignore", {
    describe: "Directories to ignore when generating documentation",
    type: "array",
    default: []
  })
  
  .argv;

const path = require("path");
const fs = require("fs");

const normalizePathArgument = arg => path.join(process.cwd(), path.normalize(arg));

const srcPath = normalizePathArgument(argv.src);
const outPath = normalizePathArgument(argv.out);
const tempDir = normalizePathArgument(argv.temp);
let docmaConfig = normalizePathArgument(argv.docma);

const ignorePaths = argv.ignore.map(i => normalizePathArgument(i));

if (!fs.existsSync(srcPath)) throw new Error(`Source path ${srcPath} does not exist.`);
if (!fs.existsSync(docmaConfig)) docmaConfig = null;

const invalidIgnorePath = ignorePaths.find(i => !fs.existsSync(i));
if (invalidIgnorePath) throw new Error(`Ignore path ${invalidIgnorePath} does not exist.`);

const glob = require("glob");

function getFiles(dir, ext = ".ts") {
  return glob.sync(path.normalize(`${dir}/**/*${ext}`), {
    ignore: ignorePaths.map(i => `${i}/**/*`)
  }).map(f => path.normalize(f));
};

const mkdirp = require("mkdirp").sync;
mkdirp(tempDir);

const inputFiles = getFiles(srcPath);

const generateComments = require("../generate-comments.js");
for (const file of inputFiles) {
  const relativePath = path.normalize(path.relative(srcPath, file))
  const fileData = {
    content: fs.readFileSync(file, { encoding: "utf8" }),
    filename: `${path.parse(file).name}.ts`
  };
  const transpiledJS = generateComments(fileData);
  const filepath = path.join(tempDir, relativePath.replace(/\.ts/g, ".js"));
  mkdirp(path.dirname(filepath));
  fs.writeFileSync(filepath, transpiledJS);
};

if (!argv.noDocs) {
  mkdirp(outPath);
  (async () => {
    docmaConfig = docmaConfig ?? {};
    docmaConfig.clean = docmaConfig?.clean ?? argv.clean ?? true;
    docmaConfig.debug = docmaConfig?.debug ?? argv.debug ?? false;
    docmaConfig.src = getFiles(tempDir ?? docmaConfig?.src, ".js");
    docmaConfig.dest = outPath ?? docmaConfig?.dest;
    const assetPaths = argv.assets.map(a => path.join(path.relative(process.cwd(), tempDir), argv.assets));
    docmaConfig.assets = {"/assets": assetPaths} ?? docmaConfig?.assets ?? undefined;
    
    const rimraf = require("rimraf").sync;
    try {
      await require("docma").create()
        .build(docmaConfig);
    } catch (e) {
      throw new Error(`Something went wrong while creating the Docma documentation!\n\n${e}`)
    } finally {
      !argv.keepJs && rimraf(tempDir);
    }
  })()
}

