'use strict';

const { type } = require("os");
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// const begin_end = require('./src/latex/begin_end');
const utils = require("./src/utils");

// const move_cursor = require("./src/move_cursor"); 
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  let add_func = vscode.commands.registerCommand('extension.addSemicolon', () => {
    let process_enter = new special_enter();
    process_enter.process_enter();
  });
  context.subscriptions.push(add_func);
}

exports.activate = activate;


class special_enter {
  _is_keywaord_def(keyword) {
    const between_quotes = utils.between_quotes(this.line_obj, keyword);
    const contains_keyword = this.line_obj.includes(keyword);
    // bugs, fix later 
    if (contains_keyword) {
      return !between_quotes;
    }
    return false;
  }

  _is_struct_def() {
    return this._is_keywaord_def("struct ");
  }

  _is_class_def() {
    return this._is_keywaord_def("class ");
  }

  _is_union_def() {
    return this._is_keywaord_def("union ");
  }

  _is_enum_def() {
    return this._is_keywaord_def("enum ");
  }

  _is_try_def(name = "try") {
    const try_pos = this.line_obj.indexOf(name);
    const length = this.line_obj.length;
    if (try_pos === -1) {
      return false;
    }
    for (let i = try_pos + name.length; i < length; ++i) {
      if (this.line_obj[i] === ' ') {
        continue;
      }
      if (this.line_obj[i] === '{') {
        return !utils.not_in_curly_braces(this.line_obj, this.cursor_position);
      }
    }
    return false;
  }

  _is_namespace_def() {
    return this._is_try_def("namespace");
  }

