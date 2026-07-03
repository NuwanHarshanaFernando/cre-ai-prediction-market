// prediction-market/my-workflow/main.ts

import { cre, Runner, getNetwork, hexToBase64 } from "@chainlink/cre-sdk";
import { keccak256, toHex } from "viem";
import { onHttpTrigger } from "./httpCallback";
import { onLogTrigger } from "./logCallback";

// Config type (matches config.staging.json structure)
type Config = {
  geminiModel: string;
  evms: Array<{
    marketAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }>;
};

const SETTLEMENT_REQUESTED_SIGNATURE = "SettlementRequested(uint256,string)";

const initWorkflow = (config: Config) => {
  // Initialize HTTP capability
  const httpCapability = new cre.capabilities.HTTPCapability();
  const httpTrigger = httpCapability.trigger({});

  // Get network for Log Trigger
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.evms[0].chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network not found: ${config.evms[0].chainSelectorName}`);
  }

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);
  const eventHash = keccak256(toHex(SETTLEMENT_REQUESTED_SIGNATURE));

  return [
    // Day 1: HTTP Trigger - Market Creation
    cre.handler(httpTrigger, onHttpTrigger),

    // Day 2: Log Trigger - Event-Driven Settlement ← NEW!
    cre.handler(
      evmClient.logTrigger({
        addresses: [hexToBase64(config.evms[0].marketAddress as `0x${string}`)],
        topics: [{ values: [hexToBase64(eventHash)] }],
        confidence: "CONFIDENCE_LEVEL_FINALIZED",
      }),
      onLogTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();



// prediction-market/my-workflow/main.ts

// import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";
// import { onHttpTrigger } from "./httpCallback";

// type Config = {
//   geminiModel: string;
//   evms: Array<{
//     marketAddress: string;
//     chainSelectorName: string;
//     gasLimit: string;
//   }>;
// };

// const initWorkflow = (config: Config) => {
//   const httpCapability = new cre.capabilities.HTTPCapability();
//   const httpTrigger = httpCapability.trigger({});

//   return [
//     cre.handler(
//       httpTrigger,
//       onHttpTrigger
//     ),
//   ];
// };

// export async function main() {
//   const runner = await Runner.newRunner<Config>();
//   await runner.run(initWorkflow);
// }

// main();


// import { CronCapability, handler, Runner, type Runtime } from "@chainlink/cre-sdk";

// export type Config = {
//   schedule: string;
// };

// export const onCronTrigger = (runtime: Runtime<Config>): string => {
//   runtime.log("Hello world! Workflow triggered.");
//   return "Hello world!";
// };

// export const initWorkflow = (config: Config) => {
//   const cron = new CronCapability();

//   return [
//     handler(
//       cron.trigger(
//         { schedule: config.schedule }
//       ),
//       onCronTrigger
//     ),
//   ];
// };

// export async function main() {
//   const runner = await Runner.newRunner<Config>();
//   await runner.run(initWorkflow);
// }
