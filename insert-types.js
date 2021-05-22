const path = require("path");
const { Project, ScriptTarget, ts } = require("ts-morph");

function generateParameterDocumentation(functionNode) {
    const params = functionNode.getParameters()
    for (const param of params) {
        const paramTypeNode = param.getTypeNode()
        if (!paramTypeNode) continue;
        for (const paramTag of (functionNode?.getJsDocs()?.[0]?.getTags() || []).filter(tag =>
          ["param", "parameter"].includes(tag.getTagName())
        )) {
            // Replace tag with one that contains typing info
            const name = paramTag.compilerNode.name.getText()
            if (name !== functionNode.getName()) continue;
            const comment = paramTag.getComment()
            const parameterType = paramTypeNode.getText()
            const tagName = paramTag.getTagName()
            
            paramTag.replaceWithText(`@${tagName} {${parameterType}} ${name}  ${comment}`)
        }
    }
}

function generateReturnTypeDocumentation(functionNode) {
    const functionReturnType = functionNode.getReturnType()?.getText()
    const jsDoc = functionNode.getJsDocs()?.[0]
    const returnsTag = (jsDoc.getTags() || []).find(tag =>
      ["returns", "return"].includes(tag.getTagName())
    );
    // Replace tag with one that contains type info if tag exists
    if (returnsTag) {
        const tagName = returnsTag.getTagName()
        const comment = returnsTag.getComment()
        returnsTag.replaceWithText(`@${tagName} {${functionReturnType}}${comment ? ` ${comment}` : ""}`)
        // Otherwise, create a new one
    } else {
        jsDoc.addTag({
            tagName: "returns",
            text: `{${functionReturnType}}`
        })
    }
}

function generateFunctionDocumentation(functionNode) {
    generateParameterDocumentation(functionNode);
    generateReturnTypeDocumentation(functionNode);
}

module.exports =  function insertTypes(src, filename) {
    const project = new Project({
        compilerOptions: {
            target: ScriptTarget.ESNext,
            esModuleInterop: true,
            jsx: path.extname(filename) === '.tsx' ? ts.JsxEmit.React : ts.JsxEmit.None,
        }
    })
    const sourceFile = project.createSourceFile(path.basename(filename), src)
    
    const classNodes = sourceFile.getClasses()
    for (const classNode of classNodes) {
        // Generate typings for methods
        const classMethods = classNode.getInstanceMethods().concat(classNode.getStaticMethods())
        for (const classMethod of classMethods) {
            generateFunctionDocumentation(classMethod)
        }
    }
    
    // Generate function parameter type documentation
    const functionNodes = sourceFile.getFunctions()
    for (const functionNode of functionNodes) {
        generateFunctionDocumentation(functionNode)
    }
    
    return project.emitToMemory()?.getFiles()?.[0]?.text || src;
}

