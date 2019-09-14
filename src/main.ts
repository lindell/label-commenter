import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  const issueMessage: string = core.getInput("issue-message");
  const prMessage: string = core.getInput("pr-message");
  if (!issueMessage && !prMessage) {
    throw new Error(
      "Action must have at least one of issue-message or pr-message set"
    );
  }
  // Get client and context
  const client: github.GitHub = new github.GitHub(
    core.getInput("repo-token", { required: true })
  );
  const context = github.context;

  console.log(JSON.stringify(context.payload, null, 2));

  if (context.payload.action !== "opened") {
    console.log("No issue or PR was opened, skipping");
    return;
  }
}

run().catch(error => {
  core.setFailed(error.message);
});
