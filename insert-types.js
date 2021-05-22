const path = require("path");
const { Project, ScriptTarget, ts, Node } = require("ts-morph");

// still not sure what the difference between these three is
Node.isClassProperty = (node) => {
    return Node.isPropertyDeclaration(node) || Node.isPropertyAssignment(node) || Node.isPropertySignature(node)
}

function getJsDocOrCreate(node) {
    return node.getJsDocs()[0] || node.addJsDoc({});
}

function generateParameterDocumentation(functionNode) {
    const params = functionNode.getParameters()
    for (const param of params) {
        const parameterType = param.getTypeNode()?.getText()
        if (!parameterType) continue;
        // Get param tag that matches the param
        const jsDoc = getJsDocOrCreate(functionNode);
        const paramTag = (jsDoc.getTags() || [])
          .filter(tag => ["param", "parameter"].includes(tag.getTagName()))
          .find(tag => tag.compilerNode.name?.getText() === param.getName())
        
        const paramName = param.compilerNode.name?.getText()
        if (paramTag) {
            // Replace tag with one that contains typing info
            const comment = paramTag.getComment()
            const tagName = paramTag.getTagName()

            paramTag.replaceWithText(`@${tagName} {${parameterType}} ${paramName}  ${comment}`)
        } else {
            jsDoc.addTag({
                tagName: "param",
                text: `{${parameterType}} ${paramName}`
            })
        }
    }
}

function generateReturnTypeDocumentation(functionNode) {
    const functionReturnType = functionNode.getReturnType()?.getText()
    const jsDoc = getJsDocOrCreate(functionNode)
    const returnsTag = (jsDoc?.getTags() || []).find(tag =>
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

function generateModifierDocumentation(classMemberNode) {
    const modifiers = classMemberNode.getModifiers() || [];
    for (let modifier of modifiers) {
        modifier = modifier?.getText()
        if (["public", "private", "protected", "readonly", "static"].includes(modifier)) {
            const jsDoc = getJsDocOrCreate(classMemberNode);
            jsDoc.addTag({ tagName: modifier })
        }
    }
}

function generateInitializerDocumentation(classPropertyNode) {
    const jsDoc = getJsDocOrCreate(classPropertyNode);
    jsDoc.addTag({ tagName: "default", text: classPropertyNode.getStructure().initializer });
}

module.exports = function insertTypes(src, filename) {
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
        const classMembers = classNode.getMembers()
        for (const classMember of classMembers) {
            generateModifierDocumentation(classMember)
            Node.isClassProperty(classMember) && generateInitializerDocumentation(classMember)
            Node.isMethodDeclaration(classMember) && generateFunctionDocumentation(classMember)
        }
    }

    // Generate function parameter type documentation
    const functionNodes = sourceFile.getFunctions()
    for (const functionNode of functionNodes) {
        generateFunctionDocumentation(functionNode)
    }

    return project.emitToMemory()?.getFiles()?.[0]?.text || src;
}

