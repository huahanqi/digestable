import * as d3 from 'd3';

export const digestable = () => {
  function digestable(selection) {
    let table = d3.select(),
        data = null;

    selection.each(function(d) {
      data = d;

      // Create skeletal table
      table = d3.select(this).selectAll('table')
        .data([data])
        .join(
          enter => {
            const table = enter.append('table')
              .style("width", "100%");

            table.append('thead').append('tr');
            table.append('tbody');

            return table;
          }
        );

      drawTable();
    });

    function drawTable() {
      drawHeader();
      drawBody();

      function drawHeader() {
        table.select('thead').select('tr').selectAll('th')
          .data(data[0])
          .join(enter => enter.append('th')
            .style('border', '1px solid #ccc')
            .style('background-color', '#eee')
          )
          .text(d => d);
      }

      function drawBody() {
        table.select('tbody').selectAll('tr')
          .data(data.slice(1))
          .join('tr').selectAll('td')
          .data(d => d)
          .join(enter => enter.append('td')
            .style('border', '1px solid #ccc')
          )
          .text(d => d);
      }
    }  
  }

  return digestable;
};