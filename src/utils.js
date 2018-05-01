exports.is_last_char = function(line, cursor_pos){
    let white_space = /\s/;
    for(let i=cursor_pos; i<line.length; ++i){
        if(white_space.test(line[i])){
            continue;
        }else{
            return false;
        }
    }
    return true;
}

