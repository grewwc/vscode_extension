
/* 
    pretty block comment
 */


exports.block_comment = function(editor, selection, 
    cur_line_index, cur_line_obj_text)
{
    let in_block_mode = false;
    const start_pos = cur_line_obj_text.indexOf("/*");
    if(in_block_mode )
    
}


const find_start_position = function(cur_line_index, cur_line_obj_text)
{
    let start_pos = cur_line_obj_text.indexOf("/*");
    return start_pos;
}