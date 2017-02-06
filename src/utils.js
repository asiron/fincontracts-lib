Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

var tupleMUL = function(i) { return i[0] * i[1]; };

var zip = function(arrA, arrB) {
  return arrA.map(function (e, i) {
    return [e, arrB[i]];
  });
};
