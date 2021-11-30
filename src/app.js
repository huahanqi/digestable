import { useState } from 'react';
import { Container, Navbar, Row, Col, Form } from 'react-bootstrap';
import * as d3 from 'd3';
import { TableWrapper } from './components/table-wrapper';
import { Controls } from './components/controls';

const { Brand } = Navbar;
const { Control } = Form;

export const App = () => {
  const [data, setData] = useState(null);
  const [simplify, setSimplify] = useState(false);
  const [simplification, setSimplification] = useState(0.9);

  const onFileSelect = async evt => {
    const file = evt.target.files.length === 1 ? evt.target.files[0] : null;

    if (!file) {
      setData(null);
      return;
    }

    const url = URL.createObjectURL(file);

    try {
      const csvData = await d3.csv(url);

      setData(csvData);
    }
    catch (error) {
      console.log(error);
    }
  };

  const onSimplifyChange = value => {
    setSimplify(value);
  };

  const onSimplificationChange = value => {
    setSimplification(value);
  };

  console.log(simplification);

  return (
    <>
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
              <TableWrapper 
                data={ data } 
                simplify={ simplify } 
                simplification={ simplification }
              />
            </Col>
            <Col className='bg-dark text-light pt-3'>
              <Controls 
                simplify={ simplify } 
                simplification={ simplification }
                onSimplifyChange={ onSimplifyChange } 
                onSimplificationChange={ onSimplificationChange }
              />
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
    </>
  );
};
