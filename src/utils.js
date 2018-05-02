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
}

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
}