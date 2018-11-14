import subprocess
import psutil
import sys

# Runner script that limtis execution time of the user created program

def kill(proc_pid):
    process = psutil.Process(proc_pid)
    for proc in process.children(recursive=True):
        proc.kill()
    process.kill()

proc = subprocess.Popen(["python", "exe\\main.py"], shell=True)
try:
    proc.wait(timeout=1)
except subprocess.TimeoutExpired:
    kill(proc.pid)
    sys.stderr.write("ERROR: Execution time limit exceeded")