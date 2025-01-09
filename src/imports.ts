const babelParser = require("@babel/parser");

export const getImports = (filepath: string, filecontent: string) => {
  console.log(babelParser);
  const ast = babelParser.parse(filecontent, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  const imports: string[] = [];
  ast.program.body.forEach((node) => {
    if (node.type === "ImportDeclaration") {
      imports.push(node.source.value);
    }
  });
  return imports;
};

export const readFromImport = (importStr: string) => {};
