import ts from "typescript";

export interface CodeChunk {
  id: string;
  filePath: string;
  symbol: string;
  kind: string;
  text: string;
  startLine: number;
}

/** Split a TypeScript file at named declarations while retaining source locations. */
export function extractChunks(filePath: string, source: string): CodeChunk[] {
  const file = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const chunks: CodeChunk[] = [];
  const declarationKinds = new Set([
    ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.TypeAliasDeclaration,
    ts.SyntaxKind.EnumDeclaration, ts.SyntaxKind.VariableStatement
  ]);
  function visit(node: ts.Node): void {
    if (declarationKinds.has(node.kind)) {
      const named = (node as ts.DeclarationStatement).name;
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
