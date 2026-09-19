import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const address = process.env.LASTCOMMIT_CONTRACT_ADDRESS || "0x8F1DEEB53214F25341aB3C153d4164dF73DD392c";
const client = createClient({ chain: studionet });

async function read(functionName, args = []) {
  const value = await client.readContract({ address, functionName, args });
  console.log(functionName, JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item));
}

await read("get_project_count");
await read("get_review_count");
await read("get_project", [999999]);
await read("get_review", [999999]);
await read("get_latest_review", [999999]);
await read("get_project_status", [999999]);
await read("get_project_review_count", [999999]);
await read("get_project_reviews", [999999, 0, 20]);
await read("is_succession_eligible", [999999]);
