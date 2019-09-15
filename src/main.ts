import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';

interface LabelConfig {
  text: string;
  'ignore-previous': boolean;
}

async function run() {
  // Get all needed inputs
  const rawLabels: string = core.getInput('labels', {required: true});

  // Get client and context
  const client: github.GitHub = new github.GitHub(core.getInput('repo-token', {required: true}));
  const context = github.context;

  if (context.payload.action !== 'labeled') {
    console.log('No issue was labeled');
    return;
  }

  const issue: {owner: string; repo: string; number: number} = context.issue;
  const labelName = context.payload.label.name;

  // Since "with" in the workflow specification only supports strings, the labels data needs to be parsed
  const labels = yaml.load(rawLabels);

  const label: LabelConfig = labels[labelName];
  if (!label) {
    console.log(`The tag "${labelName}" had no configured comment`);
    return;
  }

  if (
    !label['ignore-previous'] &&
    (await issueHasLabelComment(client, issue.owner, issue.repo, issue.number, labelName))
  ) {
    console.log(`The tag "${labelName}" already has a comment`);
    return;
  }

  await client.issues.createComment({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body: `${label.text}\n<label-name value="${labelName}" />`,
  });
}

const issueNameRegex = /<label-name value="((\\"|[^"])*)" \/>/;

async function issueHasLabelComment(
  client: github.GitHub,
  owner: string,
  repo: string,
  issueNumber: number,
  labelName: string,
  currentPage: number = 1,
): Promise<boolean> {
  console.log(`Checking page ${currentPage} of the issues`);

  const {status, data: comments} = await client.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
    page: currentPage,
  });

  if (status !== 200) {
    throw new Error(`Received unexpected API status code ${status}`);
  }

  if (comments.length === 0) {
    return false;
  }

  for (const comment of comments) {
    let match = comment.body.match(issueNameRegex);
    if (match && match[1] === labelName) {
      return true;
    }
  }

  return await issueHasLabelComment(client, owner, repo, issueNumber, labelName, currentPage + 1);
}

run().catch(error => {
  core.setFailed(error.message);
});
