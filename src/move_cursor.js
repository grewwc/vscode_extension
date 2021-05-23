exports.moveSelectionDownNLine = function(selection, shift, N) {
    let newPosition = selection.active.translate(N, shift);
    return new vscode.Selection(newPosition, newPosition);
}


exports.moveSelectionRight = function(selection, shift) {
    let newPosition = selection.active.translate(0, shift);
    return new vscode.Selection(newPosition, newPosition);
}