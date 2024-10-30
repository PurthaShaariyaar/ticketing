import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Order } from '../../models/order';
import { OrderStatus } from '@pshaariyaartickets/common';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

// jest.mock('../../stripe');

it('Returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'aasldfj',
      orderId: new mongoose.Types.ObjectId().toHexString()
    })
    .expect(404);
});

it('Returns a 401 when purchasing an order that does not belong to the user.', async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId: new mongoose.Types.ObjectId().toHexString(),
    price: 10,
    status: OrderStatus.Created
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'asdlkfja',
      orderId: order.id
    })
    .expect(401)
});

it('Returns a 400 when purchasing a cancelled order.', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId,
    price: 10,
    status: OrderStatus.Cancelled
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      orderId: order.id,
      token: 'asdlf'
    })
    .expect(400);
});

it('Returns a 201 with valid inputs.', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId,
    price,
    status: OrderStatus.Created
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201);

  // **********  TEST CHARGE **********

  // const paymentIntentOptions = (stripe.paymentIntents.create as jest.Mock).mock.calls[0][0];
  // const paymentMethodOptions = (stripe.paymentMethods.create as jest.Mock).mock.calls[0][0];

  // Validate the payment method creation
  // expect(paymentMethodOptions).toEqual({
  //   type: 'card',
  //   card: {
  //     token: 'tok_visa'
  //   }
  // });

  // Validate the payment intent creation
  // expect(paymentIntentOptions).toEqual({
  //   amount: 1000, // Ensure this matches the price in cents
  //   currency: 'usd',
  //   payment_method: 'pm_mockedPaymentMethodId',
  //   confirm: true,
  //   automatic_payment_methods: {
  //     allow_redirects: 'never',
  //     enabled: true,
  //   }
  // });

  // console.log(paymentMethodOptions);
  // console.log(paymentIntentOptions);

  // ********** ACTUAL STRIPE API TEST **********

  // Use list method to retrieve past transactions
  const stripePaymentIntentList = await stripe.paymentIntents.list({
    limit: 50
  });

  // Find the charge equivalent to price
  const stripePaymentIntentCharge = stripePaymentIntentList.data.find((charge) => {
    return charge.amount === price * 100;
  });

  // Write an assertion to ensure the charge is defined
  expect(stripePaymentIntentCharge).toBeDefined();
  expect(stripePaymentIntentCharge!.currency).toEqual('usd');


  console.log(stripePaymentIntentList);
  console.log(stripePaymentIntentCharge);

  // Find a payment
  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripePaymentIntentCharge!.id
  });

  // Write an assertion to ensure that payment is not null
  expect(payment).not.toBeNull();
});
