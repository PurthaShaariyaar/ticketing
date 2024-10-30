import { Publisher, Subjects, TicketUpdatedEvent } from '@pshaariyaartickets/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}


