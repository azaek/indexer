import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import "@/jobs/index";
import { getEnhancedEventsFromTx } from "../utils/events";
import { getEventData } from "../../sync/events/data";

describe("Treasure Sales", () => {
  test("event-parsing", async () => {
    const testCases = [
      {
        name: "sale",
        tx: "0x6c699cba57450a6b02762689b5f14e2cf3de9795054e06d72aaaeb232b4c6d8b",
      },
    ];

    for (let index = 0; index < testCases.length; index++) {
      const testCase = testCases[index];
      const events = await getEnhancedEventsFromTx(testCase.tx);
      //console.log(events);
      const eventData = getEventData(["treasure-item-sold"])[0];
      const { args } = eventData.abi.parseLog(events[1].log);
      // console.log(
      //   args["feeAmounts"].reduce((sum: string, current: string) => sum + parseInt(current), 0)
      // );
      const tokenId = args["tokenId"];
      expect(tokenId).not.toBe(null);
    }
  });
});
