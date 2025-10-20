import axios from "axios";

export async function POST(req) {
  try {
    const body = await req.json();

    await axios.post(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/contacts`,
      { data: body }
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}



