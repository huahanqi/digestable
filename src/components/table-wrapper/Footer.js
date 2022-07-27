import { Button, Form, Row, Col } from 'react-bootstrap';

const Footer = ({ loadMore, isFullData, setIsFullData, rowNum, setRowNum }) => {
  // handle form submit
  const onFormSubmit = (e) => {
    e.preventDefault();
    setRowNum('');
  };
  return (
    <div
      style={{
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        position: 'sticky',
        left: '0',
        zIndex: '3',
        backgroundColor: 'white',
      }}
    >
      <Form onSubmit={onFormSubmit}>
        <Row>
          <Col xs='auto'>
            <Form.Control
              type='number'
              placeholder='Number of rows'
              value={rowNum}
              onChange={(e) => setRowNum(e.target.value)}
            />
          </Col>
          <Col xs='auto'>
            <Button
              disabled={isFullData}
              style={{
                marginLeft: '1rem',
              }}
              type='submit'
            >
              {isFullData ? 'End of Data' : 'Load More'}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};
export default Footer;
