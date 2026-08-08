import axios from 'axios';

export async function verifyCaptcha(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('HCAPTCHA_SECRET_KEY is required in production');
      return false;
    }
    return token === 'development-bypass' || token.length > 0;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await axios.post<{ success: boolean }>(
      'https://api.hcaptcha.com/siteverify',
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 5000 }
    );
    return response.data.success === true;
  } catch (error) {
    console.error('hCaptcha verification failed:', error);
    return false;
  }
}
