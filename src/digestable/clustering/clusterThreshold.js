import * as d3 from 'd3';

export const clusterThreshold = (values, threshold) => {
  const diffs = values.filter(d => d !== null).reduce((diffs, value, i, a) => {
    if (i === 0) return [];
    
    diffs[i - 1] = Math.abs(value - a[i - 1]);

    return diffs;
  }, []);

  const diffExtents = d3.extent(diffs);

  const t = (diffExtents[1] - diffExtents[0]) * threshold;

  const clusters = [];
  let cluster = [values.length - 1];

  const close = (a, b, t) => {
    return (a === null && b === null) || (Math.abs(a - b) <= t);
  };

  for (let i = values.length - 2; i >= 0; i--) {
    const v1 = values[i];
    const v2 = values[i + 1];

    if (close(v1, v2, t)) {
      cluster.push(i);
    }
    else {
      clusters.push(cluster);
      cluster = [i];
    }
  }

  clusters.push(cluster);

  clusters.reverse();

  return clusters;
};