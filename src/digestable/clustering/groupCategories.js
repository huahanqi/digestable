export const groupCategories = values => {
  return values.reduce((clusters, value, i, a) => {
    if (i === 0) {
      clusters.push([i]);
    }
    else {
      if (value === a[i - 1]) {
        clusters[clusters.length -1].push(i);
      }
      else {
        clusters.push([i]);
      }
    }

    return clusters;
  }, []);
}