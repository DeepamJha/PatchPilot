import ts from "typescript";
/** Split a TypeScript file at named declarations while retaining source locations. */
export function extractChunks(filePath, source) {
    const file = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
    const chunks = [];
    const declarationKinds = new Set([
        ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.ClassDeclaration,
        ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.TypeAliasDeclaration,
        ts.SyntaxKind.EnumDeclaration, ts.SyntaxKind.VariableStatement
    ]);
    function visit(node) {
        if (declarationKinds.has(node.kind)) {
            const named = node.name;
            const symbol = named?.getText(file) ?? `anonymous-${chunks.length}`;
            const start = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
            chunks.push({
                id: `${filePath}:${start}:${symbol}`,
                filePath, symbol, kind: ts.SyntaxKind[node.kind],
                text: node.getText(file), startLine: start
            });
        }
        ts.forEachChild(node, visit);
    }
    visit(file);
    return chunks;
}
