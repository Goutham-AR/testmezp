import * as vscode from "vscode";
import path from "path";
import { encoding_for_model } from "@dqbd/tiktoken";
import fs from "fs";
import { AbortableAsyncIterator, ChatResponse, Ollama } from "ollama";
import { CONFIG_NAMES, getConfig } from "./config";
import { AppError, ConfigError } from "./errors";
import {
  findImportSymbols,
  getDefinitionsOfImportSymbols,
  Import,
} from "./utils";
import {
  GeneratePromptData,
  loadGeneratePrompt,
  loadImportsText,
} from "./prompts/loadPrompts";

export class App {
  private _apiUrl: string;
  private _modelName: string;
  private _ollama: Ollama;
  private _contextLength: number = 30000;

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

  public async generateTest() {
    const document = this.getCurrentDocument();
    const sourceCode = document.getText();
    // read package.json
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new AppError("No workspace folder opened");
    }
    const packageJsonPath = path.join(
      workspaceFolders[0].uri.fsPath,
      "package.json",
    );
    if (!fs.existsSync(packageJsonPath)) {
      throw new AppError(
        `package.json not found in ${workspaceFolders[0].uri.fsPath}`,
      );
    }
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");

    const filepath = document.fileName;
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
    const language = document.languageId;
    const importsPrompt = loadImportsText({ imports });
    let promptData: GeneratePromptData = {
      language,
      sourceFileName: path.basename(filepath),
      sourceFileContent: sourceCode,
      testFramework: "jest",
      importedContent: importsPrompt,
      projectInfoFile: packageJsonContent,
      projectInfoFileName: "package.json",
    };
    let prompt = loadGeneratePrompt(promptData);
    const tokenizer = encoding_for_model("gpt-3.5-turbo");
    const encoding = tokenizer.encode(prompt);
    if (encoding.length >= this._contextLength) {
      console.log("context limit exceeded, reducing the size of prompt");
      promptData.importedContent = undefined;
      prompt = loadGeneratePrompt(promptData);
    }
    try {
    const response = await this._sendPromptStreaming(prompt);
    await this._writeStreamingOutput(response, language);
    } catch (e) {
      this._showError(`llm server request failed: ${(e as Error).message}`);
    }
    //for await (const chunk of response) {
    //console.log(chunk.message.content);
    //}
  }

  private _showError(message: string) {
    vscode.window.showErrorMessage(message);
  }
  private _showInfo(message: string) {
    vscode.window.showInformationMessage(message);
  }
  private async _sendPrompt(prompt: string) {
    const response = await this._ollama.chat({
      model: this._modelName,
      messages: [this._getSystemMessage(), { role: "user", content: prompt }],
      options: {
        num_ctx: this._contextLength,
      },
    });
    return response.message.content;
  }
  private async _sendPromptStreaming(prompt: string) {
    const response = await this._ollama.chat({
      model: this._modelName,
      messages: [this._getSystemMessage(), { role: "user", content: prompt }],
      options: {
        num_ctx: this._contextLength,
      },
      stream: true,
    });
    return response;
  }
  private _getSystemMessage() {
    return {
      role: "system",
      content:
        "You are helpful assistant that will help me generate test cases",
    };
  }
  private getCurrentDocument() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new AppError("No active editor");
    }
    const document = editor.document;
    return document;
  }

  private async _writeStreamingOutput(
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

      if (
        languages.some((val) => text.includes(val)) ||
        !insideBacktick
      ) {
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
      // await sleep(2000);
    }
  }
}
