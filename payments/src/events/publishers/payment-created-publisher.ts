import { Subjects, Publisher, PaymentCreatedEvent } from "@pshaariyaartickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
