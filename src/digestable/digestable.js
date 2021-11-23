import * as d3 from 'd3';

export const digestable = () => {
  function digestable(selection) {
    let table = d3.select(),        
        data = null,
        
        // Parameters
        paddingX = 5,
        paddingY = 0;

    selection.each(function(d) {
      data = d;

      // Create skeletal table
      table = d3.select(this).selectAll('table')
        .data([data])
        .join(
          enter => {
            const table = enter.append('table')
              .style('width', '100%');

            table.append('thead').append('tr');
            table.append('tbody');

            return table;
          }
        );

      drawTable();
    });

    function drawTable() {
      const px = paddingX + 'px';
      const py = paddingY + 'px';

      drawHeader();
      drawBody();

      function drawHeader() {
        table.select('thead').select('tr').selectAll('th')
          .data(data.columns)
          .join(enter => enter.append('th')
            .style('border', '1px solid #ccc')
            .style('background-color', '#eee')
            .style('padding', px)
          )
          .style('padding-left', px)
          .style('padding-right', px)
          .style('padding-top', py)
          .style('padding-bottom', py)
          .text(d => d);
      }

      function drawBody() {
        table.select('tbody').selectAll('tr')
          .data(data)
          .join('tr')
          .each(function(d) {
            d3.select(this).selectAll('td')
              .data(data.columns)
              .join(enter => enter.append('td')
                .style('border', '1px solid #ccc')
              )
              .style('padding-left', px)
              .style('padding-right', px)
              .style('padding-top', py)
              .style('padding-bottom', py)
              .text(column => d[column]);
          })          
      }
    }  
  }

  return digestable;
};