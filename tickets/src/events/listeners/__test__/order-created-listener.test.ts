import { OrderCreatedEvent, OrderStatus } from "@pshaariyaartickets/common";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import exp from "constants";

// Setup for testing reservation of a ticket
const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    title: 'Ticket A',
    price: 10,
    userId: '123'
  });
  await ticket.save();

  // Create an OrderCreatedEvent
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: '12345',
    expiresAt: '12',
    ticket: {
      id: ticket.id,
      price: ticket.price
    }
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  // Return
  return { listener, ticket, data, msg }
};

it('Sets the orderId of the ticket.', async () => {
  // Call setup to reserve a ticket
  const { listener, ticket, data, msg } = await setup();

  // Call onMessage
  await listener.onMessage(data, msg);

  // Fetch the updatedTicket with the new orderId
  const updatedTicket = await Ticket.findById(ticket.id);

  // Write an assertion to check if the updatedTicket id matches the order id just created via data
  expect(updatedTicket!.orderId).toEqual(data.id);
});

it('Acks the message.', async () => {
  // Call setup to reserve a ticket
  const { listener, ticket, data, msg } = await setup();

  // Call onMessage
  await listener.onMessage(data, msg);

  // Write an assertion to check if msg.ack() was called
  expect(msg.ack).toHaveBeenCalled();
});

it('Publishes a ticket updated event.', async () => {
  // Call setup to reserve a ticket
  const { listener, ticket, data, msg } = await setup();

  // Call onMessage
  await listener.onMessage(data, msg);

  // Write an assertion to check if msg.ack() was called
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // Viewing mock data
  const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

  // Write an assertion to ensure the data id is equal to the order id of the ticket
  expect(data.id).toEqual(ticketUpdatedData.orderId);
});
