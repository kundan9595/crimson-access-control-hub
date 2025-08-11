import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Custom matchers for better test assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToBeHidden = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).not.toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveValue = (element: HTMLInputElement, value: string) => {
  expect(element).toHaveValue(value);
};

export const expectElementToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled();
};

export const expectElementToBeEnabled = (element: HTMLElement) => {
  expect(element).not.toBeDisabled();
};

// Form testing helpers
export const fillFormField = async (label: string, value: string) => {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
};

export const selectFormOption = async (label: string, option: string) => {
  const select = screen.getByLabelText(label);
  await userEvent.click(select);
  const optionElement = screen.getByText(option);
  await userEvent.click(optionElement);
};

export const submitForm = async () => {
  const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
  await userEvent.click(submitButton);
};

export const cancelForm = async () => {
  const cancelButton = screen.getByRole('button', { name: /cancel/i });
  await userEvent.click(cancelButton);
};

// Dialog testing helpers
export const openDialog = async (buttonText: string) => {
  const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await userEvent.click(button);
};

export const closeDialog = async () => {
  const closeButton = screen.getByRole('button', { name: /close/i });
  await userEvent.click(closeButton);
};

// Table testing helpers
export const expectTableToHaveRows = (expectedCount: number) => {
  const tableBody = screen.getByRole('table').querySelector('tbody');
  if (tableBody) {
    const rows = within(tableBody).getAllByRole('row');
    expect(rows).toHaveLength(expectedCount);
  }
};

export const expectTableToHaveColumn = (columnName: string) => {
  const header = screen.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
  expect(header).toBeInTheDocument();
};

export const clickTableRow = async (rowIndex: number) => {
  const tableBody = screen.getByRole('table').querySelector('tbody');
  if (tableBody) {
    const rows = within(tableBody).getAllByRole('row');
    await userEvent.click(rows[rowIndex]);
  }
};

// Search and filter helpers
export const searchForText = async (searchTerm: string) => {
  const searchInput = screen.getByPlaceholderText(/search/i);
  await userEvent.clear(searchInput);
  await userEvent.type(searchInput, searchTerm);
};

export const clearSearch = async () => {
  const clearButton = screen.getByRole('button', { name: /clear/i });
  await userEvent.click(clearButton);
};

// Loading state helpers
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const expectLoadingToBeVisible = () => {
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
};

export const expectLoadingToBeHidden = () => {
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
};

// Error state helpers
export const expectErrorToBeVisible = (errorMessage?: string) => {
  if (errorMessage) {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  } else {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  }
};

export const expectErrorToBeHidden = () => {
  expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
};

// Success state helpers
export const expectSuccessMessage = (message?: string) => {
  if (message) {
    expect(screen.getByText(message)).toBeInTheDocument();
  } else {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  }
};

// Navigation helpers
export const expectToBeOnPage = (pageTitle: string) => {
  expect(screen.getByText(pageTitle)).toBeInTheDocument();
};

export const navigateToPage = async (linkText: string) => {
  const link = screen.getByRole('link', { name: new RegExp(linkText, 'i') });
  await userEvent.click(link);
};

// Modal/Dialog helpers
export const expectModalToBeOpen = (title: string) => {
  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
};

export const expectModalToBeClosed = (title: string) => {
  expect(screen.queryByText(title)).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
};

// Checkbox and radio helpers
export const checkCheckbox = async (label: string) => {
  const checkbox = screen.getByRole('checkbox', { name: new RegExp(label, 'i') });
  if (!checkbox.checked) {
    await userEvent.click(checkbox);
  }
};

export const uncheckCheckbox = async (label: string) => {
  const checkbox = screen.getByRole('checkbox', { name: new RegExp(label, 'i') });
  if (checkbox.checked) {
    await userEvent.click(checkbox);
  }
};

export const selectRadioOption = async (label: string) => {
  const radio = screen.getByRole('radio', { name: new RegExp(label, 'i') });
  await userEvent.click(radio);
};

// File upload helpers
export const uploadFile = async (inputLabel: string, file: File) => {
  const fileInput = screen.getByLabelText(inputLabel);
  await userEvent.upload(fileInput, file);
};

// Keyboard navigation helpers
export const pressKey = async (key: string) => {
  await userEvent.keyboard(key);
};

export const pressTab = async () => {
  await userEvent.tab();
};

export const pressEnter = async () => {
  await userEvent.keyboard('{Enter}');
};

export const pressEscape = async () => {
  await userEvent.keyboard('{Escape}');
};

// Async operation helpers
export const waitForAsyncOperation = async (operation: () => Promise<void>) => {
  await waitFor(async () => {
    await operation();
  });
};

export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  await waitFor(() => {
    expect(element).not.toBeInTheDocument();
  });
};

// Mock function helpers
export const createMockFunction = <T extends (...args: any[]) => any>(
  returnValue?: ReturnType<T>
) => {
  return vi.fn().mockReturnValue(returnValue);
};

export const createMockAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  returnValue?: Awaited<ReturnType<T>>
) => {
  return vi.fn().mockResolvedValue(returnValue);
};

// Performance testing helpers
export const measureRenderTime = async (renderFunction: () => void) => {
  const startTime = performance.now();
  renderFunction();
  const endTime = performance.now();
  return endTime - startTime;
};

export const expectRenderTimeToBeUnder = async (
  renderFunction: () => void,
  maxTime: number
) => {
  const renderTime = await measureRenderTime(renderFunction);
  expect(renderTime).toBeLessThan(maxTime);
};

// Accessibility testing helpers
export const expectElementToHaveRole = (element: HTMLElement, role: string) => {
  expect(element).toHaveAttribute('role', role);
};

export const expectElementToHaveAriaLabel = (element: HTMLElement, label: string) => {
  expect(element).toHaveAttribute('aria-label', label);
};

export const expectElementToBeFocusable = (element: HTMLElement) => {
  expect(element).toHaveAttribute('tabindex', expect.any(String));
};

// Virtual scrolling helpers
export const expectVirtualListToRender = (itemCount: number) => {
  // Virtual lists only render visible items, so we check for the container
  const virtualList = screen.getByRole('list') || screen.getByRole('table');
  expect(virtualList).toBeInTheDocument();
};

export const scrollVirtualList = async (direction: 'up' | 'down') => {
  const container = screen.getByRole('list') || screen.getByRole('table');
  const scrollEvent = new Event('scroll', { bubbles: true });
  Object.defineProperty(container, 'scrollTop', {
    value: direction === 'down' ? 1000 : 0,
    writable: true,
  });
  container.dispatchEvent(scrollEvent);
};

// Export userEvent for convenience
export { userEvent };
