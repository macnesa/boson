import axios from "axios";
import qs from "qs";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function fetchStrapi(path, params = {}) {
  const query = qs.stringify(params, { encodeValuesOnly: true });
  const url = `${STRAPI_URL}/api/${path}?${query}`;
  const { data } = await axios.get(url);
  return data;
}



