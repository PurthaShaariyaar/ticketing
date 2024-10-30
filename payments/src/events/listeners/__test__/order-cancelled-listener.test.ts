import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Order } from "../../../models/order";
import mongoose from "mongoose";
import { OrderStatus, OrderCancelledEvent } from "@pshaariyaartickets/common";
import { Message } from "node-nats-streaming";

// Setup to initiate an order cancelled event
const setup = async () => {
  // Initiate a listener instance
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create an order and save it to db
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 10,
    userId: '123',
    status: OrderStatus.Created
  });
  await order.save();

  // Create data object for order cancelled event
  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,
    ticket: {
      id: '123'
    }
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  // Return
  return { listener, order, data, msg };
}

it('Updates the status of the order.', async () => {
  // Call setup
  const { listener, order, data, msg } = await setup();

  // Call listener onMessage
  await listener.onMessage(data, msg);

  // Find the updated order
  const updatedOrder = await Order.findById(order.id);

  // Write an assertion to ensure that the order stats was updated to cancelled
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('Acks the message.', async () => {
  // Call setup
  const { listener, order, data, msg } = await setup();

  // Call listener
  await listener.onMessage(data, msg);

  // Write an assertion to ensure msg.ack() was called
  expect(msg.ack).toHaveBeenCalled();
});
