#!/usr/bin/env python3
"""
Dev runner — starts Expo and FastAPI concurrently.
Run from the project root: python run_dev.py
"""
import signal
import socket
import subprocess
import sys
import os
from functools import reduce
import threading
from pathlib import Path

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"

_, _, _ips = socket.gethostbyname_ex(socket.gethostname())
LAN_IP = reduce(lambda default_ip, ip: ip if ip.startswith("192.") else default_ip, _ips)

# print(f"_ips={_ips}")
if not LAN_IP.startswith("192."):
    print(f"LAN IP not found. IPs: {_ips}")
    sys.exit(1)

COMMANDS = [
    {
        "label": "expo",
        "cmd": "npx expo start --lan",
        "cwd": FRONTEND,
        "shell": True,
        "interactive": True,  # run in interactive mode (give it direct control of CLI)
        "env": {
            "REACT_NATIVE_PACKAGER_HOSTNAME": LAN_IP
        }
    },
    {
        "label": "fastapi",
        "cmd": (
            "poetry run uvicorn sagahealth_custodian_api.app:app"
            f" --reload --port 8000 --host {LAN_IP}"
        ),
        "cwd": BACKEND,
        "shell": True,
        "restart": True,  # on process death, autorestart
    },
]

COLORS = {
    "expo": "\033[36m",     # cyan
    "fastapi": "\033[35m",  # magenta
}
RESET = "\033[0m"


def stream_output(proc: subprocess.Popen, label: str) -> None:
    color = COLORS.get(label, "")
    prefix = f"{color}[{label}]{RESET} "
    for line in proc.stdout:  # type: ignore[union-attr]
        sys.stdout.write(prefix + line)
        sys.stdout.flush()


def run_migrations() -> None:
    print("Running Alembic migrations…")
    result = subprocess.run(
        "poetry run alembic upgrade head",
        cwd=BACKEND,
        shell=True,
    )
    if result.returncode != 0:
        print("Alembic migrations failed — aborting.")
        sys.exit(result.returncode)
    print("Migrations complete.")


def main() -> None:
    run_migrations()

    procs: list[subprocess.Popen] = []
    threads: list[threading.Thread] = []

    for spec in COMMANDS:
        interactive = spec.get("interactive", False)
        # Isolate background processes from the console so that uvicorn's
        # GenerateConsoleCtrlEvent(CTRL_C_EVENT, 0) on --reload doesn't
        # propagate to run_dev.py or expo. CREATE_NO_WINDOW detaches from the
        # shared console; CREATE_NEW_PROCESS_GROUP puts it in its own group.
        flags = (subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW) if (
            sys.platform == "win32" and not interactive
        ) else 0
        env = os.environ.copy()
        _env = spec.get("env", {})
        env.update(_env)
        proc = subprocess.Popen(
            spec["cmd"],
            cwd=spec["cwd"],
            shell=spec["shell"],
            stdout=None if interactive else subprocess.PIPE,
            stderr=None if interactive else subprocess.STDOUT,
            stdin=None if interactive else subprocess.DEVNULL,
            env=env,
            text=True,
            bufsize=1,
            creationflags=flags,
        )
        procs.append(proc)
        if not interactive:
            t = threading.Thread(
                target=stream_output, args=(proc, spec["label"]), daemon=True
            )
            t.start()
            threads.append(t)
        print(f"Started {spec['label']} (pid {proc.pid}) w/ env: {spec.get("env", {})}")

    def shutdown(sig, frame):
        print("\nShutting down…")
        for p in procs:
            try:
                if sys.platform == "win32":
                    # Kill the entire process tree (cmd.exe + all children)
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(p.pid)],
                        capture_output=True,
                    )
                else:
                    p.terminate()
            except Exception:
                pass
        for p in procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    stop_hint = "Ctrl+C" if sys.platform == "win32" else "Ctrl+C (or Cmd+. in some terminals)"
    print(f"All services started. Press {stop_hint} to stop.")

    # Monitor processes; auto-restart those with restart=True, shut down otherwise
    while True:
        for i, (proc, spec) in enumerate(zip(procs, COMMANDS)):
            if proc.poll() is not None:
                label = spec["label"]
                color = COLORS.get(label, "")
                if spec.get("restart"):
                    print(
                        f"{color}[{label}]{RESET}"
                        f" exited (code {proc.returncode}), restarting…"
                    )
                    
                    env = os.environ.copy()
                    _env = spec.get("env", {})
                    env.update(_env)
                    new_proc = subprocess.Popen(
                        spec["cmd"],
                        cwd=spec["cwd"],
                        shell=spec["shell"],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        stdin=subprocess.DEVNULL,
                        env=env,
                        text=True,
                        bufsize=1,
                        creationflags=(subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW) if sys.platform == "win32" else 0,
                    )
                    procs[i] = new_proc
                    t = threading.Thread(
                        target=stream_output, args=(new_proc, label), daemon=True
                    )
                    t.start()
                else:
                    print(
                        f"{color}[{label}]{RESET}"
                        f" exited with code {proc.returncode}"
                    )
                    shutdown(None, None)
        threading.Event().wait(1)


if __name__ == "__main__":
    main()
