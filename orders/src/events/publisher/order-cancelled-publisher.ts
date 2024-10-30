import { Subjects,Publisher, OrderCancelledEvent } from "@pshaariyaartickets/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
