export async function fetchCallTranscript(callId: string) {
    const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PRIVATE_VAPI_API_KEY}`,
      },
      cache: "no-store",
    });
  
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch call data: ${res.status} - ${error}`);
    }
  
    return res.json();
  }
  