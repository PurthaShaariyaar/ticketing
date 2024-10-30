import express, { Request, Response } from 'express';
import { NotAuthorizedError, NotFoundError, requireAuth } from '@pshaariyaartickets/common';
import { Order, OrderStatus } from '../models/order';
import { OrderCancelledPublisher } from '../events/publisher/order-cancelled-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.delete('/api/orders/:orderId', requireAuth, async (req: Request, res: Response) => {

  // Destructure the orderId from the request paramaters
  const { orderId } = req.params;

  // Find the order based on the orderId and populate the ticket
  const order = await Order.findById(orderId).populate('ticket');

  // Check if the order exists
  if (!order) {
    throw new NotFoundError();
  }

  // Check if the order is associated to the user requesting the order
  if (order.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }

  // Update the status of the order and save it to the database
  order.status = OrderStatus.Cancelled;
  await order.save();

  // Publish an event stating the order was cancelled
  new OrderCancelledPublisher(natsWrapper.client).publish({
    id: order.id,
    version: order.version,
    ticket: {
      id: order.ticket.id
    }
  })

  res.status(204).send(order);
});

export { router as deleteOrderRouter }
