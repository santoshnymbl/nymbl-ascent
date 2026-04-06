import "dotenv/config";
import { runScoring } from "../src/lib/run-scoring";

(async () => {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: npx tsx scripts/rescore-local.ts <candidateId>");
    process.exit(1);
  }
  console.log(`Running scoring locally for ${id}...`);
  const result = await runScoring(id);
  console.log(JSON.stringify(result, null, 2));
})();
