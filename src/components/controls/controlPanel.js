import { Card, Stack } from 'react-bootstrap';

const { Header, Body, Subtitle } = Card;

export const ControlPanel = ({ title, subtitle, children }) => {
  return (
    <Card>
      <Header>{ title }</Header>
      <Body>
        { subtitle && 
          <Subtitle className='mb-2 text-muted'>
            { subtitle}
          </Subtitle>
        }
        <Stack gap={ 3 }>
          { children }
        </Stack>
      </Body>
    </Card>
  );
};
