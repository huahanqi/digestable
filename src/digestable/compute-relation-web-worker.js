import * as d3 from 'd3';
import { categoricalRegression, correlation, cramersV } from './relations';

// on message
// eslint-disable-next-line no-restricted-globals
self.onmessage = (e) => {
  let { relations, columns, allData } = e.data;
  if (e && e.data) {
    //console.log('Worker: Message received from main script');
    computeRelations();
    // post message back
    //console.log('Worker: Posting message back to main script');
    postMessage({ relations, columns });
  }

  // Compute relations
  function computeRelations() {
    relations = columns.reduce((relations, column1, i, a) => {
      const v1 = allData.map((d) => d.values[column1.name]);

      for (let j = i + 1; j < a.length; j++) {
        const column2 = a[j];
        const v2 = allData.map((d) => d.values[column2.name]);

        const value =
          column1.type === 'id' || column2.type === 'id'
            ? 0
            : column1.type === 'categorical' && column2.type === 'categorical'
            ? cramersV(v1, v2)
            : column1.type === 'categorical' && column2.type === 'numeric'
            ? categoricalRegression(v1, v2)
            : column1.type === 'numeric' && column2.type === 'categorical'
            ? categoricalRegression(v2, v1)
            : correlation(v1, v2);

        relations.push({
          source: column1,
          target: column2,
          value: value,
          magnitude: Math.abs(value),
        });
      }

      return relations;
    }, []);

    relations.sort((a, b) => d3.ascending(a.magnitude, b.magnitude));
  }
};
