// An explicit Vercel Function entry prevents the backend TypeScript build from
// being mistaken for a directory of static assets.
import app from '../src/index';

export default app;
