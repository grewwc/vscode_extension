const vscode = require('vscode');

exports.is_last_char = function (line, cursor_pos) {
    let white_space = /\s/;
    for (let i = cursor_pos; i < line.length; ++i) {
        if (white_space.test(line[i])) {
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

    let whitespace = /\s/;
    let has_left = false;
    let has_right = false;

    for (let i = cursor_position - 1; i >= 0; --i) {
        while (i >= 0 && whitespace.test(line[i])) {
            --i;
        }
        if (line[i] === '{') {
            has_left = true;
            break;
        }
    }

    for (let i = cursor_position + 1; i < line.length; ++i) {
        while (i < line.length && whitespace.test(line[i])) {
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
    let white = /\s/;
    for (let c of line) {
        if (white.test(c)) {
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
    const original_selection = selection;

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