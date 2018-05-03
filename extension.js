'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

const utils = require("./src/utils");

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

    _is_union_def(line) {
        return line.trim().startsWith("union ");
    }

    _is_enum_def(line) {
        return line.trim().startsWith("enum ");
    }

    add_semicolon() { //actually the main function
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
            normal_enter();
            return;
        }
        let left_bracket_index = brackets_index[0];
        let right_bracket_index = brackets_index[1];
        // let start_of_line = vscode.commands.executeCommand('cursorLineStart');
        let left_bracket_pos = new vscode.Position(cur_line_index, left_bracket_index);
        let right_bracket_pos = new vscode.Position(cur_line_index, right_bracket_index + 1);
        if (this._is_struct_def(cur_line_obj.text) || this._is_class_def(cur_line_obj.text) ||
            this._is_enum_def(cur_line_obj.text) || this._is_union_def(cur_line_obj.text)) {
            let first_char = utils.get_nonWhitespace_position(cur_line_obj.text);
            let blankspace = ' '.repeat(first_char);
            //add semicolon
            vscode.commands.executeCommand("acceptSelectedSuggestion")
                .then(() => {
                    editor.edit((builder) => {
                        builder.insert(left_bracket_pos, '\n' + blankspace);
                        builder.insert(new vscode.Position(cur_line_index, left_bracket_index + 1), '\n' + '    ' + blankspace + '\n' + blankspace);
                        builder.insert(right_bracket_pos, ';');
                        vscode.commands.executeCommand("cursorLineStart");
                    }).then(() => {
                        editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, 2);
                    });
                });
        } else {
            normal_enter();
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
}

function moveSelectionDownNLine(selection, shift, N) {
    let newPosition = selection.active.translate(N, shift);
    let newSelection = new vscode.Selection(newPosition, newPosition);
    return newSelection;
}


function moveSelectionRight(selection, shift) {
    let newPosition = selection.active.translate(0, shift);
    return new vscode.Selection(newPosition, newPosition);
}

function normal_enter() { // consider if is a function

    const _is_else_def = function (line) {
        return /else /.test(line) || /else{/.test(line);
    }

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
    let cursor_position = selection.start.character; //test if current cursor is in '{}'

    let first_char = utils.get_nonWhitespace_position(cur_line_obj.text);
    let blank_space = ' '.repeat(first_char);
    if (last_left_bracket_pos === -1 || is_function === 0) {
        utils.private_public_align(editor, selection, cursor_position, cur_line_index, cur_line_obj);
        utils.only_left_curly_bracket(editor, selection, cursor_position, cur_line_index, cur_line_obj);
        if (utils.all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)) { //cursor is at the begining of a sentence
            editor.edit((builder) => {
                builder.insert(new vscode.Position(cur_line_index, 0), '\n');
            });
        } else if (utils.not_in_curly_braces(cur_line_obj.text, cursor_position)) { //cursor is not in curly brackets            
            editor.edit((builder) => {
                builder.insert(new vscode.Position(cur_line_index, cursor_position), '\n' + blank_space);
            });
        } else {
            let is_else_def = _is_else_def(cur_line_obj.text);
            // vscode.commands.executeCommand('editor.action.insertLineAfter');
            editor.edit((builder) => {
                    // let char_pos = _is_else_def(cur_line_obj.text) ? last_left_bracket_pos : last_left_bracket_pos + 1;
                    // utils.print(String(char_pos) + " " + last_left_bracket_pos);
                    if (is_else_def) {
                        builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos), '\n' + blank_space);
                    }
                    builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + blank_space + ' '.repeat(4));
                    builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + blank_space);
                    vscode.commands.executeCommand('cursorLineStart');
                })
                .then(() => {
                    let num_of_line_down = is_else_def ? 2 : 1;
                    editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, num_of_line_down);
                });
        }
        // vscode.window.showInformationMessage(String(all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)));
    } else if (is_function === 1) { // is a function 
        if (!utils.is_last_char(cur_line_obj.text, editor.selection.active.character)) {
            editor.edit((builder) => {
                // vscode.window.showInformationMessage(String(left_bracket_pos));
                builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos), '\n' + blank_space);
                builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + '    ' + blank_space + '\n' + blank_space);
                vscode.commands.executeCommand('cursorLineStart');
            }).then(() => {
                editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, N);
            });
        } else {

            vscode.commands.executeCommand('editor.action.insertLineAfter');
        }
    }
}

function has_left_bracket(line) {
    let last_position = -1;
    let first_position = -1;
    let is_function = 0;
    let function_stack = ['}', ')'];
    const line_length = line.length;
    for (let i = 0; i < line_length; ++i) {
        let temp = line[i];
        if (temp === '(' || temp === '{' || temp === '[') {
            if (first_position === -1) {
                first_position = i;
            }
            last_position = i;
        }
        if (function_stack.length !== 0 && function_stack[function_stack.length - 1] === temp) {
            function_stack.pop();
        }
    }
    is_function = function_stack.length === 0 ? 1 : 0;
    return [first_position, last_position, is_function];
}






// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map