import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import "@/jobs/index";
import { getEnhancedEventsFromTx } from "../utils/events";
//import { getEventData } from "../../sync/events/data";
//import { OnChainData } from "@/events-sync/handlers/utils";
//import { handleEvents } from "../../sync/events/handlers/foundation";
//import { initOnChainData } from "../../sync/events/handlers/utils";

describe("Treasure Sales", () => {
  test("event-parsing", async () => {
    const testCases = [
      {
        name: "bid",
        tx: "0x347c273eca58fc20e246485eff59ea2003f3c1e33112b808e20733714ea7887c",
      },
    ];

    for (let index = 0; index < testCases.length; index++) {
      //const testCase = testCases[index];
      //const events = await getEnhancedEventsFromTx(testCase.tx);
      // const eventData = getEventData(["foundation-offer-made"])[0];
      //console.log(events);
      // const { args } = eventData.abi.parseLog(events[0].log);
      // const contract = args["nftContract"].toLowerCase();
      // const tokenId = args["tokenId"].toString();
      // const maker = args["buyer"].toLowerCase();
      // const price = args["price"].toString();
      //let onChainData = initOnChainData();
      //handleEvents(events, onChainData);
    }
  });
});
