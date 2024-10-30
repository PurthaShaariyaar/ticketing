import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

it('Has a route handler listening to /api/tickets for a post request', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({});

    expect(response.status).not.toEqual(404);
});

it('If user is not authenticated, throw an error', async () => {
  await request(app)
    .post('/api/tickets')
    .send({})
    .expect(401);
});

it('If user is authenticated expect a succes status of 200 OK', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('Returns an error if an invalid title attribute is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: '',
      price: 10
    })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      price: 10
    })
    expect(400);
});

it('Returns an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'alskdfjalkd',
      price: -10
    })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'aslkdfj',
    })
    .expect(400);
});

it('Creates a ticket with valid inputs', async () => {

  // Add in a check to make sure a ticket was created
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);

  const title = 'Ticket A';

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 10
    })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].title).toEqual(title);
  expect(tickets[0].price).toEqual(10);
});

it('Publishes an event', async () => {

  const title = 'askdlfja'

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 20
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
