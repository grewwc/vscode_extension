let t1 = function () {
    console.log("here");
}

exports.t2 = function () {
    t1();
}

const func = function (a) {
    const inner_func = function () {
        console.log(++a);
    }
    inner_func();
    return a;
}

console.log(/else /.test("     else {}"))

let a = 20 > 10 ? 20 : 10;
console.log(a);