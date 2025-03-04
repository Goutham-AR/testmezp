import * as vscode from "vscode";

import { AbortableAsyncIterator, ChatResponse, Ollama } from "ollama";
import { CONFIG_NAMES, getConfig } from "./config";
import { AppError, ConfigError } from "./errors";

export abstract class IApp {
  protected _apiUrl: string;
  protected _modelName: string;
  protected _ollama: Ollama;
  protected _contextLength: number = 30000;

  constructor() {
    const apiUrl = getConfig(CONFIG_NAMES.API_URL);
    if (!apiUrl) {
      throw new ConfigError("error loading config", CONFIG_NAMES.API_URL);
    }
    const modelName = getConfig(CONFIG_NAMES.MODEL_NAME);
    if (!modelName) {
      throw new ConfigError("error loading config", CONFIG_NAMES.MODEL_NAME);
    }
    let contextLength = getConfig(CONFIG_NAMES.CONTEXT_LENGTH);
    if (contextLength) {
      this._contextLength = Number(contextLength);
    }
    this._apiUrl = apiUrl;
    this._modelName = modelName;
    this._ollama = new Ollama({ host: apiUrl });
  }

  abstract generateTest(): Promise<void>;

  protected async _sendPromptStreaming(prompt: string) {
    const systemMessage = this._getSystemMessage();
    console.log(systemMessage);
    const response = await this._ollama.chat({
      model: this._modelName,
      messages: [this._getSystemMessage(), this._getAssistantMessage(), { role: "user", content: prompt }],
      options: {
        num_ctx: this._contextLength,
      },
      stream: true,
    });
    return response;
  }


  protected _showError(message: string) {
    vscode.window.showErrorMessage(message);
  }

  protected _showInfo(message: string) {
    vscode.window.showInformationMessage(message);
  }

  protected _showWarning(message: string) {
    vscode.window.showWarningMessage(message);
  }

  protected _getSystemMessage() {
    return {
      role: "system",
      content:
        "You are helpful assistant that will help me generate test cases",
    };
  }
  protected _getAssistantMessage() {
    return {
      role: "assistant",
      content: "Always only send back the testcode and no other content"
    };
  }
  
  protected getCurrentDocument() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new AppError("No active editor");
    }
    const document = editor.document;
    return document;
  }

  protected async _writeStreamingOutput(
    response: AbortableAsyncIterator<ChatResponse>,
    language: string,
  ) {
    const document = await vscode.workspace.openTextDocument({
      content: "",
      language,
    });

    const editor = await vscode.window.showTextDocument(document, {
      preview: false,
      viewColumn: vscode.ViewColumn.Beside,
    });

    let currentText = "";

    const languages = ["typescript", "javascript", "tsx", "jsx"];
    let insideBacktick = false;
    for await (const chunk of response) {
      const text = chunk.message.content;
      if (text.includes("```") || text.includes("``")) {
        if (insideBacktick) {
          return;
        }
        insideBacktick = !insideBacktick;
        continue;
      }

      if (languages.some((val) => text.includes(val)) || !insideBacktick) {
        continue;
      }

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
    }
  }
}
