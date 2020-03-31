'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// const begin_end = require('./src/latex/begin_end');
const utils = require("./src/utils");

// const move_cursor = require("./src/move_cursor"); 
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    let lang = vscode.window.activeTextEditor.document.languageId;
    console.log('');
    if (lang === 'cpp' || lang === 'c') {
        let add_func = vscode.commands.registerCommand('extension.addSemicolon', () => {
            let process_enter = new special_enter();
            process_enter.process_enter();
        });
        context.subscriptions.push(add_func);
    }
}


exports.activate = activate;


class special_enter {

    _is_struct_def() {
        // return this.line_obj.trim().startsWith("struct ");
        return this.line_obj.includes("struct ");
    }
    _is_class_def() {
        return this.line_obj.includes("class ");
    }

    _is_union_def() {
        return this.line_obj.includes("union ");
    }

    _is_enum_def() {
        return this.line_obj.includes("enum ");
    }

    _is_try_def() {
        const try_pos = this.line_obj.indexOf("try");
        const length = this.line_obj.length;
        if (try_pos === -1) {
            return false;
        }
        for (let i = try_pos + 3; i < length; ++i) {
            while (this.line_obj[i] === ' ') {
                continue;
            }
            if (this.line_obj[i] === '{') {
                return !utils.not_in_curly_braces(this.line_obj, this.cursor_position);
            }
        }
        return false;
    }


    condition_register(condition_funcs) {
        let res = false;
        for (let func of condition_funcs) {
            res = res || func.apply(this);
        }
        return res;
    }

