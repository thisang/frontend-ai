import assert from "node:assert/strict";
import test from "node:test";

import { handleChatRequest } from "../controllers/chat.controller.js";

test("chat request returns a concrete suggestion code for code optimization requests", async () => {
  const reply = {
    code: () => ({ code: () => undefined }),
  };

  const result = await handleChatRequest(
    {
      message: "帮我优化代码",
      context: {
        currentFileContent: "const count = 1;\nconsole.log(count);",
        selectedText: "const count = 1;",
      },
    },
    reply as any,
  );

  assert.equal(result.status, "success");
  assert.ok(result.data?.suggestedCode && result.data.suggestedCode.length > 0);
  assert.match(result.data!.suggestedCode!, /const|function|ref|computed/i);
});
