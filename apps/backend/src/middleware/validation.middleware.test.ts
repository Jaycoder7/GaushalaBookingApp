import { NextFunction, Request, Response } from 'express';
import { validateBookingInput } from './validation.middleware';

function responseMock() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const validBooking = {
  slotId: '00000000-0000-4000-8000-000000000001',
  familyName: 'Patel family',
  phone: '+15551234567',
  email: 'visitor@example.com',
  headcount: 3,
  referredBy: 'N/A',
  isDonor: false,
  isVolunteer: true,
  visitLocation: 'Cumming, GA',
  termsAccepted: true,
  noShowFeePledged: true,
};

describe('validateBookingInput', () => {
  it('accepts the visit profile fields', () => {
    const next = jest.fn() as NextFunction;
    validateBookingInput({ body: validBooking } as Request, responseMock(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('requires referral, donor, volunteer, and supported location selections', () => {
    const res = responseMock();
    const next = jest.fn() as NextFunction;
    validateBookingInput({
      body: { ...validBooking, referredBy: '', isDonor: 'no', isVolunteer: undefined, visitLocation: 'Other' },
    } as Request, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'VALIDATION_ERROR',
      details: expect.arrayContaining([
        expect.stringMatching(/Referral contact/),
        expect.stringMatching(/Donor selection/),
        expect.stringMatching(/Volunteer selection/),
        expect.stringMatching(/Invalid visit location/),
      ]),
    }));
  });

  it('requires both consent acknowledgements', () => {
    const res = responseMock();
    const next = jest.fn() as NextFunction;
    validateBookingInput({
      body: { ...validBooking, termsAccepted: false, noShowFeePledged: undefined },
    } as Request, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining([
        expect.stringMatching(/agree to the terms/i),
        expect.stringMatching(/no-show fee pledge/i),
      ]),
    }));
  });
});
