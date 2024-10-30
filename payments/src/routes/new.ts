import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotFoundError,
  NotAuthorizedError,
  OrderStatus
} from '@pshaariyaartickets/common';
import { stripe } from '../stripe';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

// Create an instance of an Express router object
const router = express.Router();

// Create post request to handle payments in this API
router.post('/api/payments',
  requireAuth,
  [
    body('token')
      .not()
      .isEmpty(),
    body('orderId')
      .not()
      .isEmpty()
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // Destructure incoming request parameters
    const { token, orderId } = req.body;

    // Find the order
    const order = await Order.findById(orderId);

    // Check if the order exists
    if (!order) {
      throw new NotFoundError();
    }

    // Check if the same user made the request, if not throw error
    if (order!.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // Check to see if the order status is cancelled, if so throw bad request error
    if (order!.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Order is cancelled, cannot initiate a charge.');
    }

    // Stripe needs a payment method for card token, create a payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: token
      },
    })

    // Create a charge via stripe payment intents
    const charge = await stripe.paymentIntents.create({
      amount: order.price * 100,
      currency: 'usd',
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    // Build a payment and save it
    const payment = Payment.build({
      orderId,
      stripeId: charge.id
    });
    await payment.save();

    // Create a new instance of Payment Created Event Publisher
    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId
    });

    // If payment is successfull, return id of payment created
    res.status(201).send({ id: payment.id });
});

// Export router
export { router as createChargeRouter };
