import * as vscode from "vscode";

import { generateTestForFileV2, generateTestV3 } from "./generateTestForFile";
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
    "testmezp.generateTestWithSample",
    generateTestForFileWithSample,
  );

  const d4 = vscode.commands.registerCommand(
    "testmezp.generateTestV3",
    generateTestV3,
  );

  context.subscriptions.push(d1);
  context.subscriptions.push(d2);
  context.subscriptions.push(d3);
  context.subscriptions.push(d4);
}

// This method is called when your extension is deactivated
export function deactivate() {}
