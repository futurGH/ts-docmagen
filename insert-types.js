const path = require("path");
const { Project, ScriptTarget, ts } = require("ts-morph");

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
            // Get the method's actual defined parameters
            const params = classMethod.getParameters()
            for (const methodParam of params) {
                // If there's no type defined for the parameter, don't bother generating a typed tag for it
                const paramTypeNode = methodParam.getTypeNode()
                if (!paramTypeNode) continue;
                
                // The code that gets all @param or @parameter tags also has to be in the for loop
                // because the compiler seems to regenerate the node structure whenever a param is modified
                // so assigning it to a variable once doesn't work.
                // throws error "Attempted to get information from a node that was removed or forgotten."
                for (const paramTag of classMethod.getJsDocs()[0].getTags().filter(tag =>
                  ["param", "parameter"].includes(tag.getTagName())
                )) {
                    // Find the @param tag that matches the actual parameter
                    const name = paramTag.compilerNode.name.getText()
                    if (name !== methodParam.getName()) continue;
                    const comment = paramTag.getComment()
                    const parameterType = methodParam.getTypeNode().getText()
                    const tagName = paramTag.getTagName()
                    // Replace the @param tag with one that includes relevant type information!
                    paramTag.replaceWithText(`@${tagName} {${parameterType}} ${name}  ${comment}`)
                }
            }
            
            const methodReturnType = classMethod.getReturnType().getText()
            const returnsTag = classMethod.getJsDocs()[0].getTags().find(tag =>
              ["returns", "return"].includes(tag.getTagName())
            );
            if (returnsTag) {
                const tagName = returnsTag.getTagName()
                const comment = returnsTag.getComment()
                returnsTag.replaceWithText(`@${tagName} {${methodReturnType}}${comment ? ` ${comment}` : ""}`)
            } else {
                classMethod.getJsDocs()[0].addTag({
                    tagName: "returns",
                    text: `{${methodReturnType}}`
                })
            }
        }
    }
    
    return project.emitToMemory().getFiles()[0].text;
}

