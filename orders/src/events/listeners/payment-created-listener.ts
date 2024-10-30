import { Subjects, Listener, PaymentCreatedEvent, OrderStatus } from "@pshaariyaartickets/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  // Purpose of this listener is to update the status of  the order to complete
  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    // Find the order
    const order = await Order.findById(data.orderId);

    // Verify if the order exists, if not throw an Error
    if (!order) {
      throw new Error('Order not found.');
    }

    // Since order found, update the status of the order and save it
    order.set({
      status: OrderStatus.Complete
    });
    await order.save();

    // Acknowledge the message
    msg.ack();
  }
}
