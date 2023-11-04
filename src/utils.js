const vscode = require('vscode');

const struct = /struct /;
const class_ = /class /;
const switch_ = /switch[ (]/;
const friend_class = /friend class/;
const friend_struct = /friend struct/;


exports.print = function (text) {
  vscode.window.showInformationMessage(text);
}


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

exports.curly_brackets_empty = function (line) {
  line = line.trim();
  const empty_curly_brackets = /.*\{\s*\}/g;
  return empty_curly_brackets.test(line);
}

exports.only_left_curly_bracket = function (line) {
  line = line.trim();
  const empty_curly_brackets_without_right = /^.*\{\s*$/g;
  return empty_curly_brackets_without_right.test(line);
}


exports.prev_right_bracket_index = function (line, cursor_pos, ch = '}') {
  if (cursor_pos <= 0) {
    return -1;
  }
  line = line.substring(0, cursor_pos);
  return line.lastIndexOf(ch);
}

exports.is_catch_like = function (line) {
  const catch_keyword = /catch\(.*\)\s*{/;
  return catch_keyword.test(line);
}

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
  line = line.trim();
  if (line.length > 0 && line[line.length - 1] === '{') {
    has_right = true;
  }
  return !(has_left && has_right);
};


exports.all_is_whitespace_until_cursor_position = function (line, position) {
  const whiteCharacter = /s/;
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

const between_quotes = (line_content, keyword) => {
  const first_quote_index = line_content.indexOf("\"");
  if (first_quote_index < 0) {
    return false;
  }

  const next_quote_index = line_content.indexOf("\"", first_quote_index + 1);
  if (next_quote_index < 0) {
    return false;
  }
  let result = line_content.substring(first_quote_index + 1, next_quote_index).includes(keyword);
  return result;
}

exports.ends_with_right_bracket = function (line) {
  line = line.trim();
  if (line.length === 0) {
    return false;
  }
  return line[line.length - 1] === '{';
}

exports.private_public_align = function (editor, cursor_pos, cur_line_pos, cur_line_obj) {
  // const lang_support = ["cpp"];
  let test = only_private_or_public();
  if (test === 0) return;

  let looking_for_switch = test === 2 ? true : false;

  let first_char_pos = exports.get_nonWhitespace_position(cur_line_obj.text);
  let space_should_remain = find_the_last_struct_line(looking_for_switch) + 2;

  // exports.print("here " + space_should_remain);
  let start_pos = new vscode.Position(cur_line_pos, space_should_remain);
  let end_pos = new vscode.Position(cur_line_pos, first_char_pos);
  let pos = new vscode.Position(cur_line_pos, cursor_pos);
  // vscode.window.showInformationMessage(String(space_should_remain));

  if (first_char_pos >= space_should_remain) {
    editor.edit((builder) => {
      builder.delete(new vscode.Range(start_pos, end_pos));
      builder.insert(pos, '\n' + ' '.repeat(space_should_remain + 2));
    });
  } else {
    editor.edit((builder) => {
      builder.insert(new vscode.Position(cur_line_pos, 0), ' '.repeat(space_should_remain - first_char_pos));
      builder.insert(pos, '\n' + ' '.repeat(space_should_remain + 2));
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
    let res = temp_trim === "private:" || temp_trim === "public:" || temp_trim === "protected:";
    if (res) {
      return 1;
    }

    if (case_keyword) {
      return 2;
    }

    return 0;
  }

  function find_the_last_struct_line(looking_for_switch = false) {
    let first_struct_char_pos = 0;

    for (let i = cur_line_pos; i >= 0; --i) {
      let ith_line_obj = editor.document.lineAt(i).text;
      if ((struct.test(ith_line_obj) || class_.test(ith_line_obj))
        && !(friend_class.test(ith_line_obj) || friend_struct.test(ith_line_obj))) {
        if (between_quotes(ith_line_obj, "struct ") || between_quotes(ith_line_obj, "class ")) {
          continue;
        }
        first_struct_char_pos = exports.get_nonWhitespace_position(ith_line_obj);
        break;
      } else if (looking_for_switch && switch_.test(ith_line_obj)) {
        if (between_quotes(ith_line_obj, "switch ")) {
          continue;
        }
        first_struct_char_pos = exports.get_nonWhitespace_position(ith_line_obj);
        break;
      }
    }
    return first_struct_char_pos;
  }

}

// exports.only_left_curly_bracket = function (editor, selection, cursor_pos, cur_line_pos, cur_line_obj) {
//   const line_content = cur_line_obj.text.substring(0, cursor_pos);
//   const left_bracket_index = line_content.indexOf('{');
//   const right_bracket_index = line_content.indexOf('}');
//   if (left_bracket_index === -1
//     || (left_bracket_index !== -1 && right_bracket_index !== -1)) {
//     return;
//   }
//   const sub_content = line_content.substring(0, Math.min(left_bracket_index, cursor_pos));
//   let number_of_begin_whitespace = 0;
//   while (number_of_begin_whitespace < sub_content.length && sub_content[number_of_begin_whitespace] === ' ') {
//     number_of_begin_whitespace++;
//   }
//   editor.edit((builder) => {
//     // vscode.window.showInformationMessage(String(cursor_pos));
//     builder.insert(new vscode.Position(cur_line_pos, cursor_pos), '\n' + ' '.repeat(number_of_begin_whitespace + 4));
//   });
// }


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






exports.findLeftParenthesesLine = function (editor, lineNo) {
  for (let j = lineNo; j >= 0; j--) {
    // this.print("lineNO " + lineNo + "  " + editor.document.lineAt(j));
    if (editor.document.lineAt(j).text.includes('(')) {
      return editor.document.lineAt(j).text;
    }
  }
  return null;
}

exports.between_quotes = between_quotes;
// exports.initial_enter = true;-