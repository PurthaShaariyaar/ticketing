import mongoose from "mongoose";
import { TicketUpdatedEvent } from "@pshaariyaartickets/common";
import { TicketUpdatedListener } from "../ticket-updated-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Ticket A',
    price: 10
  });
  await ticket.save()

  // Create a fake data event to update the ticket
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'new concert',
    price: 999,
    userId: 'ablskdjf',
  };

  // Create a fake msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  }

  // Return
  return { msg, data, ticket, listener };
}

it('Finds, updates, and saves a ticket.', async () => {
  // Setup listener, ticket, and update event data
  const { msg, data, ticket, listener } = await setup();

  // Call the onMessage function with the data + message object
  await listener.onMessage(data, msg);

  // Find ticket and assign to updated ticket
  const updatedTicket = await Ticket.findById(ticket.id);

  // Write assertions to ensure the ticket was updated
  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
});

it('Acks the message.', async () => {
  // Setup listener, ticket and update event data
  const { msg, data, ticket, listener } = await setup();

  // Call the onMessage function with the data + message object
  await listener.onMessage(data, msg);

  // Write assertions to ensure ack was called
  expect(msg.ack).toHaveBeenCalled();
});

it('Does not call ack if the event has a skipped version number.', async () => {
  // Setup listener, ticket, and update event data
  const { msg, data, ticket, listener } = await setup();

  // Update the data version
  data.version = 10;

  // try to call onMessage, if err > catch it
  try {
    await listener.onMessage(data, msg);
  } catch (err) {

  }

  // Write an assertion to ensure the message was not ack
  expect(msg.ack).not.toHaveBeenCalled();
});
