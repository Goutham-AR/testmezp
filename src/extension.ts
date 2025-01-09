import * as vscode from "vscode";

import { getImports } from "./imports";
import { generateTest, ReqBody } from "./generate";
import { convertExtensionToLanguage } from "./constants";
import { getFileExtension } from "./utils";

const BACKEND_URL = "http://153.177.188.151:41278";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "testmezp" is now active!');

  const disposable = vscode.commands.registerCommand(
    "testmezp.generateTestForFile",
    async () => {
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
    },
  );

  const disposable2 = vscode.commands.registerCommand(
    "testmezp.generateTestForSelection",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }
      const selectionText = editor.document.getText(editor.selection);
      if (selectionText.length === 0) {
        vscode.window.showErrorMessage("Empty selection.");
        return;
      }
      const filepath = editor.document.fileName;
      const fileExtension = getFileExtension(filepath);
      const body: ReqBody = {
        code: selectionText,
        extension: fileExtension as string,
        testFramework: "jest",
      };
      let response: string;
      try {
        response = await generateTest(BACKEND_URL, body);
      } catch (e) {
        vscode.window.showErrorMessage("Server error, please try again....");
        return;
      }
      const doc = await vscode.workspace.openTextDocument({
        content: response,
        language: convertExtensionToLanguage(fileExtension as string),
      });
      vscode.window.showTextDocument(doc);
    },
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}
