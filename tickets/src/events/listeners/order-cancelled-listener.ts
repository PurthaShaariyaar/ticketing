import { Listener, OrderCancelledEvent, Subjects } from "@pshaariyaartickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // Find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // If no ticket found then throw an error
    if (!ticket) {
      throw new Error('Ticket not found.');
    }

    // Order cancelled so ensure the ticket is no longer reserved
    ticket.set({ orderId: undefined });

    // Save the ticket
    await ticket.save();

    // Publish the updated ticket
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      price: ticket.price,
      title: ticket.title,
      userId: ticket.userId,
      orderId: ticket.orderId
    });

    // Acknowledge the message
    msg.ack();
  }
}
