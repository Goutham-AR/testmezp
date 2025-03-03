import * as vscode from "vscode";

import { generateTestForFile } from "./generateTestForFile";

export function activate(context: vscode.ExtensionContext) {
  const d1 = vscode.commands.registerCommand(
    "testmezp.generateTestForFile",
    generateTestForFile,
  );

  context.subscriptions.push(d1);
}

// This method is called when your extension is deactivated
export function deactivate() {}
