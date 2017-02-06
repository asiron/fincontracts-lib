Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

var tupleMUL = (i) => i[0] * i[1];
var zip = (a1, a2) => a1.map((x, i) => [x, a2[i]]); 

makeArray = (size, obj) => Array.apply(null, Array(size)).map(_ => obj)