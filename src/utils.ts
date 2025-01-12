import * as vscode from "vscode";
import { AxiosResponse } from "axios";
import { convertExtensionToLanguage } from "./constants";

export const sleep = async (ms: number) => {
  return new Promise<void>((resolve, _) => setTimeout(() => resolve(), ms));
};

export const getFileExtension = (filepath: string) => {
  // TODO: does not support windows paths
  return filepath.split("/").pop()?.split(".").pop();
};

export const writeStreamingOutput = async (
  response: AxiosResponse,
  extension: string,
) => {
  const document = await vscode.workspace.openTextDocument({
    content: "",
    language: convertExtensionToLanguage(extension),
  });

  const editor = await vscode.window.showTextDocument(document, {
    preview: false,
    viewColumn: vscode.ViewColumn.Beside,
  });

  let currentText = "";

  response.data.on("data", async (chunk: Buffer) => {
    const text = chunk.toString("utf-8");
    if (
      text.includes("```") ||
      text.includes("<|im_end|>") ||
      text.includes(extension)
    )
      return;
    currentText += text;
    await editor.edit((editorBuilder) => {
      editorBuilder.replace(
        new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length),
        ),
        currentText,
      );
    });

    const lastLine = document.lineCount - 1;
    editor.revealRange(
      new vscode.Range(
        new vscode.Position(lastLine, 0),
        new vscode.Position(lastLine, 0),
      ),
    );
    // await sleep(2000);
  });

  response.data.on("end", () => {
    vscode.window.showInformationMessage("Output completed.");
  });

  response.data.on("error", (error: Error) => {
    vscode.window.showErrorMessage(`Something went wrong: ${error}`);
  });
};

export interface ImportSymbol {
  name: string;
  position: vscode.Position;
  path: string;
}

// Function to find the exact position of a symbol in a line
const findSymbolPosition = (
  lineText: string,
  symbol: string,
  lineNumber: number,
): vscode.Position => {
  const symbolIndex = lineText.indexOf(symbol);
  if (symbolIndex === -1) {
    // Fallback to searching for the symbol with possible whitespace or 'as' keyword
    const asPattern = new RegExp(
      `\\b${symbol}\\s+as\\s+\\w+\\b|\\b\\w+\\s+as\\s+${symbol}\\b|\\b${symbol}\\b`,
    );
    const match = asPattern.exec(lineText);
    if (match) {
      return new vscode.Position(lineNumber, match.index);
    }
    return new vscode.Position(lineNumber, 0);
  }
  return new vscode.Position(lineNumber, symbolIndex);
};
const cleanUpPath = (str: string) => {
  return str.trim().slice(0, -1).split('"')[1];
};
export const findImportSymbols = async (document: vscode.TextDocument) => {
  const text = document.getText();
  const importSymbols: ImportSymbol[] = [];

  // Process each line of the document
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;

    // ES6 imports
    const es6ImportMatch = lineText.match(/import\s*{([^}]*)}\s*from/);
    if (es6ImportMatch) {
      const imports = es6ImportMatch[1].split(",");
      for (const imp of imports) {
        const cleanImport = imp.trim();
        // Handle 'as' aliases
        const [originalName] = cleanImport.split(/\s+as\s+/);
        const name = originalName.trim();
        const path = cleanUpPath(lineText.split(es6ImportMatch[0])[1]);
        if (name) {
          const position = findSymbolPosition(lineText, name, i);
          importSymbols.push({ name, position, path });
        }
      }
      continue;
    }

    // Default imports
    const defaultImportMatch = lineText.match(/import\s+(\w+)\s+from/);
    if (defaultImportMatch) {
      const name = defaultImportMatch[1];
      const position = findSymbolPosition(lineText, name, i);
      const path = cleanUpPath(lineText.split(defaultImportMatch[0])[1]);
      importSymbols.push({ name, position, path });
      continue;
    }

    // CommonJS require with destructuring
    const requireMatch = lineText.match(/const\s*{([^}]*)}\s*=\s*require/);
    if (requireMatch) {
      const imports = requireMatch[1].split(",");
      for (const imp of imports) {
        const cleanImport = imp.trim();
        const [originalName] = cleanImport.split(/\s+as\s+/);
        const name = originalName.trim();
        if (name) {
          const position = findSymbolPosition(lineText, name, i);
          const path = cleanUpPath(lineText.split(requireMatch[0])[1]);
          importSymbols.push({ name, position, path });
        }
      }
    }
  }

  return importSymbols;
};

export const getDefinitionsOfImportSymbols = async (
  symbols: ImportSymbol[],
  document: vscode.TextDocument,
) => {
  const definitions = await Promise.all(
    symbols.map(async (importSymbol) => {
      const definitionLocation =
        (await vscode.commands.executeCommand<vscode.LocationLink[]>(
          "vscode.executeDefinitionProvider",
          document.uri,
          importSymbol.position,
        )) || [];

      const locationWithText = await Promise.all(
        definitionLocation
          .filter((loc) => !loc.targetUri.fsPath.includes("node_modules"))
          .map(async (loc) => {
            const definitionDoc = await vscode.workspace.openTextDocument(
              loc.targetUri,
            );
            const text = definitionDoc.getText();
            return {
              uri: loc.targetUri,
              text,
            };
          }),
      );
      return {
        symbol: importSymbol.name,
        locations: locationWithText,
        path: importSymbol.path,
      };
    }),
  );
  return definitions;
};
