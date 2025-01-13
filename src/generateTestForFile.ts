import * as vscode from "vscode";
import {
  findImportSymbols,
  getDefinitionsOfImportSymbols,
  getFileExtension,
  writeStreamingOutput,
} from "./utils";
import { getImports } from "./imports";
import {
  generateTest,
  generateTestV2,
  Import,
  ReqBody,
  ReqBodyV2,
} from "./generate";
import { BACKEND_URL } from "./config";

export const generateTestForFile = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor!");
    return;
  }
  vscode.window.showInformationMessage("Generating tests...");
  const document = editor.document;
  const sourceCode = document.getText();
  const filepath = document.fileName;
  const fileExtension = getFileExtension(filepath);
  const testFilePath = filepath.replace(/\.(js|ts|tsx|py)$/, ".test.$1");

  let outputContent: string;
  try {
    const body: ReqBody = {
      code: sourceCode,
      extension: fileExtension as string,
      testFramework: "jest",
    };
    const testOutput = await generateTest(BACKEND_URL, body);
    outputContent = testOutput.data as string;
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage(
      "Some problem with the server, please try again...",
    );
    return;
  }

  const wsEdit = new vscode.WorkspaceEdit();
  const uri = vscode.Uri.file(testFilePath);
  wsEdit.createFile(uri, { ignoreIfExists: true });
  wsEdit.insert(uri, new vscode.Position(0, 0), outputContent);
  await vscode.workspace.applyEdit(wsEdit);
  await vscode.window.showTextDocument(uri);
};

export const generateTestForFileV2 = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor!");
    return;
  }
  vscode.window.showInformationMessage("Generating tests...");

  const document = editor.document;
  const sourceCode = document.getText();
  const filepath = document.fileName;
  const extension = getFileExtension(filepath) ?? "txt";
  const importSymbols = await findImportSymbols(document);
  const definitions = await getDefinitionsOfImportSymbols(
    importSymbols,
    document,
  );
  const localDefinitions = definitions.filter(
    (def) => def.locations.length > 0,
  );
  const imports: Import[] = localDefinitions.map((def) => ({
    path: def.path,
    code: def.locations[0].text,
  }));

  const reqBody: ReqBodyV2 = {
    extension,
    code: sourceCode,
    testFramework: "jest",
    imports,
  };
  try {
    const response = await generateTestV2(BACKEND_URL, reqBody);
    await writeStreamingOutput(response, extension);
  } catch (e) {
    vscode.window.showErrorMessage(`server error: ${e}. please try again.`);
    return;
  }
};
