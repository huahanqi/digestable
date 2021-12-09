import * as ss from 'simple-statistics';

export const correlation = (d1, d2) => {
  const r = ss.sampleCorrelation(d1, d2);

  return isNaN(r) ? 0 : r;
};