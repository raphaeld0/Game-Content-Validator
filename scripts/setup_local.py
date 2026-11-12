#!/usr/bin/env python3
"""Compile the C++20 engine with an installed compiler or a portable Zig toolchain."""

from __future__ import annotations

import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "validator-engine"
BIN = ENGINE / "bin"
EXE = BIN / ("game-content-validator.exe" if os.name == "nt" else "game-content-validator")
TEST_EXE = BIN / ("validator-tests.exe" if os.name == "nt" else "validator-tests")
ZIG_VERSION = "0.15.2"


def compiler_command() -> list[str]:
    for name in ("clang++", "g++"):
        found = shutil.which(name)
        if found:
            return [found]
    if os.name != "nt":
        raise RuntimeError("No C++ compiler found. Install clang++ or g++.")

    cache = Path(tempfile.gettempdir()) / "game-content-pipeline-toolchain" / f"zig-{ZIG_VERSION}"
    zig = cache / "zig.exe"
    if not zig.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        architecture = "x86_64" if platform.machine().lower() in ("amd64", "x86_64") else "aarch64"
        index_url = "https://ziglang.org/download/index.json"
        print(f"Downloading portable Zig {ZIG_VERSION} to the system temporary directory...")
        with urllib.request.urlopen(index_url, timeout=30) as response:
            index = json.load(response)
        package = index[ZIG_VERSION][f"{architecture}-windows"]
        archive = cache.parent / "zig.zip"
        urllib.request.urlretrieve(package["tarball"], archive)
        with zipfile.ZipFile(archive) as source:
            members = source.namelist()
            root_folder = members[0].split("/")[0]
            source.extractall(cache.parent)
        extracted = cache.parent / root_folder
        if cache.exists():
            shutil.rmtree(cache)
        extracted.rename(cache)
        archive.unlink(missing_ok=True)
    return [str(zig), "c++"]


def compile_target(compiler: list[str], output: Path, sources: list[Path]) -> None:
    command = compiler + [
        "-std=c++20", "-O2", "-I", str(ENGINE / "include"),
        *[str(source) for source in sources], "-o", str(output),
    ]
    subprocess.run(command, check=True)


def main() -> None:
    BIN.mkdir(parents=True, exist_ok=True)
    compiler = compiler_command()
    print(f"Compiling C++20 validator with: {' '.join(compiler)}")
    compile_target(compiler, EXE, [ENGINE / "src" / "main.cpp", ENGINE / "src" / "validator.cpp"])
    compile_target(compiler, TEST_EXE, [ENGINE / "tests" / "test_validator.cpp", ENGINE / "src" / "validator.cpp"])
    subprocess.run([str(TEST_EXE)], check=True)
    print(f"C++ validator ready: {EXE}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Local setup failed: {error}", file=sys.stderr)
        raise SystemExit(1)
