import subprocess
import psutil
import sys

# Runner script that limtis execution time of the user created program

def kill(proc_pid):
    process = psutil.Process(proc_pid)
    for proc in process.children(recursive=True):
        proc.kill()
    process.kill()

subprocessCommand = ["python", "exe\\main.py"] + sys.argv[1:]
proc = subprocess.Popen(subprocessCommand, shell=True)
try:
    proc.wait(timeout=5)
except subprocess.TimeoutExpired:
    kill(proc.pid)
    sys.stderr.write("ERROR: Execution time limit exceeded")