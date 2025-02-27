import { Publisher, Subjects, TicketCreatedEvent } from '@pshaariyaartickets/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
}
