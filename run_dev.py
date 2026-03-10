#!/usr/bin/env python3
"""
Dev runner — starts Expo and FastAPI concurrently.
Run from the project root: python run_dev.py
"""
import signal
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"

COMMANDS = [
    {
        "label": "expo",
        "cmd": "npx expo start --lan",
        "cwd": FRONTEND,
        "shell": True,
        "interactive": True,
    },
    {
        "label": "fastapi",
        "cmd": (
            "poetry run uvicorn sagahealth_custodian_api.app:app"
            " --reload --port 8000 --host 0.0.0.0"
        ),
        "cwd": BACKEND,
        "shell": True,
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


def main() -> None:
    procs: list[subprocess.Popen] = []
    threads: list[threading.Thread] = []

    for spec in COMMANDS:
        interactive = spec.get("interactive", False)
        proc = subprocess.Popen(
            spec["cmd"],
            cwd=spec["cwd"],
            shell=spec["shell"],
            stdout=None if interactive else subprocess.PIPE,
            stderr=None if interactive else subprocess.STDOUT,
            stdin=None if interactive else subprocess.DEVNULL,
            text=True,
            bufsize=1,
        )
        procs.append(proc)
        if not interactive:
            t = threading.Thread(
                target=stream_output, args=(proc, spec["label"]), daemon=True
            )
            t.start()
            threads.append(t)
        print(f"Started {spec['label']} (pid {proc.pid})")

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

    # Exit if any process dies unexpectedly
    while True:
        for proc, spec in zip(procs, COMMANDS):
            if proc.poll() is not None:
                print(
                    f"{COLORS.get(spec['label'], '')}[{spec['label']}]{RESET}"
                    f" exited with code {proc.returncode}"
                )
                shutdown(None, None)
        threading.Event().wait(1)


if __name__ == "__main__":
    main()
