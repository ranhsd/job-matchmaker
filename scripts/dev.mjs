import { spawn } from "node:child_process";
import { createServer } from "node:net";

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
        return;
      }

      reject(error);
    });

    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const preferredPort = Number(process.env.PORT) || 8788;
const port = await findAvailablePort(preferredPort);
const apiUrl = `http://localhost:${port}`;

console.log(`Starting dev servers (API on ${apiUrl})`);

const child = spawn("turbo", ["run", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(port),
    API_URL: apiUrl,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
