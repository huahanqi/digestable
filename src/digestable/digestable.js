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

    function drawHeader() {
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

            return th;
          }
        )
        .style('padding-left', px)
        .style('padding-right', px)
        .style('padding-top', py)
        .style('padding-bottom', py);

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
        .each(function(d) {
          d3.select(this).selectAll('td')
            .data(columns)
            .join('td')
            .style('padding-left', px)
            .style('padding-right', px)
            .style('padding-top', py)
            .style('padding-bottom', py)
            .text(column => text(column, d))
            .each(function(column) {
              const v = d[column.name];

              switch (column.type) {
                case 'numeric':
                  if (v !== null) {
                    const h = 5;
                    const r = h / 2;

                    const scale = d3.scaleLinear()
                      .domain(column.extent)
                      .range([0, 100]);

                    const left = v.cluster ? scale(v.min) : scale(v);
                    const width = v.cluster ? Math.max(scale(v.max) - left, h) : h;

                    // XXX: Handle enter/update/exit properly instead of this
                    d3.select(this).selectAll('div').remove();

                    d3.select(this).append('div')
                      .style('position', 'relative')
                      .style('background-color', '#aaa') 
                      .style('margin-bottom', `2px`)           
                      .style('height', `${ h }px`)
                      .style('left', `${ left }%`)
                      .style('width', `${ width }%`)
                      .style('border-radius', `${ r }px`);
                  }

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