// An explicit Vercel Function entry prevents the backend TypeScript build from
// being mistaken for a directory of static assets.
import app from '../src/index';
import jobsRoutes from '../src/routes/jobs';

app.use('/api/jobs', jobsRoutes);

export default app;
