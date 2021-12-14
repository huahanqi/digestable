import * as d3 from 'd3';

export const clusterGap = (values, numRows) => {
  const gaps = d3.pairs(values).map((d, i) => ({ value: Math.abs(d[1] - d[0]), index: i }));

  gaps.sort((a, b) => {
    return a.value === b.value ? d3.ascending(a.index, b.index) : d3.descending(a.value, b.value);
  });

  const clusters = gaps.slice(0, numRows);

  clusters.sort((a, b) => d3.ascending(a.index, b.index));

  return clusters.reduce((clusters, gap, i, gaps) => {

    console.log(clusters);
    if (i === gaps.length - 1) {
      clusters.push(d3.range(gap.index, values.length));
    }
    else {
      clusters.push(d3.range(gap.index, gaps[i + 1].index));
    }

    return clusters;
  }, []);
};