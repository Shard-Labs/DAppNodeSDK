const fs = require("fs");
const path = require("path");
const semver = require("semver");
const inquirer = require("inquirer");
const { writeManifest } = require("../utils/manifest");
const { generateAndWriteCompose } = require("../utils/compose");
const shell = require("../utils/shell");

async function initializeDnp({ dir = "./", useDefaults }) {
  // shell outputs tend to include trailing spaces and new lines
  const defaultName = await shell('echo "${PWD##*/}"', { silent: true });
  const defaultAuthor = await shell("whoami", { silent: true });

  const defaultAnswers = {
    name: defaultName,
    version: "0.0.1",
    description: `${defaultName} description`,
    avatar: "",
    type: "service",
    author: defaultAuthor,
    license: "GLP-3.0"
  };

  if (!useDefaults) {
    console.log(`This utility will walk you through creating a dappnode_package.json file.
It only covers the most common items, and tries to guess sensible defaults.
`);
  }

  if (fs.existsSync(path.join(dir, "dappnode_package.json"))) {
    const continueAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message:
          "This directory is already initialized. Are you sure you want to overwrite the existing manifest?"
      }
    ]);
    if (!continueAnswer.continue) {
      console.log("Stopping");
      process.exit(1);
    }
  }

  const answers = useDefaults
    ? defaultAnswers
    : await inquirer.prompt([
        {
          type: "input",
          name: "name",
          default: defaultAnswers.name,
          message: "DAppNodePackage name"
        },
        {
          type: "input",
          name: "version",
          default: defaultAnswers.version,
          message: "Version",
          validate: val =>
            !semver.valid(val) ||
            !(
              semver.eq(val, "1.0.0") ||
              semver.eq(val, "0.1.0") ||
              semver.eq(val, "0.0.1")
            )
              ? "the version needs to be valid semver. If this is the first release, the version must be 1.0.0, 0.1.0 or 0.0.1 "
              : true
        },
        {
          type: "input",
          name: "description",
          message: "Description",
          default: defaultAnswers.description
        },
        {
          type: "input",
          message: "Author",
          name: "author",
          default: defaultAnswers.author
        },
        {
          type: "input",
          message: "License",
          name: "license",
          default: defaultAnswers.license
        }
      ]);

  // Construct DNP
  const manifest = {
    name: (answers.name || "").toLowerCase() + ".public.dappnode.eth",
    version: answers.version,
    description: answers.description,
    avatar: "",
    type: "service",
    image: {
      path: "",
      hash: "",
      size: "",
      volumes: [],
      ports: [],
      environment: [],
      restart: "always"
    },
    dependencies: {},
    author: answers.author,
    categories: ["Developer tools"],
    links: {
      homepage: "https://your-project-homepage-or-docs.io"
    },
    license: answers.license
  };

  // Create folders
  await shell(`mkdir -p ${path.join(dir, "build")}`, { silent: true });

  // Write manifest and compose
  writeManifest({ manifest, dir });
  generateAndWriteCompose({ manifest, dir });

  // Initialize Dockerfile
  fs.writeFileSync(
    path.join(dir, "build", "Dockerfile"),
    `FROM alpine

WORKDIR /usr/src/app

CMD [ "echo", "happy buidl" ]
`
  );

  console.log(`Initialized DNP ${manifest.name}`);
}

module.exports = initializeDnp;
