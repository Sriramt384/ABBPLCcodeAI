import * as monaco from 'monaco-editor';

// Configure Monaco Editor for PLC/IEC 61131-3 syntax highlighting
export function configureMonacoEditor() {
  // Register a new language for Structured Text
  monaco.languages.register({ id: 'structured-text' });

  // Define the language configuration
  monaco.languages.setLanguageConfiguration('structured-text', {
    comments: {
      lineComment: '//',
      blockComment: ['(*', '*)'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  // Define the tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider('structured-text', {
    tokenizer: {
      root: [
        // Keywords
        [/\b(PROGRAM|END_PROGRAM|VAR|END_VAR|IF|THEN|ELSE|ELSIF|END_IF|FOR|TO|DO|END_FOR|WHILE|END_WHILE|REPEAT|UNTIL|END_REPEAT|CASE|OF|END_CASE|FUNCTION|END_FUNCTION|FUNCTION_BLOCK|END_FUNCTION_BLOCK|TYPE|END_TYPE|STRUCT|END_STRUCT)\b/, 'keyword'],
        
        // Data types
        [/\b(BOOL|BYTE|WORD|DWORD|LWORD|SINT|INT|DINT|LINT|USINT|UINT|UDINT|ULINT|REAL|LREAL|TIME|DATE|TIME_OF_DAY|TOD|DATE_AND_TIME|DT|STRING|WSTRING)\b/, 'type'],
        
        // Boolean constants
        [/\b(TRUE|FALSE)\b/, 'number'],
        
        // Numbers
        [/\b\d+\.?\d*\b/, 'number'],
        
        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        
        // Comments
        [/\/\/.*$/, 'comment'],
        [/\(\*/, 'comment', '@comment'],
        
        // Identifiers and variables
        [/[a-zA-Z_]\w*/, 'identifier'],
        
        // Operators
        [/[:=]/, 'operator.assignment'],
        [/[=<>!]=?/, 'operator.comparison'],
        [/[+\-*\/]/, 'operator.arithmetic'],
        [/[&|^~]/, 'operator.bitwise'],
        [/[()]/, 'operator.bracket'],
      ],

      comment: [
        [/[^(*]+/, 'comment'],
        [/\*\)/, 'comment', '@pop'],
        [/[(*]/, 'comment'],
      ],

      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],

      string_single: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  });

  // Define the theme for syntax highlighting
  monaco.editor.defineTheme('plc-dark-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
      { token: 'type', foreground: '4ec9b0', fontStyle: 'bold' },
      { token: 'identifier', foreground: '9cdcfe' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
      { token: 'operator', foreground: 'd4d4d4' },
    ],
    colors: {
      'editor.background': '#2D2D2D',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#3C3C3C',
      'editor.selectionBackground': '#264f78',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
    },
  });
}

// Configure completion provider for IEC 61131-3
export function registerCompletionProvider() {
  monaco.languages.registerCompletionItemProvider('structured-text', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = [
        // Keywords
        {
          label: 'PROGRAM',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'PROGRAM ${1:ProgramName}\nVAR\n\t${2:// Variables}\nEND_VAR\n\n${3:// Program logic}\n\nEND_PROGRAM',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a new program block',
          range
        },
        {
          label: 'IF',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'IF ${1:condition} THEN\n\t${2:// Code}\nEND_IF;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'IF statement',
          range
        },
        {
          label: 'FOR',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'FOR ${1:variable} := ${2:start} TO ${3:end} DO\n\t${4:// Code}\nEND_FOR;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'FOR loop',
          range
        },
        // Data types
        {
          label: 'BOOL',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'BOOL',
          documentation: 'Boolean data type',
          range
        },
        {
          label: 'REAL',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'REAL',
          documentation: 'Real number data type',
          range
        },
        {
          label: 'INT',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'INT',
          documentation: 'Integer data type',
          range
        },
      ];

      return { suggestions };
    }
  });
}

// Initialize Monaco Editor configuration
export function initializeMonaco() {
  configureMonacoEditor();
  registerCompletionProvider();
}