    process_enter() { //actually the main function

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

        this.line_obj = cur_line_obj.text;
        this.cursor_position = selection.start.character;

        let brackets_index = util._find_curly_braces(this.line_obj);

        if (!brackets_index) {
            normal_enter();
            return;
        }
        let left_bracket_index = brackets_index[0];
        let right_bracket_index = brackets_index[1];
        let left_bracket_pos = new vscode.Position(cur_line_index, left_bracket_index);
        let right_bracket_pos = new vscode.Position(cur_line_index, right_bracket_index + 1);

        if (this.condition_register([this._is_struct_def, this._is_class_def,
        this._is_enum_def, this._is_union_def, this._is_try_def
        ])) {
            if (!utils.not_in_curly_braces(this.line_obj, this.cursor_position)) {
                let first_char = utils.get_nonWhitespace_position(this.line_obj);
                let blankspace = ' '.repeat(first_char);
                /* 
                    add semicolon
                */
                vscode.commands.executeCommand("acceptSelectedSuggestion")
                    .then(() => {
                        editor.edit((builder) => {
                            builder.insert(left_bracket_pos, '\n' + blankspace);
                            builder.insert(new vscode.Position(cur_line_index, left_bracket_index + 1), '\n' + '    ' + blankspace + '\n' + blankspace);
                            if (!this._is_try_def()) {
                                builder.insert(right_bracket_pos, ';');
                            }
                        })
                        editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, 2);
                    });
            }
            else {
                normal_enter();
                return;
            }
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




function normal_enter() { // consider if is a function
    const langId = vscode.window.activeTextEditor.document.languageId;
    const _is_else_like = function (line, keyword) {
        let condition1 = line.indexOf(`${keyword} `);
        let condition2 = -1;
        let condition3 = -1;
        if (condition1 === -1) {
            condition2 = line.indexOf(`${keyword}{`);
        }
        if (condition1 === -1 && condition2 === -1) {
            condition3 = line.indexOf(`${keyword}`)
        }

        let else_pos = Math.max(condition1, condition2, condition3);

        let i = else_pos;
        let found = false;
        while (i >= 0) {
            if (line[i--] === '}') {
                found = true;
                break;
            }
        }
        if (!found) {
            return [else_pos, false];
        } else {
            return [i + 1, true];
        }
    }
    let editor = vscode.window.activeTextEditor;
    let selection = editor.selection;
    if (!selection.isEmpty) {
        return;
    }

    let cur_line_index = selection.active.line;
    let cur_line_obj = editor.document.lineAt(cur_line_index);
    let left_bracket_pos = has_left_bracket(cur_line_obj.text);
    let last_left_bracket_pos = left_bracket_pos[1];
    let is_function = left_bracket_pos[2];
    let cursor_position = selection.start.character; //test if current cursor is in '{}'
    let first_char = utils.get_nonWhitespace_position(cur_line_obj.text)
    let blank_space = ' '.repeat(first_char);
    function normal_enter_not_function() {
        // Any more format function should think about adding here.
        if (langId === 'cpp') {
            utils.private_public_align(editor, cursor_position, cur_line_index, cur_line_obj);
        }

        utils.only_left_curly_bracket(editor, selection, cursor_position, cur_line_index, cur_line_obj);

        if (utils.all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)) { //cursor is at the beginning of a sentence
            editor.edit((builder) => {
                builder.insert(new vscode.Position(cur_line_index, 0), '\n');
            });
        } else if (utils.not_in_curly_braces(cur_line_obj.text, cursor_position)) { //cursor is not in curly brackets            
            editor.edit((builder) => {
                builder.insert(new vscode.Position(cur_line_index, cursor_position), '\n' + blank_space);
            });
        } else {
            let else_def_pos_pair = _is_else_like(cur_line_obj.text, 'else');
            let else_def_pos = else_def_pos_pair[0];
            if (else_def_pos === -1) {
                else_def_pos_pair = _is_else_like(cur_line_obj.text, 'catch');
                else_def_pos = else_def_pos_pair[0];
            }
            let has_right_bracket_before = else_def_pos_pair[1];
            let newPos = new vscode.Position(cur_line_index, last_left_bracket_pos + 1);
            // vscode.commands.executeCommand('editor.action.insertLineAfter');
            editor.edit((builder) => {
                // let char_pos = _is_else_def(cur_line_obj.text) ? last_left_bracket_pos : last_left_bracket_pos + 1;
                // utils.print(String(char_pos) + " " + last_left_bracket_pos);
                if (else_def_pos !== -1) {
                    // utils.print(String(else_def_pos));
                    if (has_right_bracket_before) {
                        builder.insert(new vscode.Position(cur_line_index, else_def_pos + 1), '\n' + ' '.repeat(else_def_pos));
                    }
                    builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos), '\n' + blank_space);
                }
                builder.insert(newPos, '\n' + blank_space + ' '.repeat(4));
                builder.insert(newPos, '\n' + blank_space);
                vscode.commands.executeCommand('cursorLineStart');
            })
                .then(() => {
                    let num_of_line_down = else_def_pos !== -1 ? -1 : -1;
                    if (!has_right_bracket_before && else_def_pos !== -1) {
                        num_of_line_down = -1;
                    }
                    editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, num_of_line_down);
                });
        }
    }

    // vscode.window.showInformationMessage(last_left_bracket_pos, is_function)
    if (last_left_bracket_pos === -1 || is_function === 0) {
        normal_enter_not_function();
        // vscode.window.showInformationMessage(String(all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)));
    } else if (is_function === 1) { // is a function 
        let leftParenthesesLine = utils.findLeftParenthesesLine(editor, cur_line_index);
        let first_char = utils.get_nonWhitespace_position(leftParenthesesLine);
        let blank_space = ' '.repeat(first_char);
        if (!utils.is_last_char(cur_line_obj.text, editor.selection.active.character) &&
            !utils.not_in_curly_braces(cur_line_obj.text, cursor_position)) {
            editor.edit((builder) => {
                // vscode.window.showInformationMessage(String(left_bracket_pos));
                builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos), '\n' + blank_space);
                builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + '    ' + blank_space + '\n' + blank_space);
                vscode.commands.executeCommand('cursorLineStart');
            }).then(() => {
                editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, -1);
            });
        } else {
            // vscode.commands.executeCommand('editor.action.insertLineAfter');
            normal_enter_not_function();
        }
    }
}

const moveSelectionDownNLine = function (selection, shift, N) {
    let newPosition = selection.active.translate(N, shift);
    return new vscode.Selection(newPosition, newPosition);
};



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
    if (utils.isCatchBlock(line)) {
        is_function = 0;
    }
    return [first_position, last_position, is_function];
}


// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map