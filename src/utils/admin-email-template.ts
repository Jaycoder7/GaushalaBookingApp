import { format, parseISO } from 'date-fns';
import { AdminBooking } from '../services/admin.service';
import { formatSlotTime } from './formatting';

const VISIT_ADDRESS = '1945 Old Atlanta Rd, Cumming, GA 30041';
const PARKING_ADDRESS = '3100-3660 Melody Mizer Ln, Cumming, GA 30041';

export interface ManualEmailTemplate {
  subject: string;
  body: string;
  copyText: string;
}

function visitSummary(booking: AdminBooking) {
  const date = format(parseISO(booking.slotDate), 'EEEE, MMMM d, yyyy');
  const time = formatSlotTime(booking.startTime, booking.endTime);
  const visitors = `${booking.headcount} ${booking.headcount === 1 ? 'visitor' : 'visitors'}`;
  return { date, time, visitors };
}

export function manualEmailTemplate(booking: AdminBooking): ManualEmailTemplate {
  const { date, time, visitors } = visitSummary(booking);
  const greeting = `Hello ${booking.familyName},`;
  const signoff = 'Warm regards,\nGaushala Visit Team';
  let subject: string;
  let paragraphs: string[];

  switch (booking.status) {
    case 'confirmed':
      subject = `Confirmed: Your Gaushala visit on ${date}`;
      paragraphs = [
        greeting,
        `Your Gaushala visit request has been approved. We look forward to welcoming you and your family.`,
        `Date: ${date}\nTime: ${time}\nVisitors: ${visitors}\nLocation: ${booking.visitLocation}`,
        `Gaushala address: ${VISIT_ADDRESS}\nParking address: ${PARKING_ADDRESS}`,
        `Please plan for a 30–45 minute visit. Do not bring bags, human food, raw vegetables, or other food unless Gaushala staff specifically requests it. Children under age 12 must remain closely supervised, and visitors must not reach through or over a fence to feed or pet an animal.`,
        `Manage or cancel your booking: ${booking.manageLink}`,
        signoff,
      ];
      break;
    case 'rejected':
      subject = `Update on your Gaushala visit request for ${date}`;
      paragraphs = [
        greeting,
        `Unfortunately, we are unable to approve your Gaushala visit request for ${date} from ${time}.`,
        `You are welcome to return to the booking page and request another available visit time.`,
        `View your booking status: ${booking.manageLink}`,
        signoff,
      ];
      break;
    case 'cancelled':
      subject = `Cancelled: Your Gaushala visit on ${date}`;
      paragraphs = [
        greeting,
        `Your Gaushala visit scheduled for ${date} from ${time} has been cancelled.`,
        `If you would still like to visit, you may submit a new request for another available time.`,
        signoff,
      ];
      break;
    case 'no_show':
      subject = `Follow-up regarding your Gaushala visit on ${date}`;
      paragraphs = [
        greeting,
        `Our records show that your family did not attend the Gaushala visit scheduled for ${date} from ${time}.`,
        booking.noShowFeePledgedAt
          ? `As agreed during booking, the pledged $21 no-show fee may apply. Please contact the Gaushala team if this was marked in error.`
          : `Please contact the Gaushala team if this was marked in error.`,
        signoff,
      ];
      break;
    default:
      subject = `Gaushala visit request received for ${date}`;
      paragraphs = [
        greeting,
        `We received your request to visit the Gaushala. It is awaiting administrator approval and is not yet confirmed.`,
        `Date: ${date}\nTime: ${time}\nVisitors: ${visitors}\nLocation: ${booking.visitLocation}`,
        `The exact Gaushala address will be shared only after your request is approved.`,
        `View your booking status or cancel your request: ${booking.manageLink}`,
        signoff,
      ];
  }

  const body = paragraphs.join('\n\n');
  return {
    subject,
    body,
    copyText: `To: ${booking.email}\nSubject: ${subject}\n\n${body}`,
  };
}
