# Balaerion II. Hosting, Failover & ARM64 Sandboxing

**Focus:** Hetzner AX41 Primary, Oracle ARM Standby, Cloudflare Tunnel & NsJail Code Execution

---

## 1. Dual-Node Infrastructure Topology
Balaerion pairs a dedicated x86_64 primary server with an Always Free ARM64 standby node behind Cloudflare Tunnel, eliminating public SSH/port exposure while preserving browser-based engineering access.

| Role | Provider & Spec | Operating System | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Primary Node** | **Hetzner AX41** (Ryzen 5 3600, 64GB RAM, 2x512GB NVMe) | Ubuntu LTS | Runs OmniRoute, LibreChat, MCP orchestrator, browser-accessible terminal/IDE, and coding agent sessions. |
| **Standby Node** | **Oracle Always Free ARM VM** (2 OCPU, 12GB RAM) | Ubuntu ARM64 | Warm standby behind Cloudflare Tunnel; hosts lightweight failover gateway and ARM64 code sandbox. |

---

## 2. The ARM64 Code Execution Constraint
Standard container-based code interpreters rely on hardware virtualization (**KVM**) for VM-level isolation. Oracle Always Free ARM instances do not expose nested KVM.

* **Rejected Approach:** Running unsandboxed Python/Node subprocesses directly inside the LibreChat container (unacceptable blast radius).
* **Selected Architecture:** Deploy **`LibreCodeInterpreter` (ARM64 + NsJail)** on the Oracle ARM node. NsJail provides Linux namespace, cgroup, and seccomp-bpf syscall isolation without requiring KVM hardware extensions.

---

## 3. Zero-Port-Exposure Ingress
Neither node exposes public inbound ports (`80`, `443`, or `22`) on its raw IP address:
1. All web UI, terminal, IDE, and API traffic terminates at **Cloudflare Edge**.
2. Outbound **`cloudflared`** daemons on Hetzner and Oracle maintain encrypted tunnels to Cloudflare.
3. Failover between Hetzner AX41 and Oracle ARM is controlled at the Cloudflare Tunnel routing layer without reconfiguring client bookmarks or PWA manifests.
