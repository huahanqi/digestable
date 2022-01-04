import { useState } from 'react';
import { Container, Navbar, Row, Col, Form, Spinner, Stack } from 'react-bootstrap';
import * as d3 from 'd3';
import { SimplifyProvider, VisualizationProvider } from './contexts';
import { TableWrapper } from './components/table-wrapper';
import { SimplifyControls, VisualizationControls } from './components/controls';

const { Brand } = Navbar;
const { Group, Control, Select } = Form;

const datasets = [
  { name: 'MT Cars', url: '/digestable/data/mtcars.csv' },
  { name: 'NFL Combine 2017', url: '/digestable/data/NFL Combine 2017.csv' }
];

export const App = () => {
  const [dataset, setDataset] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // XXX: Add loading spinner
  const loadData = async url => {
    setData(null);
    setLoading(true);

    try {
      const csvData = await d3.csv(url);

      setData(csvData);
      setLoading(false);
    }
    catch (error) {
      console.log(error);
    }
  }

  const onSelectChange = evt => {
    const url = evt.target.value;
    
    setDataset(url);
    loadData(url);
  };

  const onFileSelect = evt => {
    const file = evt.target.files.length === 1 ? evt.target.files[0] : null;

    if (file) {
      setDataset('');
      loadData(URL.createObjectURL(file));
    }
  };

  return (
    <SimplifyProvider>
    <VisualizationProvider>
      <Navbar bg='dark' variant='dark'>
        <Brand className='ms-2'>
          <img 
            src='/digestable/digestable_512.png' 
            alt='digestable logo'
            height='32px'
            className='me-1'              
          />
          <span className='text-align-bottom'>diges<b>table</b></span>
        </Brand>        
        <Form>
          <Group as={ Row } className='align-items-center'>
            <Col>
              <Select 
                value={ dataset }
                onChange={ onSelectChange }
              >
                <option
                  value=''
                  disabled
                >
                  Choose dataset
                </option>
                { datasets.map((dataset, i) => (
                  <option key={ i } value={ dataset.url }>
                    { dataset.name }
                  </option> 
                ))}
              </Select>
            </Col>
            <Col sm='auto' className='text-center'>
              <span className='text-light'>or</span>
            </Col>
            <Col>
              <Control 
                type='file'
                accept='.csv'
                onChange={ onFileSelect }
              />
            </Col>
          </Group>
        </Form>
      </Navbar>
      { data ? 
        <Container fluid style={{ height: 'calc(100% - 100px)' }}>      
          <Row style={{ height: '100%' }}>
            <Col xs={ 10 } className='mt-3' style={{ height: '100%'}}>
              <TableWrapper data={ data } />
            </Col>
            <Col className='bg-dark'>
              <Stack gap={ 3 }>
                <SimplifyControls />
                <VisualizationControls />
              </Stack>
            </Col>
          </Row>
        </Container>
      :
        <Container>
          <div className='m-4 text-center'>
            { loading ? 
              <>
                <h5>Loading...</h5>
                <Spinner animation='border' />
              </>
            : <h3>No data</h3> }
          </div>
        </Container>
      }
    </VisualizationProvider>
    </SimplifyProvider>
  );
};
