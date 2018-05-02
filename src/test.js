let t1 = function()
{
    console.log("here");
}

exports.t2 = function()
{
    t1();
}

exports.t2();