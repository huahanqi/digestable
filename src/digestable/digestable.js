import * as d3 from 'd3';
import kmeans from './kmeans';
import clusterThreshold from './clusterThreshold';
import './digestable.css';

const initialIndex = '__i__';

export const digestable = () => {
  let table = d3.select(),        
      allData = [],
      data = [],
      columns = [],
      
      // Parameters
      applySimplification = false,
      simplificationAmount = 0.9,
      simplificationMethod = 'threshold',
      paddingX = 5,
      paddingY = 0;

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

  function clearSorting() {    
    // XXX: Could just use find?  
    columns.forEach(d => d.sort = null);
  }

  function createColumns(inputData) {
    columns = inputData.columns.map(d => ({ name: d }));

    // Determine column types
    columns.forEach(column => {
      const { name } = column;
      const values = Array.from(inputData.reduce((values, d) => values.add(d[name]), new Set()));
      const validValues = values.filter(value => value !== '');
      const numeric = validValues.reduce((numeric, value) => numeric && !isNaN(value), true);

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
      else if (values.length === inputData.length) {
        column.type = 'id';
      }
      else {
        column.type = 'categorical';
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

    if (applySimplification && sortColumn) {
      const { name, type, sort } = sortColumn;

      switch (type) {
        case 'numeric': {
          const values = allData.map(d => d[name]);

          const clusters = clusterNumeric(values, sort);

          data = clusters.map(cluster => {
            const row = {};

            columns.forEach(({ name, type }) => {
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
                      mean: d3.mean(validValues)
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
                row[name] = '?';
              }
            });

            return row;
          });

          break;
        }

        default:
          data = [...allData];
      } 
    }
    else {
      data = [...allData];
    }

    function clusterNumeric(values, sort) {
      switch (simplificationMethod) {
        case 'kmeans': {
          const k = Math.floor(d3.interpolateNumber(values.length, 1)(simplificationAmount));
          //const k = 20;
          const { clusters } = kmeans(values.map(v => [v]), k);
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
                drawTable()
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
          case 'numeric':
            return v === null ? '' :
              v.cluster && v.valid ? `${ numberFormat(v.min) }–${ numberFormat(v.max) }` :
              v.cluster ? '' :
              numberFormat(v);

          case 'id':
          case 'categorical':
            return v === null ? '' :
              v.cluster ? '?' :
              v;

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
                  .append('div');

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
              
              const height = 6;
              const r = height / 2;

              d3.select(this).select('div').select('div').text(column => text(column, d));

              switch (column.type) {
                case 'numeric':          
                  //const colorScale = d3.scaleSequential(d3.interpolateGnBu)
                  //  .domain(column.extent);                  
                  //const colorScale = d3.scaleLinear()
                  //  .domain(column.extent)
                  //  .range(['#ccebc5', '#084081']);
                  //const colorScale = d3.scaleSequential(d3.interpolatePuOr)
                  //  .domain(column.extent);
                  const colorScale = d3.scaleLinear()
                      .domain([column.extent[0], (column.extent[0] + column.extent[1]) / 2, column.extent[1]])
                      .range(['#2171b5', '#999', "#cb181d"]);

                  const xScale = d3.scaleLinear()
                    .domain(column.extent)
                    .range([r, column.width - r]);

                  d3.select(this).select('div').selectAll('svg')
                    .data(v === null || (v.cluster && !v.valid) ? [] : [v])
                    .join(
                      enter => {
                        const svg = enter.append('svg');

                        svg.append('line')
                          .style('margin', 0)
                          .style('padding', 0)
                          .style('stroke-linecap', 'round');

                        svg.append('circle');                        

                        return svg;
                      }
                    )
                    .attr('width', column.width)
                    .attr('height', height)
                    .each(function(v) {                    
                      const svg = d3.select(this);

                      svg.select('line')
                          .attr('x1', d => xScale(d.cluster ? d.min : d))
                          .attr('y1', height / 2)
                          .attr('x2', d => xScale(d.cluster ? d.max : d))
                          .attr('y2', height / 2)
                          .style('stroke', d => colorScale(d.cluster ? d.mean : d))
                          .style('stroke-width', r / 2);

                      svg.select('circle')
                          .attr('cx', d => xScale(d.cluster ? d.mean : d))
                          .attr('cy', height / 2)
                          .attr('r', r)
                          .style('fill', d => colorScale(d.cluster ? d.mean : d));
                    });  

                  break;

                case 'id':
                case 'categorical':
                  break;

                default:
                  console.log(`Unknown column type ${ column.stype }`);
              }
            })        
        })          
    }

    function highlight() {
      // Update border
      const height = table.node() ? table.node().clientHeight : 0;

      table.selectAll('th').select('.highlight')
          .style('height', `${ height }px`)
          .style('visibility', d => d.sort === null ? 'hidden' : null);
    }
  } 

  digestable.applySimplification = function(_) {
    if (!arguments.length) return applySimplification;
    applySimplification = _;
    processData();
    drawTable();
    return digestable;
  };

  digestable.simplificationMethod = function(_) {
    if (!arguments.length) return simplificationMethod;
    simplificationMethod = _;
    processData();
    drawTable();
    return digestable;
  };

  digestable.simplificationAmount = function(_) {
    if (!arguments.length) return simplificationAmount;
    simplificationAmount = _;
    processData();
    drawTable();
    return digestable;
  };

  return digestable;
};