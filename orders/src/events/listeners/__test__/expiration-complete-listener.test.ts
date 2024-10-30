import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderStatus, ExpirationCompleteEvent } from "@pshaariyaartickets/common";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Order } from "../../../models/order";
import { Ticket } from "../../../models/ticket";

// Setup an expiration complete event
const setup = async () => {

  // Create an instance of expiration complete listener
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // Build a ticket then save it
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Ticket A',
    price: 20
  });
  await ticket.save();

  // Build an order then save it
  const order = Order.build({
    status: OrderStatus.Created,
    userId: '123',
    expiresAt: new Date(),
    ticket,
  });
  await order.save();


  // Build data object
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id
  };

  // Acknowledge the message
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  // Return
  return { listener, ticket, order, data, msg };
};

it('Updates the order status to cancelled.', async () => {

  // Call setup to initiate an expiration complete event
  const { listener, ticket, order, data, msg } = await setup();

  // Call listener onMessage and pass in data and msg
  await listener.onMessage(data, msg);

  // Find the updated order
  const updatedOrder = await Order.findById(order.id);

  // Write an assertion to ensure the order status was updated
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('Emits an OrderCancelled event.', async () => {
  // Call setup to initiate an expiration complete event
  const { listener, ticket, order, data, msg } = await setup();

  // Call listener onMessage and pass in data and msg
  await listener.onMessage(data, msg);

  // Write an assertion to ensure publish event was called
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // Call publish to initiate an event and assign to event data
  const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

  // Ensure the event data matches the order id
  expect(eventData.id).toEqual(order.id);
});

it('Ack the message.', async () => {
  // Call setup to initiate an expiration complete event
  const { listener, ticket, order, data, msg } = await setup();

  // Call listener onMessage and pass in data and msg
  await listener.onMessage(data, msg);

  // Write an assertion to ensure the msg.ack fucntion was invoked
  expect(msg.ack).toHaveBeenCalled();
});
