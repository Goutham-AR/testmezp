import * as vscode from "vscode";
import { getFileExtension } from "./utils";
import { getImports } from "./imports";
import { generateTest, ReqBody } from "./generate";
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

  const imports = getImports(filepath, sourceCode);
  console.log(imports);
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
