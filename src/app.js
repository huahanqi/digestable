import { useState } from 'react';
import { Container, Navbar, Row, Col, Form } from 'react-bootstrap';
import * as d3 from 'd3';
import { SimplifyProvider } from './contexts';
import { TableWrapper } from './components/table-wrapper';
import { SimplifyControls } from './components/simplifyControls';

const { Brand } = Navbar;
const { Control } = Form;

export const App = () => {
  const [data, setData] = useState(null);

  // XXX: Add loading spinner

  const onFileSelect = async evt => {
    setData(null);

    const file = evt.target.files.length === 1 ? evt.target.files[0] : null;

    if (!file) return;

    const url = URL.createObjectURL(file);

    try {
      const csvData = await d3.csv(url);

      setData(csvData);
    }
    catch (error) {
      console.log(error);
    }
  };

  return (
    <SimplifyProvider>
      <Navbar bg='dark' variant='dark'>
        <Brand className='ms-2'>
          <img 
            src='/digestable_512.png' 
            alt='digestable logo'
            height='32px'
            className='me-1'              
          />
          <span className='text-align-bottom'>diges<b>table</b></span>
        </Brand>        
        <Form>
          <Control 
            type='file'
            accept='.csv'
            onChange={ onFileSelect }
          />
        </Form>
      </Navbar>
      { data ? 
        <Container fluid style={{ height: 'calc(100% - 100px)' }}>      
          <Row style={{ height: '100%' }}>
            <Col xs={ 10 } className='mt-3' style={{ height: '100%'}}>
              <TableWrapper data={ data } />
            </Col>
            <Col className='bg-dark'>
              <SimplifyControls />
            </Col>
          </Row>
        </Container>
      :
        <Container>
          <div className='m-4 text-center'>
            <h3>No data</h3>
          </div>
        </Container>
      }
    </SimplifyProvider>
  );
};
