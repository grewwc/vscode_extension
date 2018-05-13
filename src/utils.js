const vscode = require('vscode');

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
        if (/\s/.test(line[i]))
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


exports.private_public_align = function (editor, selection, cursor_pos, cur_line_pos, cur_line_obj) {

    const lang = vscode.window.activeTextEditor.document.languageId;
    const lang_support = ["cpp"];

    let first_char_pos = exports.get_nonWhitespace_position(cur_line_obj.text);
    if (!lang_support.includes(lang) || !only_private_or_public()) {
        return;
    }

    let space_should_remain = find_the_last_struct_line();

    let start_pos = new vscode.Position(cur_line_pos, space_should_remain);
    let end_pos = new vscode.Position(cur_line_pos, first_char_pos);
    // vscode.window.showInformationMessage(String(space_should_remain));

    if (first_char_pos >= space_should_remain) {
        editor.edit((builder) => {
            builder.delete(new vscode.Range(start_pos, end_pos));
            builder.insert(new vscode.Position(cur_line_pos, cursor_pos), '\n' + ' '.repeat(space_should_remain + 4));
        });
    } else {
        editor.edit((builder) => {
            builder.insert(new vscode.Position(cur_line_pos, 0), ' '.repeat(space_should_remain));
            builder.insert(new vscode.Position(cur_line_pos, cursor_pos), '\n' + ' '.repeat(space_should_remain + 4));
        });
    }

    function only_private_or_public() {
        const temp_trim = cur_line_obj.text.trim();
        return temp_trim === "private:" || temp_trim === "public:" || temp_trim === "protected:";
    }

    function find_the_last_struct_line() {
        let first_struct_char_pos = 0;
        const struct = /struct /;
        const class_ = /class /;
        for (let i = cur_line_pos; i >= 0; --i) {
            let ith_line_obj = editor.document.lineAt(i).text;
            if (struct.test(ith_line_obj) || class_.test(ith_line_obj)) {
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

exports.print = function (text) {
    vscode.window.showInformationMessage(text);
}

// exports.initial_enter = true;