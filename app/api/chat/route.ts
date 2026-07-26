import { NextResponse } from 'next/server';

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, '');

export async function POST(req: Request) {
  const body = await req.json();

  const response = await fetch(
    `${backendUrl}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}
