import { Subjects, Listener, ExpirationCompleteEvent, OrderStatus } from "@pshaariyaartickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { OrderCancelledPublisher } from "../publisher/order-cancelled-publisher";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    // Find the order
    const order = await Order.findById(data.orderId).populate('ticket');

    // Check if there is an order with the orderId, if not throw an error
    if (!order) {
      throw new Error('Order not found.');
    }

    // Ensure that the order has not been paid for, if it has simply return and call msg.ack() so we do not cancel the order
    if (order.status === OrderStatus.Complete) {
      return msg.ack();
    }

    // Update the order status to cancelled and save the order
    order.set({
      status: OrderStatus.Cancelled
    });
    await order.save();

    // Publish an event to let all other services know that the order was cancelled
    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id
      }
    });

    // Acknowledge the published event
    msg.ack();
  }
}
