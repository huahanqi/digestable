import * as d3 from 'd3';
import {
  clusterQuantiles,
  kmeans,
  clusterGap,
  groupCategories,
} from './clustering';
import './digestable.css';
// import worker for relation calculation
/* eslint-disable import/no-webpack-loader-syntax */
import Worker from 'worker-loader!./compute-relation-web-worker.js';

// import tippy for nicer tooltip
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

export const digestable = () => {
  // The table
  let table = d3.select(),
    linkSvg = d3.select(),
    // Data
    allData = [],
    data = [],
    columns = [],
    relations = [],
    clustering = false,
    // Parameters
    applySimplification = false,
    simplificationMethod = 'threshold',
    simplificationAmount = 0.9,
    simplificationRows = 20,
    transformBase = 1,
    visualizationMode = 'text',
    showLinks = false,
    // web-worker para
    isCalculating = false,
    categoryScaling = 'row',
    paddingX = 5,
    paddingY = 0,
    // Missing data
    missingValues = ['', 'NA', 'na'],
    isMissing = (d) => missingValues.includes(d),
    // Event dispatcher
    dispatcher = d3.dispatch('clusterByColumn'),
    dispatcher_calcRel = d3.dispatch('CalculateRelations'),
    // load more data parameters
    displayRowNum = 100,
    isFullData = false;

  function digestable(selection) {
    selection.each(function(d) {
      // Create SVG for links
      linkSvg = d3
        .select(this)
        .selectAll('.linkSvg')
        .data([[]])
        .join((enter) => enter.append('svg').attr('class', 'linkSvg'));

      // Create skeletal table
      table = d3
        .select(this)
        .selectAll('table')
        .data([[]])
        .join((enter) => {
          const table = enter.append('table');

          table.append('thead').append('tr');
          table.append('tbody');

          return table;
        });

      createColumns(d);
      createData(d);
      processData();
      sortTable();
      drawTable();
    });
  }

  // Helper functions
  const textVisibility = () =>
    visualizationMode === 'text' || visualizationMode === 'both'
      ? 'visible'
      : 'hidden';
  const visVisibility = () =>
    visualizationMode !== 'text' ? 'visible' : 'hidden';

  const getCounts = (uniqueValues, values) =>
    Object.entries(
      values.reduce(
        (counts, value) => {
          counts[value]++;
          return counts;
        },
        uniqueValues.reduce((counts, value) => {
          counts[value] = 0;
          return counts;
        }, {})
      )
    )
      .map(([key, value]) => ({
        value: key,
        count: value,
      }))
      .sort((a, b) => d3.descending(a.count, b.count));

  const significantDigits = (n) => {
    const log10 = Math.log(10);

    // Split decimal
    let [n1, n2] = String(n).split('.');

    // Handle left of decimal
    n1 = Math.abs(n1);
    const d1 = Math.floor(Math.log(n) / log10) + 1;

    // Handle right of decimal
    const d2 = n2
      ? n1 > 0
        ? n2.length
        : Math.floor(Math.log(+n) / log10) + 1
      : 0;

    return Math.max(d1 + d2, 1);
  };

  function clearSorting() {
    columns.forEach((d) => (d.sort = null));
  }

  function clearClustering() {
    columns.forEach((d) => (d.cluster = null));
  }

  function createColumns(inputData) {
    columns = inputData.columns.map((d) => ({
      name: d,
    }));
    const group = { name: 'group', type: 'group' };
    columns.unshift(group);
    console.log(columns);
    // Determine column types and set column info
    columns
      .filter((column) => column.type !== 'group')
      .forEach((column) => {
        const { name } = column;
        const values = inputData.map((d) => d[name]);
        const uniqueValues = Array.from(
          values.reduce((values, d) => values.add(d), new Set())
        );
        const validValues = uniqueValues.filter((value) => !isMissing(value));
        const numeric = validValues.reduce(
          (numeric, value) => numeric && !isNaN(value),
          true
        );
        const numbers = numeric ? validValues.map((d) => +d) : null;

        column.uniqueValues = uniqueValues;

        if (numeric) {
          if (numbers.length === inputData.length) {
            // Heuristic to check for integer ID type
            numbers.sort((a, b) => d3.ascending(a, b));

            const isId = numbers.reduce(
              (isId, d, i, a) => isId && (i === 0 || d === a[i - 1] + 1),
              true
            );

            column.type = isId ? 'id' : 'numeric';
          } else if (
            numbers.length === 2 &&
            numbers.includes(0) &&
            numbers.includes(1)
          ) {
            // Treat binary as categorical
            column.type = 'categorical';
          } else {
            column.type = 'numeric';
          }
        } else if (uniqueValues.length === inputData.length) {
          column.type = 'id';
        } else {
          column.type = 'categorical';
        }

        if (column.type === 'numeric') {
          column.values = values.filter((value) => !isMissing(value));
          column.extent = d3.extent(numbers);
          column.maxDigits = d3.max(numbers, significantDigits);
        } else if (column.type === 'categorical') {
          column.type = 'categorical';
          column.counts = getCounts(uniqueValues, values).sort(
            (a, b) => b.count - a.count
          );
          column.uniqueValues = column.counts.map(({ value }) => value);
        }
      });

    clearSorting();
    clearClustering();
  }

  function createData(inputData) {
    allData = inputData.map((d, i) => {
      const v = { ...d };

      // Convert missing and numeric data
      columns.forEach(({ type, name }) => {
        const value = v[name];

        if (isMissing(value)) {
          v[name] = null;
        } else if (type === 'numeric') {
          v[name] = +value;
        }
      });

      return {
        initialIndex: i,
        isCluster: false,
        cluster: null,
        pinned: false,
        expanded: false,
        values: v,
      };
    });
  }

  // function computeRelations() {
  //   // Compute relations
  //   relations = columns.reduce((relations, column1, i, a) => {
  //     const v1 = allData.map((d) => d.values[column1.name]);

  //     for (let j = i + 1; j < a.length; j++) {
  //       const column2 = a[j];
  //       const v2 = allData.map((d) => d.values[column2.name]);

  //       const value =
  //         column1.type === 'id' || column2.type === 'id'
  //           ? 0
  //           : column1.type === 'categorical' && column2.type === 'categorical'
  //           ? cramersV(v1, v2)
  //           : column1.type === 'categorical' && column2.type === 'numeric'
  //           ? categoricalRegression(v1, v2)
  //           : column1.type === 'numeric' && column2.type === 'categorical'
  //           ? categoricalRegression(v2, v1)
  //           : correlation(v1, v2);

  //       relations.push({
  //         source: column1,
  //         target: column2,
  //         value: value,
  //         magnitude: Math.abs(value),
  //       });
  //     }

  //     return relations;
  //   }, []);

  //   relations.sort((a, b) => d3.ascending(a.magnitude, b.magnitude));
  // }

  function sortByColumn(column) {
    const sort = column.sort === 'descending' ? 'ascending' : 'descending';

    clearSorting();

    column.sort = sort;
  }

  function clusterByColumn(column) {
    const cluster =
      column.cluster === null
        ? 'descending'
        : column.cluster === 'descending'
        ? 'ascending'
        : null;

    clearClustering();
    clearSorting();

    column.cluster = cluster;
  }

  function sortData() {
    const clusterColumn = columns.find(({ cluster }) => cluster);

    const sort = clusterColumn ? clusterColumn.cluster : 'ascending';

    allData.sort((a, b) => {
      const v1 = clusterColumn ? a.values[clusterColumn.name] : a.initialIndex;
      const v2 = clusterColumn ? b.values[clusterColumn.name] : b.initialIndex;

      return v1 === v2
        ? 0
        : v1 === null
        ? 1
        : v2 === null
        ? -1
        : d3[sort](v1, v2);
    });
  }

  function processData() {
    sortData();

    // Clear expanded
    allData.forEach((d) => (d.expanded = false));

    const clusterColumn = columns.find(({ cluster }) => cluster);

    // Initialize categorical and id column counts
    columns
      .filter(({ type }) => type !== 'numeric')
      .forEach((column) => (column.maxCount = 1));

    clustering =
      applySimplification && clusterColumn && clusterColumn.type !== 'id';

    if (clustering) {
      const { name, type, cluster: sort } = clusterColumn;

      const values = allData.map((d) => d.values[name]);

      const clusters = (type === 'numeric'
        ? clusterNumeric(values, sort)
        : clusterCategorical(values)
      ).filter((cluster) => cluster.length > 0);

      data = clusters.map((cluster) => {
        const size = cluster.length;

        // No cluster if only 1
        if (size === 1) {
          allData[cluster[0]].cluster = null;

          return allData[cluster[0]];
        }

        // Create row object
        const row = {
          isCluster: true,
          indeces: cluster,
          size: size,
          values: {},
        };

        // Set cluster object for each item
        cluster.forEach((i) => (allData[i].cluster = row));

        // Compute info based on column type
        columns.forEach((column) => {
          const { name, type, uniqueValues } = column;

          if (type === 'numeric') {
            const values = cluster.map((i) => allData[i].values[name]);

            if (values.length > 0) {
              const validValues = values.filter((d) => d !== null);

              row.values[name] =
                validValues.length > 0
                  ? {
                      valid: true,
                      values: values,
                      validValues: validValues,
                      min: d3.min(validValues),
                      max: d3.max(validValues),
                      median: d3.median(validValues),
                      q1: d3.quantile(validValues, 0.25),
                      q2: d3.quantile(validValues, 0.75),
                    }
                  : {
                      valid: false,
                      values: values,
                    };
            } else {
              row.values[name] = null;
            }
          } else if (type === 'categorical') {
            const values = cluster.map((i) => allData[i].values[name]);

            if (values.length > 0) {
              const counts = getCounts(uniqueValues, values);

              column.maxCount = Math.max(column.maxCount, counts[0].count);

              row.values[name] = {
                counts: counts,
              };
            } else {
              row.values[name] = null;
            }
          } else if (type === 'id') {
            const values = cluster.map((i) => allData[i].values[name]);

            if (values.length > 0) {
              const counts = values.map((value) => ({
                value: value,
                count: 1,
              }));

              row.values[name] = {
                counts: counts,
              };
            } else {
              row.values[name] = null;
            }
          } else {
            console.warn('Unknown column type: ' + type);
          }
        });

        return row;
      });
    } else {
      if (displayRowNum < [...allData].length) {
        data = [...allData].slice(0, displayRowNum);
      } else {
        data = [...allData];
        isFullData = true;
      }
    }

    function clusterNumeric(values, sort) {
      const transformValues = (values) => {
        const base = sort === 'ascending' ? 1 / transformBase : transformBase;

        const valueScale = d3
          .scaleLinear()
          .domain(d3.extent(values))
          .range([0, 1]);

        return values.map((d) => Math.pow(valueScale(d), base));
      };

      const removeNull = (values) => {
        // Find first null. Always sorted to the end.
        const nullIndex = values.indexOf(null);
        const nullCluster =
          nullIndex > -1 ? d3.range(nullIndex, values.length) : null;
        const validValues =
          nullIndex > -1 ? values.slice(0, nullIndex) : values;
        const rows = nullCluster ? simplificationRows - 1 : simplificationRows;

        return [validValues, nullCluster, rows];
      };

      const applyNull = (clusters, nullCluster) => {
        return nullCluster ? clusters.concat([nullCluster]) : clusters;
      };

      switch (simplificationMethod) {
        case 'quantiles': {
          const [validValues, nullCluster, rows] = removeNull(values);
          const clusters = clusterQuantiles(validValues, rows);
          if (sort === 'descending') clusters.reverse();

          return applyNull(clusters, nullCluster);
        }

        case 'kmeans': {
          const [validValues, nullCluster, rows] = removeNull(values);
          const { clusters } = kmeans(
            validValues.map((d) => [d]),
            rows
          );
          clusters.sort((a, b) => d3[sort](a.centroid[0], b.centroid[0]));

          return applyNull(
            clusters.map((cluster) => cluster.indeces),
            nullCluster
          );
        }

        case 'gap': {
          const [validValues, nullCluster, rows] = removeNull(values);
          const clusters = clusterGap(transformValues(validValues), rows);

          return applyNull(clusters, nullCluster);
        }

        default:
          console.log(`Unknown simplification method: ${simplificationMethod}`);
      }
    }

    function clusterCategorical(values) {
      return groupCategories(values);
    }
  }

  function sortTable() {
    const sortColumn = columns.find(({ sort }) => sort !== null);

    if (!sortColumn) return;

    const { name, type, sort, cluster } = sortColumn;

    data.sort((a, b) => {
      switch (type) {
        case 'numeric': {
          const v1 = a.isCluster ? a.values[name].median : a.values[name];
          const v2 = b.isCluster ? b.values[name].median : b.values[name];

          return v1 === v2
            ? 0
            : v1 === null
            ? 1
            : v2 === null
            ? -1
            : d3[sort](v1, v2);
        }

        case 'categorical': {
          if (cluster) {
            const v1 = a.isCluster
              ? a.values[name].counts[0].count
              : a.values[name]
              ? 1
              : null;
            const v2 = b.isCluster
              ? b.values[name].counts[0].count
              : b.values[name]
              ? 1
              : null;

            return v1 === v2
              ? 0
              : v1 === null
              ? 1
              : v2 === null
              ? -1
              : d3[sort](v1, v2);
          } else {
            const v1 = a.isCluster
              ? a.values[name].counts[0].count / a.size
              : a.values[name];
            const v2 = b.isCluster
              ? b.values[name].counts[0].count / b.size
              : b.values[name];

            return v1 === v2
              ? 0
              : v1 === null
              ? 1
              : v2 === null
              ? -1
              : d3[sort](v1, v2);
          }
        }

        case 'id': {
          const v1 = a.isCluster
            ? a.values[name].counts[0].value
            : a.values[name];
          const v2 = b.isCluster
            ? b.values[name].counts[0].value
            : b.values[name];

          return v1 === v2
            ? 0
            : v1 === null
            ? 1
            : v2 === null
            ? -1
            : d3[sort](v1, v2);
        }

        default:
          console.log(`Unknown column type ${type}`);
          return 0;
      }
    });
  }

  function drawTable() {
    const px = paddingX + 'px';
    const py = paddingY + 'px';

    const clusterIcon = (cluster) =>
      cluster === 'ascending' ? '⊻' : cluster === 'descending' ? '⊼' : '≡';
    //cluster === 'ascending' ? '⇟' :
    //cluster === 'descending' ? '⇞' :
    //'≡'

    const sortIcon = (sort) => (sort === 'ascending' ? '⇣' : '⇡');

    const clusterColumn = columns.find(({ cluster }) => cluster);
    const showSortButtons =
      applySimplification &&
      clusterColumn &&
      clusterColumn.type === 'categorical';

    // Reset svg widths for proper column width sizing
    table.selectAll('svg').attr('width', 0);

    drawHeader();
    drawBody();
    applyVisualizationMode();
    highlight();
    drawLinks();

    function drawHeader() {
      const info = (column) => {
        switch (column.type) {
          case 'numeric': {
            // Display range and median for clusters
            const min = column.extent[0];
            const max = column.extent[1];

            return min === max
              ? min
              : `<div class='range'><div>${min}</div><div class='dash'><hr /></div><div>${max}</div>`;
          }

          case 'categorical': {
            return `<div>${column.uniqueValues.length} categories</div>`;
          }

          case 'id': {
            return `<div>${column.uniqueValues.length} unique values<div>`;
          }

          default:
            return null;
        }
      };

      // Header elements
      const th = table
        .select('thead')
        .select('tr')
        .selectAll('th')
        .data(columns, (d) => d.name)
        .join((enter) => {
          const th = enter.append('th');

          const div = th.append('div').attr('class', 'headerDiv');

          const nameDiv = div.append('div').attr('class', 'nameDiv');

          nameDiv.append('div').text((d) => d.name);

          nameDiv
            .append('button')
            .attr('class', 'headerButton sortButton')
            .on('click', (evt, d) => {
              sortByColumn(d);
              sortTable();
              drawTable();
            });

          nameDiv
            .append('button')
            .attr('class', 'headerButton clusterButton')
            .style('font-weight', 'bold')
            .on('click', (evt, d) => {
              clusterByColumn(d);
              processData();
              sortTable();
              drawTable();

              dispatcher.call('clusterByColumn', this, d);
            });

          div
            .append('div')
            .attr('class', 'info')
            .html(info);

          div.each(function(column) {
            d3.select(this)
              .selectAll('.visDiv')
              .data(column.type === 'id' ? [] : [column])
              .join((enter) => {
                const div = enter.append('div').attr('class', 'visDiv');

                div.append('svg');

                return div;
              });
          });

          th.append('div').attr('class', 'highlight');

          return th;
        })
        .classed('active', (d) => d.cluster !== null)
        .style('padding-left', px)
        .style('padding-right', px)
        .style('padding-top', py)
        .style('padding-bottom', py);

      // Update buttons
      th.select('.clusterButton')
        .classed('active', (d) => d.cluster !== null)
        .text((d) => clusterIcon(d.cluster));

      th.select('.sortButton')
        .classed('active', (d) => d.sort !== null)
        .style('visibility', (d) => (showSortButtons ? null : 'hidden'))
        .text((d) => sortIcon(d.sort));

      // Separate out the visualization update so we have an accurate width after rendering textual elements
      table
        .select('thead')
        .selectAll('tr')
        .each(function() {
          d3.select(this)
            .selectAll('th')
            .each(function(column) {
              const width = d3
                .select(this)
                .select('.nameDiv')
                .node().clientWidth;
              const height = 10;

              // Visualization
              switch (column.type) {
                case 'numeric': {
                  const svg = d3
                    .select(this)
                    .select('.visDiv svg')
                    .attr('width', width)
                    .attr('height', height);

                  const xScale = d3
                    .scaleLinear()
                    .domain(column.extent)
                    .rangeRound([0, width]);

                  const bin = d3.bin().domain(xScale.domain());

                  const bins = bin(column.values);

                  const yScale = d3
                    .scaleLinear()
                    .domain([0, d3.max(bins, (d) => d.length)])
                    .range([height, 0]);

                  // Histogram
                  svg
                    .selectAll('rect')
                    .data(bins)
                    .join((enter) => {
                      const rect = enter.append('rect').style('fill', '#aaa');

                      rect.append('title');

                      return rect;
                    })
                    .attr('x', (d) => xScale(d.x0))
                    .attr('y', (d) => yScale(d.length))
                    .attr('width', (d) => xScale(d.x1) - xScale(d.x0) - 1)
                    .attr('height', (d) => yScale(0) - yScale(d.length))
                    //.select('title')
                    //.text((d) => `${d.x0}-${d.x1}: ${d.length}`);
                    .attr(
                      'data-tippy-content',
                      (d) => `${d.x0}-${d.x1}: ${d.length}`
                    )
                    .call((s) => tippy(s.nodes()));

                  break;
                }

                case 'categorical': {
                  const svg = d3
                    .select(this)
                    .select('.visDiv svg')
                    .attr('width', width)
                    .attr('height', height);

                  const colorScale = d3
                    .scaleOrdinal()
                    .domain(column.uniqueValues)
                    .range(d3.schemeTableau10);

                  const xScale = d3
                    .scaleBand()
                    .domain(column.uniqueValues)
                    .range([0, width]);

                  const yScale = d3
                    .scaleLinear()
                    .domain([0, d3.max(column.counts, (d) => d.count)])
                    .range([height, 0]);

                  // Bars
                  svg
                    .selectAll('rect')
                    .data(column.counts)
                    .join((enter) => {
                      const rect = enter.append('rect');
                      rect.append('title');
                      return rect;
                    })
                    .attr('x', (d) => xScale(d.value))
                    .attr('y', (d) => yScale(d.count))
                    .attr('width', xScale.bandwidth())
                    .attr('height', (d) => yScale(0) - yScale(d.count))
                    .attr('fill', (d) => colorScale(d.value))
                    //.select('title')
                    //.text((d) => `${d.value}: ${d.count}`);
                    .attr('data-tippy-content', (d) => `${d.value}: ${d.count}`)
                    .call((s) => tippy(s.nodes()));

                  break;
                }

                case 'id':
                  d3.select(this)
                    .select('.visDiv svg')
                    .attr('width', width)
                    .attr('height', height);

                  break;

                case 'group': {
                  d3.select(this)
                    .select('.visDiv svg')
                    .attr('width', width)
                    .attr('height', height);

                  break;
                }
                default:
                  console.log(`Unknown column type ${column.type}`);
              }
            });
        });
    }

    function drawBody() {
      const text = (type, v, isCluster, maxDigits) => {
        switch (type) {
          case 'numeric': {
            if (v !== null && isCluster && v.valid) {
              // Display range and median for clusters
              const median = d3.format(`.${maxDigits}r`)(v.median);

              return v.min === v.max
                ? median
                : `<div class='range'><div class='extrema'>${v.min}</div><div>${median}</div><div class='extrema'>${v.max}<div>`;
            } else {
              return v === null || isCluster ? '' : v;
            }
          }

          case 'categorical': {
            if (v !== null && isCluster) {
              // Display top category and number of other categories
              const top = v.counts[0];
              const others = v.counts.slice(1).filter((d) => d.count > 0);
              const s = others.map((d) => `${d.value} (${d.count})`).join(', ');

              const topString =
                `<div>${top.value}` +
                (top.count > 1 ? ` (${top.count})</div>` : '<div>');

              const othersString =
                others.length === 1
                  ? `<div class='others' title="${s}">and 1 other category</div>`
                  : others.length > 1
                  ? `<div class='others' title="${s}">and ${others.length} other categories</div>`
                  : `<div class='others none'>dummy text</div>`;

              return `<div class='categories'>${topString}${othersString}</div>`;
            } else {
              return v === null ? '' : v;
            }
          }

          case 'id': {
            if (v !== null && isCluster) {
              // Display first id and number of other ids
              const top = v.counts[0];
              const others = v.counts.slice(1).filter((d) => d.count > 0);
              const s = others.map((d) => d.value).join(', ');

              const topString = `<div>${top.value}<div>`;

              const othersString =
                others.length === 1
                  ? `<div class='others' title="${s}">and 1 other</div>`
                  : others.length > 1
                  ? `<div class='others' title="${s}">and ${others.length} others</div>`
                  : '';

              return `<div class='categories'>${topString}${othersString}</div>`;
            } else {
              return v === null ? '' : v;
            }
          }

          case 'cluster': {
            return `<div class='clusterSize'>n = ${v}</div>`;
          }

          default:
            return null;
        }
      };

      // Insert pinned and expanded rows
      const expandedData = [];

      const sortColumn = columns.find(({ sort }) => sort !== null);
      const clusterColumn = columns.find(({ cluster }) => cluster !== null);

      data.forEach((row) => {
        expandedData.push(row);

        if (row.isCluster) {
          const insert = row.indeces
            .map((i) => allData[i])
            .filter((d) => d.pinned || d.expanded);

          const name = sortColumn ? sortColumn.name : clusterColumn.name;
          const sort = sortColumn ? sortColumn.sort : clusterColumn.cluster;

          insert.sort((a, b) => {
            const v1 = a.values[name];
            const v2 = b.values[name];

            return v1 === null && v2 === null
              ? 0
              : v1 === null
              ? 1
              : v2 === null
              ? -1
              : d3[sort](v1, v2);
          });

          expandedData.push(...insert);
        }
      });

      const maxSize = d3.max(data, (d) => (d.isCluster ? d.size : 1));

      table
        .select('tbody')
        .selectAll('tr')
        .data(expandedData)
        .join('tr')
        //.style('cursor', d => d.isCluster ? allData[d.indeces[0]].expanded ? 'zoom-out' : 'zoom-in': 'pointer')
        .style('cursor', 'pointer')
        .each(function(d) {
          d3.select(this)
            .selectAll('td')
            .data(columns, (d) => d.name)
            .join((enter) => {
              const td = enter.append('td');

              const div = td.append('div').attr('class', 'cellDiv');

              const valueDiv = div.append('div').attr('class', 'valueDiv');

              valueDiv
                .append('div')
                .attr('class', 'textDiv')
                .classed('notId', (d) => d.type !== 'id')
                .style('text-align', (d) =>
                  d.type === 'numeric' ? 'center' : 'left'
                );

              valueDiv.append('div').attr('class', 'visDiv');

              return td;
            })
            .classed('active', (d) => d.cluster !== null)
            .style('padding-left', px)
            .style('padding-right', px)
            .style('padding-top', py)
            .style('padding-bottom', py)
            .each(function(column, idx) {
              // Text

              var v = d.values[column.name];
              if (column.type === 'group') {
                v = '\u25BA';
              }
              console.log(v);
              const td = d3
                .select(this)
                .classed('expanded', d.expanded)
                .classed('pinned', d.pinned);

              // clearer grouping indication for pinned rows
              const isPinned = d3.select(this).classed('pinned');
              const isExpanded = d3.select(this).classed('expanded');
              if (
                applySimplification &&
                idx === 1 &&
                (isExpanded || isPinned)
              ) {
                td.select('.valueDiv .textDiv').html(
                  text(column.type, '&emsp;' + v, d.isCluster, column.maxDigits)
                );
              } else {
                td.select('.valueDiv .textDiv').html(
                  text(column.type, v, d.isCluster, column.maxDigits)
                );
              }

              td.select('.cellDiv')
                .selectAll('.clusterDiv')
                .data(clustering && column.cluster !== null ? [v] : [])
                .join((enter) => {
                  const div = enter.append('div').attr('class', 'clusterDiv');

                  div.append('div').attr('class', 'textDiv notId');

                  div.append('div').attr('class', 'visDiv');

                  return div;
                })
                .select('.textDiv')
                .html(
                  d.expanded ? '' : text('cluster', d.isCluster ? d.size : 1)
                );
            });
        });

      // Separate out the visualization update so we have an accurate width after rendering textual elements
      table
        .select('tbody')
        .selectAll('tr')
        .each(function(d, i) {
          d3.select(this)
            .selectAll('td')
            .each(function(column) {
              // Get column width
              if (i === 0) {
                column.width = d3
                  .select(this)
                  .select('.valueDiv')
                  .node().clientWidth;
              }

              const v = d.values[column.name];

              const height = 10;

              // Visualization
              switch (column.type) {
                case 'numeric':
                  d3.select(this)
                    .select('.valueDiv .visDiv')
                    .selectAll('svg')
                    .data(v === null || (d.isCluster && !v.valid) ? [] : [v])
                    .join('svg')
                    .attr('width', column.width)
                    .attr('height', height)
                    .each(function(v) {
                      const svg = d3.select(this);

                      const height = 6;
                      const y = height / 2;
                      const r = height / 2;
                      const w1 = r;
                      const w2 = Math.max(Math.floor(w1 / 2), 1);

                      const colorScale = d3
                        .scaleLinear()
                        .domain([
                          column.extent[0],
                          (column.extent[0] + column.extent[1]) / 2,
                          column.extent[1],
                        ])
                        .range(['#2171b5', '#999', '#cb181d']);

                      const xScale = d3
                        .scaleLinear()
                        .domain(column.extent)
                        .range([r, column.width - r]);

                      // Quartile line
                      svg
                        .selectAll('line')
                        .data(
                          d.isCluster
                            ? [
                                [v.min, v.max, v.median],
                                [v.q1, v.q2, v.median],
                              ]
                            : []
                        )
                        .join((enter) =>
                          enter
                            .append('line')
                            .style('margin', 0)
                            .style('padding', 0)
                            .style('stroke-linecap', 'round')
                        )
                        .attr('x1', (d) => xScale(d[0]))
                        .attr('y1', y)
                        .attr('x2', (d) => xScale(d[1]))
                        .attr('y2', y)
                        .style('stroke', (d) => colorScale(d[2]))
                        .style('stroke-width', (d, i) => (i === 0 ? w2 : w1));

                      // Median
                      svg
                        .selectAll('circle')
                        .data(d.isCluster ? [v.median] : [v])
                        .join('circle')
                        .attr('cx', (d) => xScale(d))
                        .attr('cy', y)
                        .attr('r', r)
                        .style('fill', (d) => colorScale(d));
                    });

                  break;

                case 'categorical':
                  d3.select(this)
                    .select('.valueDiv .visDiv')
                    .selectAll('svg')
                    .data(v === null ? [] : [v])
                    .join('svg')
                    .attr('width', column.width)
                    .attr('height', height)
                    .each(function(v) {
                      const svg = d3.select(this);

                      const height = 10;

                      const counts = v.counts
                        ? v.counts
                        : [
                            {
                              value: v,
                              count: 1,
                            },
                          ];

                      const colorScale = d3
                        .scaleOrdinal()
                        .domain(column.uniqueValues)
                        .range(d3.schemeTableau10);

                      const xScale = d3
                        .scaleBand()
                        .domain(column.uniqueValues)
                        .range([0, column.width]);

                      const yScale = d3
                        .scaleLinear()
                        .domain(
                          categoryScaling === 'row'
                            ? [0, d3.max(counts, (d) => d.count)]
                            : [0, column.maxCount]
                        )
                        .range([height, 0]);

                      // Bars
                      svg
                        .selectAll('rect')
                        .data(counts)
                        .join((enter) => {
                          const rect = enter.append('rect');
                          rect.append('title');
                          return rect;
                        })
                        .attr('x', (d) => xScale(d.value))
                        .attr('y', (d) => yScale(d.count))
                        .attr('width', xScale.bandwidth())
                        .attr('height', (d) => yScale(0) - yScale(d.count))
                        .attr('fill', (d) => colorScale(d.value))
                        // .select('title')
                        // .text((d) => `${d.value}: ${d.count}`);
                        .attr(
                          'data-tippy-content',
                          (d) => `${d.value}: ${d.count}`
                        )
                        .call((s) => tippy(s.nodes()));
                    });

                  break;

                case 'id':
                  break;

                case 'group':
                  break;

                default:
                  console.log(`Unknown column type ${column.type}`);
              }

              // Cluster size
              const clusterWidth = 30;

              d3.select(this)
                .select('.clusterDiv .visDiv')
                .selectAll('svg')
                .data([d])
                .join('svg')
                .attr('width', clusterWidth)
                .attr('height', height)
                .each(function(d) {
                  const svg = d3.select(this);

                  const height = 5;

                  const size = d.isCluster ? d.size : 1;

                  const xScale = d3
                    .scaleLinear()
                    .domain([0, maxSize])
                    .range([0, clusterWidth]);

                  // Bar
                  svg
                    .selectAll('rect')
                    .data(d.expanded ? [] : [d])
                    .join('rect')
                    .attr('width', xScale(size))
                    .attr('height', height)
                    .attr('fill', '#bbb');
                });
            })
            .on('mouseover', function(evt, column) {
              table
                .selectAll('th')
                .filter((d) => d === column)
                .select('.highlight')
                .style('visibility', null);

              if (visualizationMode === 'interactive') {
                table
                  .selectAll('td')
                  .filter((d) => d === column || d.cluster !== null)
                  .selectAll('.textDiv.notId')
                  .style('visibility', null);
              }

              linkSvg
                .selectAll('path')
                .style('visibility', (d) =>
                  d.source === column || d.target === column ? null : 'hidden'
                );
            })
            .on('mouseout', function(evt, column) {
              table
                .selectAll('th')
                .filter((d) => d === column)
                .select('.highlight')
                .style('visibility', (d) =>
                  d.cluster !== null ? null : 'hidden'
                );

              if (visualizationMode === 'interactive') {
                table
                  .selectAll('td')
                  .filter((d) => d === column || d.cluster !== null)
                  .selectAll('.textDiv.notId')
                  .style('visibility', 'hidden');
              }

              linkSvg.selectAll('path').style('visibility', null);
            });
        })
        .on('mouseover', function(evt, row) {
          table
            .select('tbody')
            .selectAll('tr')
            .filter((d) => d === row)
            .selectAll('td')
            .classed('mouseOver', true);
        })
        .on('mouseout', function(evt, row) {
          table
            .select('tbody')
            .selectAll('tr')
            .filter((d) => d === row)
            .selectAll('td')
            .classed('mouseOver', false);
        })
        .on('click', function(evt, row) {
          if (row.isCluster) {
            row.indeces.forEach((i) => {
              allData[i].expanded = !allData[i].expanded;
            });
            drawTable();
          } else {
            row.pinned = !row.pinned;

            if (row.pinned) {
              // Already shown
              d3.select(this)
                .selectAll('td')
                .classed('pinned', true);
            } else {
              // Need to hide
              drawTable();
            }
          }
        });
    }

    function highlight() {
      // Update border
      const height = table.node() ? table.node().clientHeight - 4 : 0;

      table
        .selectAll('th')
        .select('.highlight')
        .style('height', `${height}px`)
        .style('visibility', (d) => (d.cluster !== null ? null : 'hidden'));
    }
  }

  function drawLinks() {
    if (!table.node()) return;

    // linkSvg.style('display', showLinks ? null : 'none');
    // if (!showLinks) return;

    // computeRelations();

    if (relations.length === 0 && !isCalculating) {
      if (window.Worker) {
        // instantiate worker
        isCalculating = true;
        const computeRelationWorker = new Worker();

        // post data to worker
        computeRelationWorker.postMessage({
          relations,
          columns,
          allData,
        });
        // if received data from worker
        computeRelationWorker.onmessage = function(e) {
          if (e && e.data) {
            const { relations: re, columns: cols } = e.data;
            relations = re;
            columns = cols;
            //console.log('Message received from worker');
            isCalculating = false;
            dispatcher_calcRel.call('CalculateRelations', this, isCalculating);
          }
        };
      } else {
        console.log("Your browser doesn't support web worker");
      }
    }

    linkSvg.style('display', showLinks ? null : 'none');
    if (!showLinks) return;

    const width = table.node().offsetWidth;
    const height = 200;
    const aspect = width / height;

    const offset = table.node().getBoundingClientRect().x;

    table
      .selectAll('th')
      .nodes()
      .forEach((d, i) => {
        const { left, right } = d.getBoundingClientRect();

        columns[i].pos = left + (right - left) / 2 - offset;
      });

    relations.forEach((d) => {
      const x1 = d.source.pos;
      const x2 = d.target.pos;

      const y = height - (x2 - x1) / aspect;

      const xi = d3.interpolateNumber(x1, x2);
      const yi = d3.interpolateNumber(height, y);

      d.points = [
        { x: xi(0), y: yi(0) },
        { x: xi(0.1), y: yi(0.5) },
        { x: xi(0.5), y: yi(1) },
        { x: xi(0.9), y: yi(0.5) },
        { x: xi(1), y: yi(0) },
      ];
    });

    const line = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveBasis);

    const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([1, -1]);

    const opacityScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, 1]);

    const widthScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, 5]);

    linkSvg
      .attr('width', width)
      .attr('height', height)
      .selectAll('path')
      .data(relations)
      .join('path')
      .attr('d', (d) => line(d.points))
      .style('fill', 'none')
      .style('stroke', (d) => colorScale(d.value))
      .style('stroke-opacity', (d) => opacityScale(d.magnitude))
      .style('stroke-width', (d) => widthScale(d.magnitude))
      .style('stroke-linecap', 'round')
      .append('title')
      .text((d) => d.value);
  }

  function applyVisualizationMode() {
    const td = table.selectAll('td');
    td.selectAll('.textDiv.notId').style('visibility', textVisibility());
    td.selectAll('svg').style('visibility', visVisibility());
  }

  digestable.applySimplification = function(_) {
    if (!arguments.length) return applySimplification;
    applySimplification = _;
    const clusterColumn = columns.find(({ cluster }) => cluster !== null);
    if (clusterColumn && clusterColumn.type !== 'id') {
      processData();
      sortTable();
      drawTable();
    }
    return digestable;
  };

  digestable.simplificationMethod = function(_) {
    if (!arguments.length) return simplificationMethod;
    simplificationMethod = _;
    if (clustering) {
      processData();
      sortTable();
      drawTable();
    }
    return digestable;
  };

  digestable.simplificationAmount = function(_) {
    if (!arguments.length) return simplificationAmount;
    simplificationAmount = _;
    if (clustering) {
      processData();
      sortTable();
      drawTable();
    }
    return digestable;
  };

  digestable.simplificationRows = function(_) {
    if (!arguments.length) return simplificationRows;
    simplificationRows = _;
    if (clustering) {
      processData();
      sortTable();
      drawTable();
    }
    return digestable;
  };

  digestable.transformBase = function(_) {
    if (!arguments.length) return transformBase;
    transformBase = _;
    if (clustering) {
      processData();
      sortTable();
      drawTable();
    }
    return digestable;
  };

  // unselect function
  digestable.unselect = function() {
    allData.forEach((row) => {
      row.pinned = false;
    });
    drawTable();
    return digestable;
  };

  digestable.visualizationMode = function(_) {
    if (!arguments.length) return visualizationMode;
    visualizationMode = _;
    applyVisualizationMode();
    return digestable;
  };

  digestable.showLinks = function(_) {
    if (!arguments.length) return showLinks;
    showLinks = _;
    drawTable();
    return digestable;
  };

  digestable.categoryScaling = function(_) {
    if (!arguments.length) return categoryScaling;
    categoryScaling = _;
    drawTable();
    return digestable;
  };

  digestable.updateLinks = function() {
    drawLinks();
    return digestable;
  };

  // For registering event callbacks
  digestable.on = function() {
    const value = dispatcher.on.apply(dispatcher, arguments);
    return value === dispatcher ? digestable : value;
  };

  // For registering event callbacks
  digestable.onCalcRel = function() {
    const value = dispatcher_calcRel.on.apply(dispatcher_calcRel, arguments);
    return value === dispatcher_calcRel ? digestable : value;
  };

  function loadMoreData(rowNum) {
    displayRowNum += parseInt(rowNum);
    console.log(displayRowNum);
    if (displayRowNum < [...allData].length) {
      data = [...allData].slice(0, displayRowNum);
    } else {
      isFullData = true;
      data = [...allData];
    }
    drawTable();
  }

  digestable.loadMore = function(rowNum) {
    loadMoreData(rowNum);
    //console.log('digestable test');
    return digestable;
  };

  digestable.isFullData = function() {
    return isFullData;
  };

  digestable.fullDataLength = function() {
    return [...allData].length;
  };

  digestable.displayRowNum = function() {
    return displayRowNum;
  };

  return digestable;
};
