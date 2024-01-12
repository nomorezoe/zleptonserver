"strict mode"

function Tool() {

}

Tool.randomInt = function(max){
    return Math.floor(Math.random() * max);
}

module.exports = Tool;
