#!/usr/bin/env python3
"""
Open File List Demo (Parametrized, with APPEND and custom writes)
- Choose target file path and initial content from CLI
- Per-process append mode to start at EOF
- Custom write payloads
- Displays path in the Open File Table so runs look distinct

Examples:
  python ofs_demo.py --file /journal.log --init "SEED:" --append1 --w1 "AAA" --w2 "bbb"
  python ofs_demo.py --file /lab.txt --append2 --w1 "X" --w2 "YYYYY"
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import itertools
import argparse

# ----------------------- Core Data Structures -----------------------

@dataclass
class OpenFile:
    inode: int
    path: str
    mode: str
    offset: int = 0
    refcount: int = 1
    locked_by: Optional[int] = None

@dataclass
class FileSystem:
    path_to_inode: Dict[str, int] = field(default_factory=dict)
    inode_to_content: Dict[int, bytearray] = field(default_factory=dict)
    next_inode: int = 1

    def create_if_missing(self, path: str) -> int:
        if path not in self.path_to_inode:
            ino = self.next_inode
            self.next_inode += 1
            self.path_to_inode[path] = ino
            self.inode_to_content[ino] = bytearray()
        return self.path_to_inode[path]

    def seed(self, inode: int, text: str) -> None:
        if text is not None:
            self.inode_to_content[inode][:] = bytearray(text.encode("utf-8"))

    def size(self, inode: int) -> int:
        return len(self.inode_to_content[inode])

    def read(self, inode: int, start: int, n: int) -> bytes:
        data = self.inode_to_content[inode]
        end = min(len(data), start + n)
        return bytes(data[start:end])

    def write(self, inode: int, start: int, b: bytes) -> int:
        data = self.inode_to_content[inode]
        end = start + len(b)
        if end > len(data):
            data.extend(b'\x00' * (end - len(data)))
        data[start:end] = b
        return len(b)

class OpenFileTable:
    _id_counter = itertools.count(100)

    def __init__(self) -> None:
        self._table: Dict[int, OpenFile] = {}

    def new(self, of: OpenFile) -> int:
        ofid = next(self._id_counter)
        self._table[ofid] = of
        return ofid

    def get(self, ofid: int) -> OpenFile:
        return self._table[ofid]

    def dec_ref(self, ofid: int) -> None:
        of = self._table[ofid]
        of.refcount -= 1
        if of.refcount <= 0:
            del self._table[ofid]

    def snapshot(self) -> List[Tuple[int, OpenFile]]:
        return sorted(self._table.items())

@dataclass
class Process:
    pid: int
    fd_table: Dict[int, int] = field(default_factory=dict)
    _fd_counter: itertools.count = field(default_factory=lambda: itertools.count(3), repr=False)

    def install_ofid(self, ofid: int) -> int:
        fd = next(self._fd_counter)
        self.fd_table[fd] = ofid
        return fd

    def dup(self, oldfd: int) -> int:
        if oldfd not in self.fd_table:
            raise ValueError("Bad FD")
        ofid = self.fd_table[oldfd]
        newfd = next(self._fd_counter)
        self.fd_table[newfd] = ofid
        return newfd

    def fork_like(self, child_pid: int) -> "Process":
        return Process(pid=child_pid, fd_table=self.fd_table.copy())

class System:
    def __init__(self) -> None:
        self.fs = FileSystem()
        self.oft = OpenFileTable()
        self._pids = itertools.count(1000)
        self.procs: Dict[int, Process] = {}

    def new_process(self) -> Process:
        p = Process(pid=next(self._pids))
        self.procs[p.pid] = p
        return p

    def open(self, proc: Process, path: str, mode: str = "rw", exclusive_lock: bool = False, append: bool = False) -> int:
        inode = self.fs.create_if_missing(path)
        of = OpenFile(inode=inode, path=path, mode=("a" if append else mode), offset=0, refcount=1, locked_by=None)
        if append:
            of.offset = self.fs.size(inode)
        ofid = self.oft.new(of)

        if exclusive_lock:
            for oid, entry in self.oft.snapshot():
                if oid != ofid and entry.inode == inode and entry.locked_by is not None:
                    raise RuntimeError("Lock already held")
            of.locked_by = proc.pid

        fd = proc.install_ofid(ofid)
        return fd

    def close(self, proc: Process, fd: int) -> None:
        if fd not in proc.fd_table:
            raise ValueError("Bad FD")
        ofid = proc.fd_table.pop(fd)
        self.oft.dec_ref(ofid)

    def read(self, proc: Process, fd: int, n: int) -> bytes:
        ofid = proc.fd_table[fd]; of = self.oft.get(ofid)
        data = self.fs.read(of.inode, of.offset, n)
        of.offset += len(data)
        return data

    def write(self, proc: Process, fd: int, b: bytes) -> int:
        ofid = proc.fd_table[fd]; of = self.oft.get(ofid)
        if of.locked_by not in (None, proc.pid):
            raise RuntimeError("Write denied: file locked by other process")
        nw = self.fs.write(of.inode, of.offset, b)
        of.offset += nw
        return nw

    def lseek(self, proc: Process, fd: int, pos: int) -> None:
        if pos < 0: raise ValueError("Negative seek")
        ofid = proc.fd_table[fd]; of = self.oft.get(ofid)
        of.offset = pos

    def dup(self, proc: Process, oldfd: int) -> int:
        ofid = proc.fd_table[oldfd]; of = self.oft.get(ofid)
        of.refcount += 1
        return proc.dup(oldfd)

    def fork(self, parent: Process) -> Process:
        child = parent.fork_like(child_pid=next(self._pids))
        for _, ofid in child.fd_table.items():
            self.oft.get(ofid).refcount += 1
        self.procs[child.pid] = child
        return child

    def dump_open_file_list(self, header: str = "") -> None:
        if header:
            print(header)
        print("\n=== SYSTEM OPEN FILE TABLE ===")
        for ofid, of in self.oft.snapshot():
            lock = f" lock:{of.locked_by}" if of.locked_by is not None else ""
            print(f" ofid={ofid} path={of.path} inode={of.inode} mode={of.mode} off={of.offset} ref={of.refcount}{lock}")

    def dump_proc_fds(self) -> None:
        print("\n=== PER-PROCESS FD TABLES ===")
        for pid in sorted(self.procs):
            p = self.procs[pid]
            fd_map = ", ".join(f"{fd}->ofid{ofid}" for fd, ofid in sorted(p.fd_table.items()))
            print(f" pid={pid}  FDs: {{ {fd_map} }}")

def run_demo(target_path: str, initial_text: str, append1: bool, append2: bool, w1: str, w2: str) -> None:
    sysm = System()
    p1 = sysm.new_process()
    p2 = sysm.new_process()

    inode = sysm.fs.create_if_missing(target_path)
    sysm.fs.seed(inode, initial_text)

    fd1 = sysm.open(p1, target_path, "rw", append=append1)
    fd2 = sysm.open(p2, target_path, "rw", append=append2)

    sysm.write(p1, fd1, w1.encode())
    sysm.write(p2, fd2, w2.encode())

    sysm.dump_open_file_list("\n[After opens + writes]")
    sysm.dump_proc_fds()

    fd1_dup = sysm.dup(p1, fd1)
    sysm.write(p1, fd1_dup, b"++")

    sysm.dump_open_file_list("\n[After dup() + write]")
    sysm.dump_proc_fds()

    sysm.lseek(p1, fd1, 0)
    preview = sysm.read(p1, fd1_dup, 80)
    print("\nP1 read via dup-shared offset:", preview.decode(errors="ignore"))

    fd2_lock = sysm.open(p2, target_path, "rw", exclusive_lock=True)
    try:
        sysm.write(p1, fd1, b"blocked?")
    except Exception as e:
        print("\nExpected write denial (lock held by p2):", e)

    child = sysm.fork(p1)
    sysm.write(child, fd1, b"CHILD")
    sysm.dump_open_file_list("\n[After fork() + child write]")
    sysm.dump_proc_fds()

    sysm.lseek(p1, fd1, 0)
    parent_view = sysm.read(p1, fd1, 120)
    print("\nParent sees after child write:", parent_view.decode(errors="ignore"))

    sysm.close(p2, fd2_lock)
    sysm.close(p1, fd1_dup)
    sysm.close(p1, fd1)
    sysm.close(p2, fd2)
    sysm.dump_open_file_list("\n[Final OFT]")

def main():
    ap = argparse.ArgumentParser(description="Open File Table demo with append + custom writes")
    ap.add_argument("--file", default="/notes.txt", help="Path to the demo file")
    ap.add_argument("--init", default="", help="Initial content for the file")
    ap.add_argument("--append1", action="store_true", help="Open by P1 starts at EOF")
    ap.add_argument("--append2", action="store_true", help="Open by P2 starts at EOF")
    ap.add_argument("--w1", default="HELLO", help="Data P1 writes")
    ap.add_argument("--w2", default="WORLD", help="Data P2 writes")
    args = ap.parse_args()
    run_demo(args.file, args.init, args.append1, args.append2, args.w1, args.w2)

if __name__ == "__main__":
    main()
