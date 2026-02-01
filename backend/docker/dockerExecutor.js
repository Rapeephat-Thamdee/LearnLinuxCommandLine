const { exec } = require("child_process");
const { isCommandAllowed } = require("./sandbox");

module.exports = function executeDockerCommand(command, containerName) {
  return new Promise((resolve) => {
    const check = isCommandAllowed(command);
    if (!check.ok) return resolve(check.reason);

    const cmd = `docker exec ${containerName} bash -lc "${command}"`;

    exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
      if (err) return resolve(stderr || err.message);
      resolve(stdout || stderr);
    });
  });
};
