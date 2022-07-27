import { Button, Form, Row, Col } from 'react-bootstrap';

const Footer = ({ loadMore, isFullData, rowNum, setRowNum, max }) => {
  // handle form submit
  const onFormSubmit = (e) => {
    e.preventDefault();
    loadMore(rowNum);
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
              style={{ width: '12rem' }}
              type='number'
              placeholder='Number of Rows'
              min='0'
              max={max}
              value={rowNum}
              onChange={(e) => setRowNum(e.target.value)}
              disabled={isFullData}
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
