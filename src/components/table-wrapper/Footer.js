import { Button, Form, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
const Footer = ({
  loadMore,
  isFullData,
  addrowNum,
  setAddRowNum,
  max,
  displayRowNum,
  refreshDisplayRowNum,
}) => {
  // handle form submit
  const [displayRowNumAct, setDisplayRowNumAct] = useState(
    displayRowNum || 100
  );

  const onFormSubmit = (e) => {
    e.preventDefault();
    loadMore(addrowNum);
    if (refreshDisplayRowNum() > max) {
      setDisplayRowNumAct(max);
    } else {
      setDisplayRowNumAct(refreshDisplayRowNum());
    }
    setAddRowNum(100);
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
            <Form.Text
              style={{ position: 'relative', top: '.5rem', fontSize: '1rem' }}
            >
              Showing {displayRowNumAct} of {max} rows
            </Form.Text>
          </Col>
          <Col xs='auto'>
            <Button
              disabled={isFullData}
              // style={{
              //   marginLeft: '1rem',
              // }}
              type='submit'
            >
              {isFullData ? 'End of Data' : `Load ${addrowNum} more rows`}
            </Button>
          </Col>
          <Col xs='auto'>
            <Form.Control
              //style={{ width: '8rem' }}
              type='number'
              //placeholder='more rows'
              min='1'
              max={max}
              value={addrowNum}
              onChange={(e) => setAddRowNum(e.target.value)}
              disabled={isFullData}
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
};
export default Footer;
