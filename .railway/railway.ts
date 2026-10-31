import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "ispeakpidgin";
export default defineRailway(() => {
  const ispeakpidgin = service("ispeakpidgin", {
    source: github("SnickerSec/ispeakpidgin", { branch: "main", checkSuites: false }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    start: "node server.js",
    healthcheck: "/health",
    healthcheckTimeout: 100,
    replicas: { "us-west2": 1 },
    domains: ["chokepidgin.com", "www.chokepidgin.com"],
  });

  return project("Choke Pidgin", {
    variables: { managed: false },
    resources: [ispeakpidgin],
  });
});
