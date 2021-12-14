import * as d3 from 'd3';

export const clusterGap = (values, numRows) => {
  const gaps = d3.pairs(values).map((d, i) => ({ value: Math.abs(d[1] - d[0]), index: i }));

  gaps.sort((a, b) => {
    return a.value === b.value ? d3.ascending(a.index, b.index) : d3.descending(a.value, b.value);
  });

  const clusters = gaps.slice(0, numRows - 1).map(gap => gap.index);

  clusters.sort(d3.ascending);
  clusters.unshift(-1);
  clusters.push(values.length - 1);
  
  return d3.pairs(clusters).map(d => d3.range(d[0] + 1, d[1] + 1));
};