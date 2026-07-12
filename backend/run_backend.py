import subprocess
import sys
import time
import signal

def main():
    print("Starting all backend services concurrently...")
    
    processes = []
    try:
        # 1. Start API (FastAPI via uvicorn)
        api_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            stdout=None, stderr=None
        )
        processes.append(("API", api_proc))
        
        # 2. Start Scheduler
        sched_proc = subprocess.Popen(
            [sys.executable, "-m", "app.scheduler.entrypoint"],
            stdout=None, stderr=None
        )
        processes.append(("Scheduler", sched_proc))

        # 3. Start Worker
        worker_proc = subprocess.Popen(
            [sys.executable, "-m", "app.workers.entrypoint"],
            stdout=None, stderr=None
        )
        processes.append(("Worker", worker_proc))

        print("API, Scheduler, and Worker running. Press Ctrl+C to stop all services.")
        
        # Monitor processes
        while True:
            for name, proc in processes:
                if proc.poll() is not None:
                    print(f"Service {name} stopped unexpectedly with exit code {proc.returncode}")
                    raise KeyboardInterrupt
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopping all backend services gracefully...")
        for name, proc in processes:
            if proc.poll() is None:
                print(f"Sending SIGTERM to {name}...")
                proc.terminate()
        
        # Wait for shutdown
        for name, proc in processes:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"Force-killing {name}...")
                proc.kill()
        print("All backend services stopped.")

if __name__ == "__main__":
    main()
