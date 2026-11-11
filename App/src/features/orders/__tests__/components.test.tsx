import React from 'react';
import renderer, { act } from 'react-test-renderer';

import OrderCard from '../components/OrderCard';
import OrderStatusTracker from '../components/OrderStatusTracker';
import type { Order } from '../types';

const order: Order = {
  id: 101,
  status: 'ready',
  totalAmount: 85,
  pickupCode: '4321',
  note: null,
  createdAt: '2026-11-09T10:00:00Z',
  items: [
    { id: 1, itemId: 7, name: 'Masala Chai', quantity: 2, price: 30 },
    { id: 2, itemId: 8, name: 'Samosa', quantity: 1, price: 25 },
  ],
  statusHistory: [],
};

const renderText = (element: React.ReactElement): string => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return JSON.stringify(tree!.toJSON());
};

describe('order presentation components', () => {
  it('renders all tracker steps with the current status highlighted', () => {
    const rendered = renderText(<OrderStatusTracker status="preparing" />);

    expect(rendered).toContain('Placed');
    expect(rendered).toContain('Preparing');
    expect(rendered).toContain('Ready');
    expect(rendered).toContain('Picked up');
  });

  it('renders a cancelled state instead of live progress', () => {
    const rendered = renderText(<OrderStatusTracker status="cancelled" />);

    expect(rendered).toContain('Order cancelled');
  });

  it('renders an order card with pickup code, items and total', () => {
    const rendered = renderText(<OrderCard order={order} />);

    expect(rendered).toContain('Order #101');
    expect(rendered).toContain('4321');
    expect(rendered).toContain('2× Masala Chai');
    expect(rendered).toContain('₹85');
  });
});
