import { Container, Navbar, Row, Col } from 'react-bootstrap';

const { Brand } = Navbar;

function App() {
  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Brand>
          <div className="ms-3">diges<b>table</b></div>
        </Brand>
      </Navbar>
      <Container fluid>      
        <Row>
          <Col>
            <div className="ms-3">hello</div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
