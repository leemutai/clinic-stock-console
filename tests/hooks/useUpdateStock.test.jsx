import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateStock } from '../../src/hooks/useProducts';
import { productsApi } from '../../src/api/products';

vi.mock('../../src/api/products', () => ({
  productsApi: {
    updateStock: vi.fn(),
  },
}));

function makeWrapper(queryClient) {
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('useUpdateStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('optimistically writes the new stock into the detail cache', async () => {
    const queryClient = makeClient();
    queryClient.setQueryData(['product', 1], { id: 1, title: 'Widget', stock: 10 });

    // Never resolves — we inspect the optimistic state before the mutation settles.
    productsApi.updateStock.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    });

    result.current.mutate({ id: 1, stock: 42 });

    await waitFor(() => {
      const cached = queryClient.getQueryData(['product', 1]);
      expect(cached.stock).toBe(42);
    });
  });

  it('rolls back the detail cache when the mutation fails', async () => {
    // This is the test that matters: a failed save must not leave the UI
    // showing a stock count the server never accepted.
    const queryClient = makeClient();
    queryClient.setQueryData(['product', 1], { id: 1, title: 'Widget', stock: 10 });

    productsApi.updateStock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    });

    result.current.mutate({ id: 1, stock: 42 });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData(['product', 1]);
    expect(cached.stock).toBe(10);
  });

  it('rolls back list pages when the mutation fails', async () => {
    // Same principle applied to the list cache: every page that
    // contained the optimistic edit must be restored.
    const queryClient = makeClient();
    queryClient.setQueryData(['products', { page: 1 }], {
      products: [
        { id: 1, title: 'Widget', stock: 10 },
        { id: 2, title: 'Gadget', stock: 5 },
      ],
      total: 2,
    });

    productsApi.updateStock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    });

    result.current.mutate({ id: 1, stock: 42 });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData(['products', { page: 1 }]);
    expect(cached.products[0].stock).toBe(10);
    expect(cached.products[1].stock).toBe(5);
  });
});
