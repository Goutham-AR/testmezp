import * as vscode from "vscode";

import { generateTestForFileV2 } from "./generateTestForFile";
import { generateTestForSelection } from "./generateTestForSelection";
import { generateTestForFileWithSample } from "./generateTestForFileWithSample";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "testmezp" is now active!');

  const d1 = vscode.commands.registerCommand(
    "testmezp.generateTestForFile",
    generateTestForFileV2,
  );

  const d2 = vscode.commands.registerCommand(
    "testmezp.generateTestForSelection",
    generateTestForSelection,
  );

  const d3 = vscode.commands.registerCommand(
    "testmezp.generateTestForSelectionWithSample",
    generateTestForFileWithSample,
  );

  context.subscriptions.push(d1);
  context.subscriptions.push(d2);
  context.subscriptions.push(d3);
}

// This method is called when your extension is deactivated
export function deactivate() {}
