import express, { Request, Response } from 'express';
import { requireAuth, NotFoundError, NotAuthorizedError } from '@pshaariyaartickets/common';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders/:orderId', requireAuth, async (req: Request, res: Response) => {

  // Find the order via the orderId
  const order = await Order.findById(req.params.orderId).populate('ticket');

  // Check if the order exists
  if (!order) {
    throw new NotAuthorizedError();
  }

  // Check if the order is associated to the user requesting the order
  if (order.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }

  // Send the order to the user
  res.send(order);
});

export { router as showOrderRouter }