  _is_do_def() {
    return this._is_try_def("do");
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
    this._is_enum_def, this._is_union_def, this._is_namespace_def,
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
              if (!this._is_try_def() && !this._is_namespace_def() && !this._is_do_def()) {
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
    // return the LEFT & RIGHT curly braces at the same time
    // return type: [int, int] / null
    if (line.length === 0) {
      return null;
    } 1
    let first = line.indexOf('{');
    let second = line.indexOf('}');
    if (first === -1 || second === -1) {
      return null;
    }
    return [first, second];
  }
}


function normal_enter() { // consider if is a function
  const _is_else_like = function (line, keyword) {
    let condition1 = line.indexOf(`${keyword} `);
    let condition2 = -1;
    let condition3 = -1;
    let blank_space_between_else_and_left_bracket = -1;
    if (condition1 === -1) {
      condition2 = line.indexOf(`${keyword}{`);
    }
    if (condition1 === -1 && condition2 === -1) {
      condition3 = line.indexOf(`${keyword}`);
    }

    let else_pos = Math.max(condition1, condition2, condition3);

    let i = else_pos;
    let found = false;
    while (i >= 0) {
      if (line[i--] === '}') {
        found = true;
        break;
      }
      blank_space_between_else_and_left_bracket++;
    }
    if (!found) {
      return [else_pos, false, blank_space_between_else_and_left_bracket];
    } else {
      return [i + 1, true, blank_space_between_else_and_left_bracket];
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
  const has_round_bracket = cur_line_obj.text.indexOf('(') !== -1 && cur_line_obj.text.indexOf(')') !== -1;
  let is_function = left_bracket_pos[2];
  let cursor_position = selection.start.character; //test if current cursor is in '{}'
  let first_char = utils.get_nonWhitespace_position(cur_line_obj.text)
  let blank_space = ' '.repeat(first_char);
  function normal_enter_not_function() {
    // Any more format function should think about adding here.
    utils.private_public_align(editor, cursor_position, cur_line_index, cur_line_obj);
    // utils.only_left_curly_bracket(editor, selection, cursor_position, cur_line_index, cur_line_obj);

    if (utils.all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)) { //cursor is at the beginning of a sentence
      editor.edit((builder) => {
        builder.insert(new vscode.Position(cur_line_index, 0), '\n');  // move cursor down 
      });
    } else if (utils.not_in_curly_braces(cur_line_obj.text, cursor_position)
      || !utils.curly_brackets_empty(cur_line_obj.text)) { //cursor is not in curly brackets            
      editor.edit(builder => {
        builder.insert(new vscode.Position(cur_line_index, cursor_position), '\n' + blank_space);  // move cursor down
      });
    } else {
      let newPos = new vscode.Position(cur_line_index, last_left_bracket_pos + 1);
      // vscode.commands.executeCommand('editor.action.insertLineAfter');
      editor.edit((builder) => {
        builder.insert(newPos, '\n' + blank_space + ' '.repeat(4));
        builder.insert(newPos, '\n' + blank_space);
        // vscode.commands.executeCommand('cursorLineStart');
      })
        .then(() => {
          const num_of_line_down = -1;
          editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, num_of_line_down);
        });
    }
  }

  // vscode.window.showInformationMessage(last_left_bracket_pos, is_function)
  if (last_left_bracket_pos === -1 || is_function === 0) {
    normal_enter_not_function();
    // vscode.window.showInformationMessage(String(all_is_whitespace_until_cursor_position(cur_line_obj.text, cursor_position)));
  }
  // is a function 
  else if (is_function === 1 || is_function === 2) {
    // utils.print("is_function");
    let leftParenthesesLine = utils.findLeftParenthesesLine(editor, cur_line_index);
    let blankspace = 0;
    if (last_left_bracket_pos > 0 && cur_line_obj.text[last_left_bracket_pos - 1] !== ' ') {
      blankspace = 1;
    }
    if (is_function === 1) {
      first_char = utils.get_nonWhitespace_position(leftParenthesesLine);
    }
    let blank_space = ' '.repeat(first_char);
    const in_curly_braces = !utils.not_in_curly_braces(cur_line_obj.text, cursor_position);
    const curly_brackets_empty = utils.curly_brackets_empty(cur_line_obj.text);
    const ends_with_right_bracket = utils.ends_with_right_bracket(cur_line_obj.text);
    let is_lambda = false;
    if (in_curly_braces && curly_brackets_empty) {
      editor.edit((builder) => {
        // vscode.window.showInformationMessage(String(left_bracket_pos));
        const prev_right_bracket_index = utils.prev_right_bracket_index(cur_line_obj.text, cursor_position);
        const prev_left_round_braces_index = utils.prev_right_bracket_index(cur_line_obj.text, cursor_position, '(');
        const reference_sign_index = cur_line_obj.text.lastIndexOf('&');
        // const all_is_whitespace_until_cursor_position = utils.all_is_whitespace_until_cursor_position(cur_line_obj.text, prev_right_bracket_index);
        if (1) {
          let bracket_space = 0;
          if (cur_line_obj.text[prev_right_bracket_index + 1] !== ' ') {
            bracket_space = 1;
          }
          builder.insert(new vscode.Position(cur_line_index, prev_right_bracket_index + 1), ' '.repeat(bracket_space));
          bracket_space = 0;
          if (reference_sign_index > 0) {
            builder.insert(new vscode.Position(cur_line_index, reference_sign_index + 1), ' ');
          }
          let round_braces_space = 0;
          if (prev_left_round_braces_index >= 1 && cur_line_obj.text[prev_left_round_braces_index - 1] !== ' ') {
            if (cur_line_obj.text[prev_left_round_braces_index - 1] !== ']') {
              round_braces_space = 1;
            } else {
              is_lambda = true;
            }
          }
          builder.insert(new vscode.Position(cur_line_index, prev_left_round_braces_index), ' '.repeat(round_braces_space));
          round_braces_space = 0;
          if (is_lambda) {
            builder.insert(new vscode.Position(cur_line_index, cursor_position + 2), ';');
            // find equal_sign 
            const equalsign_idx = cur_line_obj.text.indexOf('=');
            if (equalsign_idx > 0) {
              if (equalsign_idx + 1 < cur_line_obj.text.length && cur_line_obj.text[equalsign_idx + 1] !== ' ') {
                builder.insert(new vscode.Position(cur_line_index, equalsign_idx + 1), ' ');
              }
              if (cur_line_obj.text[equalsign_idx - 1] !== ' ') {
                builder.insert(new vscode.Position(cur_line_index, equalsign_idx), ' ');
              }
            }
          }
        }
        builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos), ' '.repeat(blankspace));
        if (ends_with_right_bracket) {
          builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + '    ' + blank_space);
        } else {
          builder.insert(new vscode.Position(cur_line_index, last_left_bracket_pos + 1), '\n' + '    ' + blank_space + '\n' + blank_space);
        }
        // vscode.commands.executeCommand('cursorLineStart');
      }).then(() => {
        if (!ends_with_right_bracket) {
          editor.selection = moveSelectionDownNLine(editor.selection, 4 + first_char, -1);
        }
      });
    } else {
      // vscode.commands.executeCommand('editor.action.insertLineAfter');
      // utils.print("==>");
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
  let function_stack = [')'];
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

  // else if() block should not be treated like a function
  if (utils.isCatchBlock(line) || line.includes("else if")) {
    is_function = 0;
  }
  if ((line.includes("else ") || line.includes("else{"))
    || (line.includes("try ") || line.includes("try{"))
    || (line.includes("catch ") || line.includes("catch{"))) {
    is_function = 2;
  }
  if (utils.is_catch_like(line)) {
    is_function = 2;
  }
  return [first_position, last_position, is_function];
}




// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map