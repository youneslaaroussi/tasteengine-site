import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  let ip =
    request.headers.get('x-forwarded-for')?.split(',').at(0)?.trim() ||
    request.headers.get('x-real-ip') ||
    '8.8.8.8';

  if (ip === '::1') {
    ip = '8.8.8.8';
  }

  try {
    const response = await fetch(`https://ipwho.is/${ip}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.calling_code) {
        return NextResponse.json({
          callingCode: `+${data.calling_code}`,
          countryCode: data.country_code,
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch geoip data from ipwho.is', error);
  }

  return NextResponse.json({
    callingCode: '+1',
    countryCode: 'US',
  }); // Default fallback
}
