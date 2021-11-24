import * as d3 from 'd3';
import kmeans from './kmeans';
import './digestable.css';

const initialIndex = '__i__';

export const digestable = () => {
  function digestable(selection) {
    let table = d3.select(),        
        allData = [],
        data = [],
        columns = [],
        
        // Parameters
        paddingX = 5,
        paddingY = 0;

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
        const numeric = values.reduce((numeric, value) => numeric && (!isNaN(value) || value === ''), true);

        if (numeric) {
          if (values.length === inputData.length) {
            // Heuristic to check for integer ID type
            const numbers = values.map(d => +d);
            numbers.sort((a, b) => d3.ascending(a, b));

            const isId = numbers.reduce((isId, d, i, a) => isId && (i === 0 || d === a[i - 1] + 1), true);

            column.type = isId ? 'id' : 'numeric';
          }
          else {
            column.type = 'numeric';            
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
        columns.filter(({ type }) => type === 'numeric').forEach(({ name, type }) => {
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

      if (sortColumn) {
        const { name, type, sort } = sortColumn;

        switch (type) {
          case 'numeric': {
            const values = allData.map(d => [d[name]]);

            const { clusters } = kmeans(values, 20);

            clusters.sort((a, b) => d3[sort](a.centroid[0], b.centroid[0]));

            data = clusters.map(cluster => {
              const v = {};

              columns.forEach(({ name, type }) => {
                if (type === 'numeric') {
                  v[name] = d3.mean(cluster.indeces, i => allData[i][name]);
                }
                else {
                  v[name] = '?';
                }
              });

              return v;
            });

            console.log(data);

            break;
          }

          default:
            data =[...allData];
        } 
      }
      else {
        data = [...allData];
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
                .on("click", (evt, d) => {
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
              .text(column => d[column.name]);
          })          
      }
    }  
  }

  return digestable;
};