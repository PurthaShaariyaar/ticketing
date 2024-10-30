import { natsWrapper } from "../../../nats-wrapper"
import { OrderCancelledListener } from "../order-cancelled-listener";
import { Ticket } from "../../../models/ticket";
import mongoose from "mongoose";
import { OrderCancelledEvent } from "@pshaariyaartickets/common";
import { Message } from "node-nats-streaming";

// Setup for testing cancellation of a ticket
const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create a ticket and set it with an orderId
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'Ticket A',
    price: 20,
    userId: '123'
  });
  ticket.set({ orderId });
  await ticket.save();

  // Create an OrderCancelledEvent
  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id
    }
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  // Return
  return { listener, orderId, ticket, data, msg }
}

it('Updates the ticket, publishes an event, and acks the message.', async () => {
  // Call setup to cancel a ticket
  const { listener, orderId, ticket, data, msg } = await setup();

  // Call onMessage
  await listener.onMessage(data, msg);

  // Fetch the updatedTicket that should have the orderId set to undefined
  const updatedTicket = await Ticket.findById(ticket.id);

  // Write an assertion to check if the tickets orderId was set to undefined
  expect(updatedTicket!.orderId).not.toBeDefined();

  // Write an assertion to check if msg.ack() was called
  expect(msg.ack).toHaveBeenCalled();

  // Write an assertion to ensure publish function on nats client was invoked
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
