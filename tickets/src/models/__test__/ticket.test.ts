import { Ticket } from "../ticket";

it('Test to see if it implements optimistic concurrency control.', async () => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: 'Ticket A',
    price: 20,
    userId: '123'
  })

  // Save the ticket to the database
  await ticket.save()

  // Fetch the same ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id)

  // Make two separate changes to the tickets fetched
  firstInstance!.set({ price: 30 });
  secondInstance!.set({ price: 5 });

  // Save the first fetched ticket
  await firstInstance!.save();

  // Save the second fetched ticket > leads to error > has old version number
  try {
    await secondInstance!.save();
  } catch (err) {
    return;
  }

  throw new Error('Should not reach this point');
});

it('Increments the version number on multiple saves.', async () => {
  const ticket = Ticket.build({
    title: 'Ticket A',
    price: 10,
    userId: '123'
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);
  await ticket.save();
  expect(ticket.version).toEqual(1);
  await ticket.save();
  expect(ticket.version).toEqual(2);
});
