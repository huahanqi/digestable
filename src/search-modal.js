import React, { useState, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { TableWrapper } from './components/table-wrapper';
import InputGroup from 'react-bootstrap/InputGroup';
import { SimplifyContext } from './contexts';

export const Search_model = ({ data }) => {
  const [{ unselect }, simplifyDispatch] = useContext(SimplifyContext);
  const [show, setShow] = useState(false);
  const [dataDisplayed, setDataDisplayed] = useState(data);
  const handleSave = () => setShow(false);
  const handleShow = () => {
    setDataDisplayed(data);
    setShow(true);
  };
  const [value, setValue] = useState('');

  const handleCancel = (evt) => {
    simplifyDispatch({
      type: 'setUnselect',
      unselect: evt.target.value === 'true',
    });
    setShow(false);
  };
  const handleSearch = (e) => {
    e.preventDefault();
    const columns = data.columns;
    let final_result = [];
    //console.log(final_result);
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const local_result = data.filter((d) =>
        d[col].toLowerCase().includes(value.toLowerCase())
      );
      final_result = [...new Set([...local_result, ...final_result])];
    }
    final_result['columns'] = columns;
    //console.log(final_result);
    setDataDisplayed(final_result);
    setValue('');
  };
  return (
    <>
      <Button variant='primary' onClick={handleShow}>
        Search Rows
      </Button>

      <Modal
        size='lg'
        show={show}
        onHide={handleSave}
        backdrop='static'
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Search Box</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup className='mb-3'>
              <Form.Control
                placeholder='Type any relavant information to search'
                // aria-label='Search'
                // aria-describedby='basic-addon2'
                type='text'
                onChange={(e) => setValue(e.target.value)}
                value={value}
              />
              <Button
                variant='outline-secondary'
                id='button-addon2'
                type='submit'
              >
                Search
              </Button>
            </InputGroup>
          </Form>
          <TableWrapper data={dataDisplayed} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCancel} value={!unselect}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSave}>
            Save Selections
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
