import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import mongoose from 'mongoose';

it('Fetches the order', async () => {
  // Create the ticket and save to database
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString() ,
    title: 'Concert',
    price: 20
  });
  await ticket.save()

  // Sign the user in
  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201)

  // Make a request to fetch the order
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  // Test if the fetchedOrder.id matches the order.id
  expect(fetchedOrder.id).toEqual(order.id);
});

it('Returns an error if one user tries to fetch another users order.', async () => {
  // Create the ticket and save to database
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Concert',
    price: 20
  });
  await ticket.save()

  // Sign the user in
  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201)

  // Make a request to fetch the order
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', global.signin())
    .send()
    .expect(401);
});
