import * as vscode from "vscode";

export class AppError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ConfigError extends AppError {
  public configName: string
  constructor(message: string, configName: string) {
    super(message);
    this.configName = configName;
  }
}

export function handleError(error: Error) {
  if (error instanceof ConfigError) {
    console.error(error.message, error.configName);
    vscode.window.showErrorMessage(`${error.configName} not set`);
    return;
  }
  if (error instanceof AppError) {
    console.error(error.message);
    vscode.window.showErrorMessage(error.message);
    return;
  }
 
  console.error("unhandled error");
  console.error(error);
  console.error(error.stack);
  vscode.window.showErrorMessage("Something went wrong");
}

