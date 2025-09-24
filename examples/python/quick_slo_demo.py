from corridoros import corridor, ffm

# Demo that uses local mocks (mock_corrd.py on 7080 and memqosd_cors_proxy.py on 7070)

def run_inference():
    print("Running workload… (simulated)")

def main():
    with corridor(min_gbps=400, latency_budget_ns=250) as cor, ffm(bytes=256<<30, bandwidth_floor_GBs=150, latency_class='T2') as mem:
        print("Corridor:", cor)
        print("Memory:", mem)
        run_inference()

if __name__ == "__main__":
    main()

