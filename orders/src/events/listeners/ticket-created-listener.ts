import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketCreatedEvent } from '@pshaariyaartickets/common';
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {

    // Extract ticket data
    const { id, title, price } = data;

    // Build and save the ticket
    const ticket = Ticket.build({
      id,
      title,
      price
    });
    await ticket.save();

    // Acknowledge the message
    msg.ack();
  }
}
