const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const typingsPath = require.resolve('@figma/plugin-typings/plugin-api.d.ts');
const program = ts.createProgram([typingsPath], {});
const checker = program.getTypeChecker();
const source = program.getSourceFile(typingsPath);

function getLiteral(node) {
  if (!node) return null;
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return node.literal.text;
  if (ts.isUnionTypeNode(node)) {
    const lit = node.types.find(t => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal));
    if (lit) return lit.literal.text;
  }
  return null;
}

/** Collect properties for each node type */
const result = {};
ts.forEachChild(source, node => {
  if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith('Node')) {
    const symbol = checker.getSymbolAtLocation(node.name);
    const type = checker.getDeclaredTypeOfSymbol(symbol);
    const props = checker.getPropertiesOfType(type).map(s => s.name).sort();
    let nodeType = null;
    const typeProp = symbol.members && symbol.members.get('type');
    if (typeProp) {
      const d = typeProp.valueDeclaration || (typeProp.declarations && typeProp.declarations[0]);
      if (d && d.type) nodeType = getLiteral(d.type);
    }
    if (!nodeType) nodeType = node.name.text.replace(/Node$/, '').toUpperCase();
    result[nodeType] = props;
  }
});

const content = `export const NODE_TYPE_PROPS: Record<string, string[]> = ${JSON.stringify(result, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, '../src/node-type-props.ts'), content);
