export const generate = `
## Overview
You are a code assistant that accepts a {{ language }} source file. Your goal is to generate comprehensive unit tests in order to increase the code coverage against the source file.

Additional guidelines:
- Carefully analyze the provided code. Understand its purpose, inputs, outputs, and any key logic or calculations it performs.
- Brainstorm a list of diverse and meaningful test cases you think will be necessary to fully validate the correctness and functionality of the code, and achieve 100% code coverage.
- After each individual test has been added, review all tests to ensure they cover the full range of scenarios, including how to handle exceptions or errors.
{{#notJsx}}
- The code was converted from tsx/jsx to the normal function calls so that you can analyze it more well.
{{/notJsx}}

## Source File
Here is the source file that you will be writing tests against, called '{{ sourceFileName }}'.
=========
{{ sourceFileContent }}
=========

{{#importedContent}}
## Imported Files
Below are the contents of the files imported by the main source file.
{{ importedContent }}
{{/importedContent}}

{{#projectInfoFile}}
## Project information file ({{projectInfoFileName}})
Below is the file that contains some information about the project like the dependencies list, versions etc.
{{projectInfoFile}}
{{/projectInfoFile}}


### Test Framework
The test framework used for running tests is '{{ testFramework }}'.

{{ additionalInstructions }}

## Response
The output should be a valid program of {{ language }} language. Additional notes should be included as comments only.`;
