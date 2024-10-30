import { Subjects, Publisher, ExpirationCompleteEvent } from "@pshaariyaartickets/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
