import * as d3 from 'd3';
import './digestable.css';

export const digestable = () => {
  function digestable(selection) {
    let table = d3.select(),        
        inputData = [],
        data = [],
        columns = [],
        
        // Parameters
        paddingX = 5,
        paddingY = 0;

    selection.each(function(d) {
      inputData = d;

      // Create skeletal table
      table = d3.select(this).selectAll('table')
        .data([data])
        .join(
          enter => {
            const table = enter.append('table');

            table.append('thead').append('tr');
            table.append('tbody');

            return table;
          }
        );

      createColumns();
      sortData();
      drawTable();
    });

    function clearSorting() {    
      // XXX: Could just use find?  
      columns.forEach(d => d.sort = null);
    }

    function createColumns() {
      columns = inputData.columns.map(d => ({ name: d }));

      clearSorting();
    }

    function sortByColumn(column) {    
      const sort = column.sort === 'ascending' ? 'descending' : 'ascending';
      
      clearSorting();

      column.sort = sort;

      sortData();
    }

    function sortData() {
      const sortColumn = columns.find(({ sort }) => sort !== null);

      if (sortColumn) {
        const { name, sort } = sortColumn;

        data = inputData.sort((a, b) => {
          return d3[sort](a[name], b[name]);
        });
      }
      else {
        data = [...inputData];
      }
    }

    function processData() {
    }

    function drawTable() {
      const px = paddingX + 'px';
      const py = paddingY + 'px';

      drawHeader();
      drawBody();

      function drawHeader() {
        table.select('thead').select('tr').selectAll('th')
          .data(columns, d => d.name)
          .join('th')
          .style('padding-left', px)
          .style('padding-right', px)
          .style('padding-top', py)
          .style('padding-bottom', py)
          .text(d => d.name)
          .on("click", (evt, d) => {
            console.log(d);
            sortByColumn(d);
            drawTable()
          });
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