const vscode = require('vscode');

const struct = /struct /;
const class_ = /class /;
const switch_ = /switch[ (]/;
const friend_class = /friend class/;
const friend_struct = /friend struct/;
const whiteCharacter = /s/;

exports.is_last_char = function (line, cursor_pos) {
  for (let i = cursor_pos; i < line.length; ++i) {
    if (line[i] === " ") {
      continue;
    } else {
      return false;
    }
  }
  return true;
};

exports.not_in_curly_braces = function (line, cursor_position) {
  if (line.length === 0) {
    return true;
  }
  let has_left = false;
  let has_right = false;

  for (let i = cursor_position - 1; i >= 0; --i) {
    while (i >= 0 && line[i] === ' ') {
      --i;
    }
    if (line[i] === '{') {
      has_left = true;
      break;
    }
  }

  for (let i = cursor_position; i < line.length; ++i) {
    while (i < line.length && line[i] === ' ') {
      ++i;
    }
    if (line[i] === '}') {
      has_right = true;
      break;
    }
  }
  return !(has_left && has_right);
};


exports.all_is_whitespace_until_cursor_position = function (line, position) {
  let result = true;
  for (let i = 0; i < position; ++i) {
    if (whiteCharacter.test(line[i]))
      continue;
    else
      return false;
  }
  return result;
};

exports.get_nonWhitespace_position = function (line) {
  let pos = 0;
  for (let c of line) {
    if (c === ' ') {
      pos++;
    } else {
      return pos;
    }
  }
  return pos;
};


exports.private_public_align = function (editor, cursor_pos, cur_line_pos, cur_line_obj) {
  // const lang_support = ["cpp"];
  if (!only_private_or_public()) {
    return;
  }

  let first_char_pos = exports.get_nonWhitespace_position(cur_line_obj.text);
  let space_should_remain = find_the_last_struct_line();

  let start_pos = new vscode.Position(cur_line_pos, space_should_remain);
  let end_pos = new vscode.Position(cur_line_pos, first_char_pos);
  let pos = new vscode.Position(cur_line_pos, cursor_pos);
  // vscode.window.showInformationMessage(String(space_should_remain));

  if (first_char_pos >= space_should_remain) {
    editor.edit((builder) => {
      builder.delete(new vscode.Range(start_pos, end_pos));
      builder.insert(pos, '\n' + ' '.repeat(space_should_remain + 4));
    });
  } else {
    editor.edit((builder) => {
      builder.insert(new vscode.Position(cur_line_pos, 0), ' '.repeat(space_should_remain));
      builder.insert(pos, '\n' + ' '.repeat(space_should_remain + 4));
    });
  }

  function only_private_or_public() {
    const temp_trim = cur_line_obj.text.trim();
    // test "switch case" first
    // case (something):
    let case_keyword = false;
    if ((temp_trim.startsWith("case(") || temp_trim.startsWith('case '))
      && (temp_trim.endsWith(':'))) {
      case_keyword = true;
    }

    if (temp_trim.startsWith('default') && temp_trim.endsWith(':')) {
      case_keyword = true;
    }
    let res = temp_trim === "private:" || temp_trim === "public:" || temp_trim === "protected:" || case_keyword;
    return res;
  }

  function find_the_last_struct_line() {
    let first_struct_char_pos = 0;

    for (let i = cur_line_pos; i >= 0; --i) {
      let ith_line_obj = editor.document.lineAt(i).text;
      if ((struct.test(ith_line_obj) || class_.test(ith_line_obj))
        && !(friend_class.test(ith_line_obj) || friend_struct.test(ith_line_obj))) {
        first_struct_char_pos = exports.get_nonWhitespace_position(ith_line_obj);
        break;
      }
      if (switch_.test(ith_line_obj)) {
        first_struct_char_pos = exports.get_nonWhitespace_position(ith_line_obj);
        break;
      }
    }
    return first_struct_char_pos;
  }

}

exports.only_left_curly_bracket = function (editor, selection, cursor_pos, cur_line_pos, cur_line_obj) {
  const line_content = cur_line_obj.text;
  let number_of_begin_whitespace = 0;
  let condition_satisfied = false;
  /* 
      the function check if the line only contains '{'.
      find '{' position and if condition_satisfied.
  */
  (function () {
    for (let i = 0; i < line_content.length; i++) {
      if (!condition_satisfied && line_content[i] === ' ') {
        number_of_begin_whitespace++;
        continue;
      }
      if (condition_satisfied === false && line_content[i] === '{') {
        condition_satisfied = true;
        continue;
      }
      if (condition_satisfied && line_content[i] !== ' ') {
        condition_satisfied = false;
      }
    }
  })();

  condition_satisfied = condition_satisfied && (number_of_begin_whitespace < cursor_pos);
  if (!condition_satisfied) {
    return;
  }

  editor.edit((builder) => {
    // vscode.window.showInformationMessage(String(cursor_pos));
    builder.insert(new vscode.Position(cur_line_pos, cursor_pos), '\n' + ' '.repeat(number_of_begin_whitespace + 4));
  });
}


exports.isCatchBlock = (line) => {
  let idx = line.indexOf('catch');
  if (idx === -1) {
    return false;
  }

  for (let i = idx - 1; i >= 0; i--) {
    if (line[i] == ' ' || line[i] == '(') {
      break;
    }
    if (line[i] === '_' || (line[i] >= 'a' && line[i] <= 'z')
      || (line[i] >= 'A' && line[i] <= 'Z')) {
      return false;
    }
  }


  for (let i = idx + 5; i < line.length; i++) {
    if (line[i] == ' ' || line[i] == '(') {
      break;
    }
    if (line[i] === '_' || (line[i] >= 'a' && line[i] <= 'z')
      || (line[i] >= 'A' && line[i] <= 'Z')) {
      return false;
    }
  }
  return true;
}



exports.print = function (text) {
  vscode.window.showInformationMessage(text);
}



exports.findLeftParenthesesLine = function (editor, lineNo) {
  for (let j = lineNo; j >= 0; j--) {
    // this.print("lineNO " + lineNo + "  " + editor.document.lineAt(j));
    if (editor.document.lineAt(j).text.includes('(')) {
      return editor.document.lineAt(j).text;
    }
  }
  return null;
}

// exports.initial_enter = true;-