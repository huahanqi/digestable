import * as d3 from 'd3';
import kmeans from './kmeans';
import clusterThreshold from './clusterThreshold';
import './digestable.css';

const initialIndex = '__i__';

export const digestable = () => {
      // The table
  let table = d3.select(),     

      // Data   
      allData = [],
      data = [],
      columns = [],
      
      // Parameters
      applySimplification = false,
      simplificationMethod = 'threshold',
      simplificationAmount = 0.9,
      simplificationRows = 20,
      visualizationMode = 'text',

      paddingX = 5,
      paddingY = 0,

      // Event dispatcher
      dispatcher = d3.dispatch('sortByColumn');

  function digestable(selection) {
    selection.each(function(d) {
      // Create skeletal table
      table = d3.select(this).selectAll('table')
        .data([[]])
        .join(
          enter => {
            const table = enter.append('table');

            table.append('thead').append('tr');
            table.append('tbody');

            return table;
          }
        );

      createColumns(d);      
      createData(d);
      sortData();
      processData();
      drawTable();
    });
  }

  // Helper functions 
  const textVisibility = () => (visualizationMode === 'text' || visualizationMode === 'both') ? 'visible' : 'hidden';
  const visVisibility = () => visualizationMode !== 'text' ? 'visible' : 'hidden';

  const getCounts = (uniqueValues, values) => Object.entries(values.reduce((counts, value) => {
    counts[value]++;
    return counts;
  }, uniqueValues.reduce((counts, value) => {
    counts[value] = 0;
    return counts;
  }, {}))).map(([key, value]) => ({ value: key, count: value })).sort((a, b) => d3.descending(a.count, b.count));

  function clearSorting() {    
    // XXX: Could just use find?  
    columns.forEach(d => d.sort = null);
  }

  function createColumns(inputData) {
    columns = inputData.columns.map(d => ({ name: d }));

    // Determine column types and set column info
    columns.forEach(column => {
      const { name } = column;
      const values = inputData.map(d => d[name]);
      const uniqueValues = Array.from(values.reduce((values, d) => values.add(d), new Set()));
      const validValues = uniqueValues.filter(value => value !== '');
      const numeric = validValues.reduce((numeric, value) => numeric && !isNaN(value), true);

      column.uniqueValues = uniqueValues;

      if (numeric) {        
        const numbers = validValues.map(d => +d);

        if (numbers.length === inputData.length) {
          // Heuristic to check for integer ID type
          numbers.sort((a, b) => d3.ascending(a, b));

          const isId = numbers.reduce((isId, d, i, a) => isId && (i === 0 || d === a[i - 1] + 1), true);

          column.type = isId ? 'id' : 'numeric';
        }
        else {
          column.type = 'numeric';            
        }

        if (column.type === 'numeric') {
          column.extent = d3.extent(numbers);
        }
      }
      else if (uniqueValues.length === inputData.length) {
        column.type = 'id';
      }
      else {
        column.type = 'categorical';
        column.counts = getCounts(uniqueValues, values);
      }
    });

    clearSorting();
  }

  function createData(inputData) {
    allData = inputData.map((d, i) => {
      const v = {...d};

      // Store initial order for sorting
      v[initialIndex] = i;

      // Convert numeric
      columns.filter(({ type }) => type === 'numeric').forEach(({ name }) => {
        v[name] = v[name] === '' ? null : +v[name];
      });

      return v;
    });
  }

  function sortByColumn(column) {    
    const sort = column.sort === null ? 'descending' :
      column.sort === 'descending' ? 'ascending' :
      null;
    
    clearSorting();

    column.sort = sort;

    sortData();
  }

  function sortData() {
    const sortColumn = columns.find(({ sort }) => sort !== null);

    if (sortColumn) {
      const { name, sort } = sortColumn;

      const sortValue = value => value === null ? Number.NEGATIVE_INFINITY : value;

      allData.sort((a, b) => d3[sort](sortValue(a[name]), sortValue(b[name])));
    }
    else {
      allData.sort((a, b) => d3.ascending(a[initialIndex], b[initialIndex]));
    }
  }

  function processData() {
    const sortColumn = columns.find(({ sort }) => sort !== null);

    // Initialize categorical and id column counts
    columns.filter(({ type }) => type !== 'numeric').forEach(column => column.maxCount = 1);

    if (applySimplification && sortColumn && sortColumn.type !== 'id') {
      const { name, type, sort } = sortColumn;

      const values = allData.map(d => d[name]);

      const clusters = type === 'numeric' ? clusterNumeric(values, sort) :
        clusterCategorical(values);

      data = clusters.map(cluster => {
        const row = {};

        columns.forEach(column => {
          const { name, type, uniqueValues } = column;

          if (type === 'numeric') {
            const values = cluster.map(i => allData[i][name]);

            if (values.length > 1) {
              const validValues = values.filter(d => d !== null);

              row[name] = validValues.length > 0 ?
                {
                  cluster: true,
                  valid: true,
                  values: values,
                  validValues: validValues,
                  min: d3.min(validValues),
                  max: d3.max(validValues),                    
                  median: d3.median(validValues),
                  q1: d3.quantile(validValues, 0.25),
                  q2: d3.quantile(validValues, 0.75)
                } :
                {
                  cluster: true,
                  valid: false,
                  values: values
                };
            }
            else if (values.length === 1) {
              row[name] = values[0];
            }
            else {
              row[name] = null;
            }
          }
          else {
            const values = cluster.map(i => allData[i][name]);

            if (values.length > 1) {
              const counts = getCounts(uniqueValues, values);
              
              column.maxCount = Math.max(column.maxCount, counts[0].count);

              row[name] = {
                cluster: true,
                counts: counts
              };
            }
            else if (values.length === 1) {
              column.maxCount = Math.max(column.maxCount, 1);

              row[name] = values[0];
            }
            else {
              row[name] = null;
            }
          }
        });

        return row;
      });
    }
    else {
      data = [...allData];
    }

    function clusterNumeric(values, sort) {
      switch (simplificationMethod) {
        case 'kmeans': { 
          const { clusters } = kmeans(values.map(v => [v]), simplificationRows);
          clusters.sort((a, b) => d3[sort](a.centroid[0], b.centroid[0]));

          return clusters.map(cluster => cluster.indeces);
        }

        case 'threshold': {
          return clusterThreshold(values, simplificationAmount);
        }

        default: {
          return d3.range(allData.length);
        }
      }
    }

    function clusterCategorical(values) {
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
  }

  function drawTable() {
    const px = paddingX + 'px';
    const py = paddingY + 'px';

    const sortIcon = sort => (
      sort === 'ascending' ? '↓' :
      sort === 'descending' ? '↑' :
      '↕'
    );

    drawHeader();
    drawBody();
    applyVisualizationMode();
    highlight();

    function drawHeader() {
      // Header elements
      const th = table.select('thead').select('tr').selectAll('th')
        .data(columns, d => d.name)
        .join(
          enter => {
            const th = enter.append('th');

            const div = th.append('div');
            
            div.append('div')                
              .text(d => d.name);
            
            div.append('button')
              .attr('class', 'sortButton')
              .on('click', (evt, d) => {
                sortByColumn(d);
                processData();
                drawTable();

                dispatcher.call('sortByColumn', this, d);
              });

            th.append('div')
              .attr('class', 'highlight');

            return th;
          }
        )
        .classed('active', d => d.sort !== null)
        .style('padding-left', px)
        .style('padding-right', px)
        .style('padding-top', py)
        .style('padding-bottom', py);

      // Update button
      th.select('.sortButton')
        .classed('active', d => d.sort !== null)
        .text(d => sortIcon(d.sort));
    }

    function drawBody() {
      const numberFormat = d3.format('.1f');

      const text = ({ type, name }, d) => {
        const v = d[name];

        switch (type) {
          case 'numeric': {
            if (v !== null && v.cluster && v.valid) {
              // Display range and median for clusters
              const min = numberFormat(v.min);
              const max = numberFormat(v.max);
              const median = numberFormat(v.median);

              return min === max ? median :
                `<div class='range'><div class='extrema'>${ min }</div><div>${ median }</div><div class='extrema'>${ max }<div>`;
            }
            else {
              return v === null || v.cluster ? '' : numberFormat(v);
            }
          }
          
          case 'categorical':
            if (v !== null && v.cluster) {
              // Display top category and number of other categories
              const top = v.counts[0];
              const others = v.counts.filter(d => d.count > 0).length - 1;

              const topString = `<div>${ top.value }` +
                (top.count > 1 ? ` (${ top.count })</div>` : '<div>');

              const othersString = others === 1 ? `<div class='others'>and 1 other category</div>` :
                others > 1 ? `<div class='others'>and ${ others } other categories</div>` : '';

              return `<div class='categories'>${ topString }${othersString}</div>`;
            }
            else {
              return v === null ? '' : v;
            }

          case 'id':
            if (v !== null && v.cluster) {
              // Display first id and number of other ids
              const top = v.counts[0];
              const others = v.counts.filter(d => d.count > 0).length - 1;

              const topString = `<div>${ top.value }` +
                (top.count > 1 ? ` (${ top.count })</div>` : '<div>');

              const othersString = others === 1 ? `<div class='others'>and 1 other</div>` :
                others > 1 ? `<div class='others'>and ${ others } others</div>` : '';

                return `<div class='categories'>${ topString }${othersString}</div>`;
            }
            else {
              return v === null ? '' : v;
            }

          default:
            return null;
        }
      }

      table.select('tbody').selectAll('tr')
        .data(data)
        .join('tr')
        .each(function(d, i) {
          d3.select(this).selectAll('td')
            .data(columns)
            .join(
              enter => {
                const td = enter.append('td');

                td.append('div')
                  .style('display', 'flex')
                  .style('flex-direction', 'column')
                  .style('margin-bottom', '2px')
                  .append('div')
                  .classed('textDiv', d => d.type !== 'id')
                  .style('text-align', d => d.type === 'numeric' ? 'center' : 'left');

                return td;
              }
            )
            .classed('active', d => d.sort !== null)
            .style('padding-left', px)
            .style('padding-right', px)
            .style('padding-top', py)
            .style('padding-bottom', py)
            .each(function(column) {
              // Get column width
              if (i === 0) {
                column.width = d3.select(this).select('div').node().clientWidth;
              }

              const v = d[column.name];

              const height = 10;

              d3.select(this).select('div').select('div').html(column => text(column, d));

              switch (column.type) {
                case 'numeric': {
                  d3.select(this).select('div').selectAll('svg')
                    .data(v === null || (v.cluster && !v.valid) ? [] : [v])
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
    
                      const colorScale = d3.scaleLinear()
                          .domain([column.extent[0], (column.extent[0] + column.extent[1]) / 2, column.extent[1]])
                          .range(['#2171b5', '#999', '#cb181d']);
    
                      const xScale = d3.scaleLinear()
                        .domain(column.extent)
                        .range([r, column.width - r]);

                      // Quartile line
                      svg.selectAll('line')
                        .data(v.cluster ? [[v.min, v.max, v.median], [v.q1, v.q2, v.median]] : [])
                        .join(
                          enter => enter.append('line')
                            .style('margin', 0)
                            .style('padding', 0)
                            .style('stroke-linecap', 'round')                         
                        )
                        .attr('x1', d => xScale(d[0]))
                        .attr('y1', y)
                        .attr('x2', d => xScale(d[1]))
                        .attr('y2', y)
                        .style('stroke', d => colorScale(d[2]))
                        .style('stroke-width', (d, i) => i === 0 ? w2 : w1);

                      // Median
                      svg.selectAll('circle')
                        .data(v.cluster ? [v.median] : [v])
                        .join('circle')
                        .attr('cx', d => xScale(d))
                        .attr('cy', y)
                        .attr('r', r)
                        .style('fill', d => colorScale(d));
                    });  

                  break;
                }

                case 'categorical': {
                  d3.select(this).select('div').selectAll('svg')
                    .data(v === null ? [] : [v])
                    .join('svg')
                    .attr('width', column.width)
                    .attr('height', height)
                    .each(function(v) {  
                      const svg = d3.select(this);

                      const height = 10;

                      const counts = v.counts ? v.counts : [{ value: v, count : 1 }];

                      const colorScale = d3.scaleOrdinal()
                          .domain(column.uniqueValues)
                          .range(d3.schemeTableau10);

                      const xScale = d3.scaleBand()
                        .domain(column.uniqueValues)
                        .range([0, column.width]);

                      const yScale = d3.scaleLinear()
                        .domain([0, column.maxCount])
                        .range([height, 0]);
                        
                      // Bars
                      svg.selectAll('rect')
                        .data(counts)
                        .join(
                          enter => {
                            const rect = enter.append('rect');
                            rect.append('title');
                            return rect;
                          }
                        )
                        .attr('x', d => xScale(d.value))
                        .attr('y', d => yScale(d.count))
                        .attr('width', xScale.bandwidth())
                        .attr('height', d => yScale(0) - yScale(d.count))
                        .attr('fill', d => colorScale(d.value))
                        .select('title').text(d => `${ d.value }: ${ d.count }`);
                    });                  

                  break;
                }
                
                case 'id':
                  break;

                default:
                  console.log(`Unknown column type ${ column.stype }`);
              }
            })
            .on('mouseover', function(evt, column) {
              table.selectAll('th').filter(d => d === column).select('.highlight')
                .style('visibility', null);    

              if (visualizationMode === 'interactive') {
                table.selectAll('td').filter(d => d === column || d.sort !== null).select('.textDiv')
                  .style('visibility', 'visible');
              }
            })
            .on('mouseout', function(evt, column) {
              table.selectAll('th').filter(d => d === column).select('.highlight')
                .style('visibility', d => d.sort === null ? 'hidden' : null); 
                
              if (visualizationMode === 'interactive') {
                table.selectAll('td').filter(d => d === column || d.sort !== null).select('.textDiv')
                .style('visibility', 'hidden');
              }
            });
        });     
    }

    function highlight() {
      // Update border
      const height = table.node() ? table.node().clientHeight - 1: 0;

      table.selectAll('th').select('.highlight')
        .style('height', `${ height }px`)
        .style('visibility', d => d.sort === null ? 'hidden' : null);
    }
  } 

  function applyVisualizationMode() {
    const td = table.selectAll('td');
    td.select('.textDiv').style('visibility', textVisibility());
    td.select('svg').style('visibility', visVisibility());
  } 

  digestable.applySimplification = function(_) {
    if (!arguments.length) return applySimplification;
    applySimplification = _;
    if (columns.find(({ sort }) => sort !== null)) {
      processData();
      drawTable();
    }
    return digestable;
  };

  digestable.simplificationMethod = function(_) {
    if (!arguments.length) return simplificationMethod;
    simplificationMethod = _;
    if (applySimplification) {
      processData();
      drawTable();
    }
    return digestable;
  };

  digestable.simplificationAmount = function(_) {
    if (!arguments.length) return simplificationAmount;
    simplificationAmount = _;
    if (applySimplification) {
      processData();
      drawTable();
    }
    return digestable;
  };

  digestable.simplificationRows = function(_) {
    if (!arguments.length) return simplificationRows;
    simplificationRows = _;
    if (applySimplification) {
      processData();
      drawTable();
    }
    return digestable;
  };

  digestable.visualizationMode = function(_) {
    if (!arguments.length) return visualizationMode;
    visualizationMode = _;
    applyVisualizationMode();
    return digestable;
  };

  // For registering event callbacks
  digestable.on = function() {
    const value = dispatcher.on.apply(dispatcher, arguments);
    return value === dispatcher ? digestable : value;
  };

  return digestable;
};