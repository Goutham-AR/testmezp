import * as vscode from "vscode";

import { generateTestForFileV2 } from "./generateTestForFile";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "testmezp" is now active!');
  const d1 = vscode.commands.registerCommand(
    "testmezp.generateTestForFile",
    generateTestForFileV2,
  );

  context.subscriptions.push(d1);
}

// This method is called when your extension is deactivated
export function deactivate() {}
