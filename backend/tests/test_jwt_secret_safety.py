import hashlib
import os
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[2]


def _local_jwt_secret_digest():
    env = os.environ.copy()
    env.pop("JWT_SECRET", None)
    env.pop("VERCEL_ENV", None)
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import hashlib; from backend import server; "
            "print(hashlib.sha256(server.JWT_SECRET.encode()).hexdigest())",
        ],
        cwd=ROOT,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def test_missing_local_jwt_secret_generates_a_per_process_value():
    first = _local_jwt_secret_digest()
    second = _local_jwt_secret_digest()

    assert first != second
