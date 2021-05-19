const path = require('path')
const ts = require('typescript')

const typeConverter = require('./type-converter')

// Source: filename and content
module.exports = function generateComments(source) {
  // adding const a = 1 ensures that the comments always will be copied,
  // even when there is no javascript inside (just interfaces)
  let result = ts.transpileModule('const _____a = 1; \n' + source.content, {
    compilerOptions: {
      target: 'esnext',
      esModuleInterop: true,
      jsx: path.extname(source.filename) === '.tsx' ? 'react' : null,
    }
  })

  const types = typeConverter(source.content, source.filename)
  let src = result.outputText
  source.content = src + '\n' + types
  return source.content;
}
