'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let add_func = vscode.commands.registerCommand('extension.addSemicolon', () => {
        let add_semicolon = new special_enter();
        add_semicolon.add_semicolon();
    });

    context.subscriptions.push(add_func);
}

// let lang = vscode.window.activeTextEditor.document.languageId;

exports.activate = activate;
class special_enter {
    _is_struct_def(line) {
        return line.trim().startsWith("struct ");
    }
    _is_class_def(line) {
        return line.trim().startsWith("class ");
    }
    _normal_enter() {
        normal_enter();
    }
    add_semicolon() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let selection = editor.selection;
        if (!selection.isEmpty) {
            return;
        }
        let cur_line_index = selection.active.line;
        let cur_line_obj = editor.document.lineAt(cur_line_index);
        let cur_line_length = cur_line_obj.text.length;
        let brackets_index = util._find_curly_braces(cur_line_obj.text);
        if (!brackets_index) {
            this._normal_enter();
            return;
        }
        let left_bracket_index = brackets_index[0];
        let right_bracket_index = brackets_index[1];
        // let start_of_line = vscode.commands.executeCommand('cursorLineStart');
        let left_bracket_pos = new vscode.Position(cur_line_index, left_bracket_index);
        let right_bracket_pos = new vscode.Position(cur_line_index, right_bracket_index + 1);
        if (this._is_struct_def(cur_line_obj.text) || this._is_class_def(cur_line_obj.text)) {
            let first_char = util.get_nonWhitespace_position(cur_line_obj.text);
            //add semicolon
            vscode.commands.executeCommand("acceptSelectedSuggestion")
                .then(() => {
                    editor.edit((builder) => {
                        builder.insert(left_bracket_pos, '\n' + ' '.repeat(first_char));
                        builder.insert(new vscode.Position(cur_line_index, left_bracket_index + 1), '\n' + '    ' + ' '.repeat(first_char) + '\n' + ' '.repeat(first_char));
                        builder.insert(right_bracket_pos, ';');
                        vscode.commands.executeCommand("cursorLineStart");
                    }).then(() => {
                        editor.selection = moveSelectionDown2Line(editor.selection, 4 + first_char);
                    });
                });
        } else {
            this._normal_enter();
            return;
        }
    }
};
class util {
    static _find_curly_braces(line) {
        if (line.length === 0) {
            return null;
        }
        let first = line.indexOf('{');
        let second = line.indexOf('}');
        if (first === -1 || second === -1) {
            return null;
        }
        return [first, second];
    }
    static get_nonWhitespace_position(line) {
        let pos = 0;
        let white = /\s/;
        for (let c of line) {
            if (white.test(c)) {
                pos++;
            } else {
                return pos;
            }
        }
    }
}

function moveSelectionDown2Line(selection, shift) {
    let newPosition = selection.active.translate(2, shift);
    let newSelection = new vscode.Selection(newPosition, newPosition);
    return newSelection;
}

function moveSelectionRight(selection, shift) {
    let newPosition = selection.active.translate(0, shift);
    return new vscode.Selection(newPosition, newPosition);
}

function normal_enter() {
    let editor = vscode.window.activeTextEditor;
    let selection = editor.selection;
    if (!selection.isEmpty) {
        return;
    }
    let cur_line_index = selection.active.line;
    let cur_line_obj = editor.document.lineAt(cur_line_index);
    let left_bracket_pos = has_left_bracket(cur_line_obj.text);
    let first_left_bracket_pos = left_bracket_pos[0];
    let last_left_bracket_pos = left_bracket_pos[1];
    let is_function = left_bracket_pos[2];
    if (last_left_bracket_pos === -1 || is_function === 0) {
        let cursor_position = selection.start.character;
        if (all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)) { //cursor is at the begining of a sentence
            editor.edit((builder) => {
                builder.insert(new vscode.Position(cur_line_index, 0), '\n');
            });
        } else {
            vscode.commands.executeCommand('editor.action.insertLineAfter');
        }
        // vscode.window.showInformationMessage(String(all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)));
    } else {
        let first_char = util.get_nonWhitespace_position(cur_line_obj.text);
        editor.edit((builder) => {
            // vscode.window.showInformationMessage(String(left_bracket_pos));
            builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos), '\n' + ' '.repeat(first_char));
            builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + '    ' + ' '.repeat(first_char) + '\n' + ' '.repeat(first_char));
            vscode.commands.executeCommand('cursorLineStart');
        }).then(() => {
            editor.selection = moveSelectionDown2Line(editor.selection, 4 + first_char);
        });
    }
}

function has_left_bracket(line) {
    let last_position = -1;
    let first_position = -1;
    let is_function = 0;
    let function_stack = ['}', ')'];
    for (let i = 0; i < line.length; ++i) {
        if (line[i] === '(' || line[i] === '{' || line[i] === '[') {
            if (first_position === -1) {
                first_position = i;
            }
            last_position = i;
        }
        if (function_stack.length !== 0 && function_stack[function_stack.length - 1] === line[i]) {
            function_stack.pop();
        }
    }
    is_function = function_stack.length === 0 ? 1 : 0;
    return [first_position, last_position, is_function];
}

function all_is_whitespace_until_cursor_position(line, position) {
    let result = true;
    for (let i = 0; i < position; ++i) {
        if (/\s/.test(line[i]))
            continue;
        else
            return false;
    }
    return result;
}
// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map