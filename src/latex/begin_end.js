/* 
    auto pair 'begin' and 'end'
*/
const vscode = require('vscode');
const utils = require('../utils');
// const move_cursor = require('../move_cursor');  
/* not sure why these function cannot be put outside of the file */

exports.begin_end = function (editor, selection, cur_line_num, cur_line_obj, cursor_position) {
    // utils.print("here");
    const cur_line_text = cur_line_obj.text;
    const begin_index = cur_line_text.indexOf("\\begin");
    if (begin_index === -1) {
        return;
    }

    const left_curly_bracket_pos = cur_line_text.indexOf("}");
    if (left_curly_bracket_pos === -1) {
        return;
    }

    const content_between_curly_brackets = parse_content_in_curly_bracket(cur_line_text);
    if (!utils.not_in_curly_braces(cur_line_text, cursor_position)) {
        editor.edit((builder) => {
                builder.insert(new vscode.Position(cur_line_num, left_curly_bracket_pos + 1), '\n' + ' '.repeat(2 + begin_index));
                builder.insert(new vscode.Position(cur_line_num, left_curly_bracket_pos + 1),
                    '\n' + ' '.repeat(begin_index) + '\\end{' + content_between_curly_brackets + '}');
                vscode.commands.executeCommand("cursorLineStart");
            })
            .then(() => {
                // utils.print(String(begin_index));
                editor.selection = moveSelectionDownNLine(selection, 2 + begin_index, 1);
            });
    }
    else
    {
        editor.edit((builder)=>
        {
            builder.insert(new vscode.Position(cur_line_num, left_curly_bracket_pos + 1), '\n' + ' '.repeat(2 + begin_index));
        });
    }
}



function parse_content_in_curly_bracket(cur_line_obj_text) {
    const begin = cur_line_obj_text.indexOf("{");
    const end = cur_line_obj_text.indexOf("}");
    let res = "";
    if (begin === -1 || end === -1) {
        return res;
    }
    for (let i = begin + 1; i != end; ++i) {
        res += cur_line_obj_text[i];
    }
    return res;
}



const moveSelectionDownNLine = function (selection, shift, N) {
    let newPosition = selection.active.translate(N, shift);
    return new vscode.Selection(newPosition, newPosition);
};


const moveSelectionRight = function (selection, shift) {
    let newPosition = selection.active.translate(0, shift);
    return new vscode.Selection(newPosition, newPosition);
};