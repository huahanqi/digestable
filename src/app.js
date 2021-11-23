import { Container, Navbar, Row, Col } from 'react-bootstrap';
import { TableWrapper } from './components/table-wrapper';
const { Brand } = Navbar;

export const App = () => {
  return (
    <>
      <Navbar bg='dark' variant='dark'>
        <Brand>
          <img 
            src='/digestable_512.png' 
            alt='digestable logo'
            height='25px'
            className='me-1 align-text-bottom'              
          />
          <span className='align-text-bottom'>diges<b>table</b></span>
        </Brand>        
      </Navbar>
      <Container fluid>      
        <Row>
          <Col className='mt-3'>
            <TableWrapper data={[['col1', 'col2', 'col3'], [1, 2, 3], [4, 5, 6]]} />
          </Col>
        </Row>
      </Container>
    </>
  );
};
