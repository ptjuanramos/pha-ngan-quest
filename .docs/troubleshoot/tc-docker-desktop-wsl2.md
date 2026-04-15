# Testcontainers + Docker Desktop on Windows/WSL2

## Problem

Running `./gradlew test` (or `build`) from WSL2 fails because the Micronaut Test Resources
service (which uses Testcontainers 2.x) cannot connect to Docker Desktop.

### Symptoms

```
Could not find a valid Docker environment.
  EnvironmentAndSystemPropertyClientProviderStrategy: BadRequestException (Status 400: {"ID":"","ServerVersion":"", ...})
  UnixSocketClientProviderStrategy: BadRequestException (Status 400: ...)
  DockerDesktopClientProviderStrategy: BadRequestException (Status 400: ...)
```

Or, after partial fixes:

```
Status 400: {"message":"client version 1.32 is too old. Minimum supported API version is 1.40"}
```

### Root Causes

1. **Wrong `Host` header** — docker-java (used by Testcontainers) sends `Host: localhost:2375`
   over Unix socket connections. Docker Desktop's proxy at `/run/docker.sock` rejects requests
   with a port in the `Host` header, returning a 400 with empty data.

2. **Deprecated API version** — docker-java starts version negotiation with `GET /v1.32/info`.
   Docker Desktop requires a minimum API version of 1.40 and returns 400 for older versions.

3. **Test resources service is a separate JVM** — `internalStartTestResourcesService` is a
   `StartTestResourcesService` task (not `JavaExec`), so environment variables set via
   `tasks.withType(JavaExec)` or `systemProp.*` in `gradle.properties` do not reach it.
   `DOCKER_HOST` must be present in the Gradle daemon's environment at startup time.

---

## Solution

Run Gradle from WSL2 (not Windows PowerShell) and use a lightweight Python proxy that:
- Rewrites `Host: localhost:2375` → `Host: localhost`
- Rewrites `/v1.32/` (and any old API version) → `/` (unversioned)

### Step 1 — Create the proxy script

Save to `~/.docker-proxy.py` in your WSL home:

```python
import socket, threading, os, signal, sys, re

PROXY = '/tmp/docker-tc-proxy.sock'
DOCKER = '/run/docker.sock'

if os.path.exists(PROXY):
    os.remove(PROXY)

server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
server.bind(PROXY)
os.chmod(PROXY, 0o777)
server.listen(20)

def rewrite(data):
    data = data.replace(b'Host: localhost:2375\r\n', b'Host: localhost\r\n')
    data = re.sub(rb'(GET|POST|DELETE|PUT|HEAD|PATCH) /v1\.\d+/', rb'\1 /', data)
    return data

def relay(src, dst, transform=False):
    try:
        while True:
            d = src.recv(32768)
            if not d: break
            dst.sendall(rewrite(d) if transform else d)
    except: pass

def handle(client):
    try:
        docker = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        docker.connect(DOCKER)
        t1 = threading.Thread(target=relay, args=(client, docker, True), daemon=True)
        t2 = threading.Thread(target=relay, args=(docker, client, False), daemon=True)
        t1.start(); t2.start()
        t1.join(); t2.join()
    finally:
        try: client.close()
        except: pass

signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
while True:
    try:
        conn, _ = server.accept()
        threading.Thread(target=handle, args=(conn,), daemon=True).start()
    except: break
```

### Step 2 — Auto-start via `.bashrc`

Add to `~/.bashrc` so the proxy starts automatically and `DOCKER_HOST` is always set:

```bash
# Docker Testcontainers proxy
if [ ! -S /tmp/docker-tc-proxy.sock ]; then
    rm -f /tmp/docker-tc-proxy.sock
    setsid python3 ~/.docker-proxy.py > /tmp/docker-proxy.log 2>&1 < /dev/null &
    sleep 0.5
fi
export DOCKER_HOST=unix:///tmp/docker-tc-proxy.sock
```

### Step 3 — Configure Testcontainers

In `~/.testcontainers.properties` (WSL home directory):

```properties
docker.host=unix:///tmp/docker-tc-proxy.sock
checks.disable=true
```

### Step 4 — Run tests from WSL

```bash
source ~/.bashrc

# Verify proxy is up
curl --unix-socket /tmp/docker-tc-proxy.sock http://localhost/_ping   # should print: OK

cd /mnt/c/Users/Juan/source/pha-ngan-quest/backend
./gradlew --stop   # ensure daemon picks up DOCKER_HOST from current shell
./gradlew test
```

> **Important:** Always run `./gradlew --stop` before `./gradlew test` after opening a fresh
> terminal, so the new Gradle daemon inherits the `DOCKER_HOST` environment variable.

---

## Notes

- The proxy must be running before Gradle starts the test resources service daemon.
- If the proxy dies (e.g. after a WSL restart), re-run `source ~/.bashrc` to restart it.
- This is only needed when running integration tests locally on Windows. CI environments
  running natively on Linux do not require the proxy.