jest.mock('../database/connection', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock('./calendar.service', () => ({
  syncSlotToCalendar: jest.fn(),
}));

jest.mock('./email.service', () => ({
  sendEmail: jest.fn(),
}));

import * as database from '../database/connection';
import { dispatchBackgroundJobs } from './jobs.service';

describe('dispatchBackgroundJobs', () => {
  it('does not expose background queue failures to the caller', async () => {
    const queueError = new Error('provider timeout');
    (database.withTransaction as jest.Mock).mockRejectedValueOnce(queueError);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(dispatchBackgroundJobs(1)).toBeUndefined();

    await new Promise(resolve => setImmediate(resolve));
    expect(consoleError).toHaveBeenCalledWith('Background job dispatch failed:', queueError);
    consoleError.mockRestore();
  });
});
