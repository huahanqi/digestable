import * as d3 from 'd3';

export const clusterQuantiles = (values, n) => {
  const range = d3.range(n);

  const scale = d3.scaleQuantile()
    .domain(values)
    .range(range);

  return values.reduce((clusters, value, i) => {
    clusters[scale(value)].push(i);
    return clusters;
  }, range.map(() => []));
};