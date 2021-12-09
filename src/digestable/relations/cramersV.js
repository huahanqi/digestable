import * as ss from 'simple-statistics';
import { getUniqueValues } from './utils';

const chiSquared = (dimension1, categories1, dimension2, categories2) => {
    const categoryCounts = values => {
      return values.reduce((counts, value) => {
        if (!counts[value]) counts[value] = 1;
        else counts[value]++;
        return counts;
      }, {});
    };
  
    // Get counts per dimension
    const counts1 = categoryCounts(dimension1, categories1);
    const counts2 = categoryCounts(dimension2, categories2);
  
    // Initialize object for value counts
    const counts = categories1.reduce((counts, c1) => {
      counts[c1] = {};
  
      categories2.forEach(c2 => {
        counts[c1][c2] = 0;
      });
  
      return counts;
    }, {});
  
    // Get counts
    dimension1.forEach((v1, i) => {
      const v2 = dimension2[i];
  
      counts[v1][v2]++;
    });
  
    // Get expected and observed values
    const n = dimension1.length;
    const observed = [];
    const expected = [];
  
    categories1.forEach(c1 => {
      categories2.forEach(c2 => {
        observed.push(counts[c1][c2]);
        expected.push(counts1[c1] * counts2[c2] /  n);
      });
    });
  
    // Compute chi squared
    return ss.sumSimple(observed.map((o, i) => {
      const e = expected[i];
  
      return Math.pow(o - e, 2) / e;
    }));
  }
  
  export const cramersV = (dimension1, dimension2) => {
    const categories1 = getUniqueValues(dimension1);
    const categories2 = getUniqueValues(dimension2);
  
    // XXX: What should be returned here?
    if (categories1.length === 1 || categories2.length === 1) return 0;
  
    const chi2 = chiSquared(dimension1, categories1, dimension2, categories2);
  
    const n = dimension1.length;
    const k1 = categories1.length;
    const k2 = categories2.length;
    const k = Math.min(k1, k2);
  
    if (k1 === 2 && k2 === 2) {
      // Use phi
  //    console.log("Phi: ", Math.sqrt(chi2 / n));
      return Math.sqrt(chi2 / n);
    }
    else {
      // Use Cramers V
  //    console.log("V: ", Math.sqrt(chi2 / (n * (k - 1))));
      return Math.sqrt(chi2 / (n * (k - 1)));
    }
  };