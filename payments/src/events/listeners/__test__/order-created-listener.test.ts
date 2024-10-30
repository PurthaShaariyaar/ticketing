import mongoose from "mongoose";
import { OrderCreatedEvent, OrderStatus } from "@pshaariyaartickets/common";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedListener } from "../order-created-listener";
import { Order } from "../../../models/order";

// Setup for order created event
const setup = async () => {
  // Create listener instance
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create data object for order created event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: 'asdlfa',
    status: OrderStatus.Created,
    userId: '123',
    ticket: {
      id: '321',
      price: 10
    }
  }

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  // Return
  return { listener, data, msg };
}

it('Replicates the order info.', async () => {
  // Call setup to initiate an order created event
  const { listener, data, msg } = await setup();

  // Call listener onMessage
  await listener.onMessage(data, msg);

  // Find the order
  const order = await Order.findById(data.id);

  // Write an assertion to check if order retrieved is correct
  expect(order!.price).toEqual(data.ticket.price);
});

it('Acks the message.', async () => {
  // Call setup to initiate an order created event
  const { listener, data, msg } = await setup();

  // Call listener onMessage
  await listener.onMessage(data, msg);

  // Write an assertion to check if msg.ack() was called
  expect(msg.ack).toHaveBeenCalled();
});
