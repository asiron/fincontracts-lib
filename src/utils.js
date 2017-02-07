Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

tupleMUL = (i) => i[0] * i[1];
zip = (a1, a2) => a1.map((x, i) => [x, a2[i]]); 

flatten   = (arr) => arr.reduce((a,b) => a.concat(b));
cross     = (arr1,arr2) => arr1.map(a => arr2.map(b => [a,b]));
makeArray = (size, obj) => Array.apply(null, Array(size)).map(_ => obj)