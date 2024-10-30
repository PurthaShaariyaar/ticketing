import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketUpdatedEvent } from "@pshaariyaartickets/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {

    // Find ticket with version one less than current update version
    const ticket = await Ticket.findByEvent(data);

    // If ticket does not exist throw an error
    if (!ticket) {
      throw new Error('Ticket not found.');
    }

    // Destructure and get the title and price of the ticket > set the new ticket details and save
    const { title, price } = data;
    ticket.set({ title, price });
    await ticket.save();

    // Acknowledge the message
    msg.ack();
  }
}

