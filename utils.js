const search = (str, sub, s, e, step) => {
  let i;
  for (i = s; i < e - step; i++) {
    if (str.substring(i, i + step) === sub) break;
  }
  return i;
};

const domainExtract = (url) => {
  if (!url) return [0, 0];
  const len = url.length;
  let i = search(url, "http", 0, len, 4);
  let j = search(url, ".com", i, len, 4);
  return [i, j + 4];
};

exports.search = search;
exports.domainExtract = domainExtract;
