set -euo pipefail

append_once() {
  local file="$1"
  local marker="$2"
  local block="$3"
  [ -f "$file" ] || { echo "SKIP missing: $file"; return; }
  if grep -qF "$marker" "$file"; then
    echo "ALREADY LINKED: $file"
  else
    printf "\n%s\n" "$block" >> "$file"
    echo "UPDATED: $file"
  fi
}

append_once "README.md" "## Interactive Standalone Prototypes" '## Interactive Standalone Prototypes
* [Open Interactive SSoT Demo](DEMO/index.html)
* [Open Interactive Balaerion Prototype](balaerion/demo/index.html)
* [Open Interactive Syndicate Prototype](syndicate/demo/index.html)'

append_once "10-Prototype-Manual.md" "## Interactive SSoT Demo" '## Interactive SSoT Demo
* [Open Interactive SSoT Demo](DEMO/index.html)'

append_once "balaerion/04-MCP-Agents-and-Product-Layer.md" "## Interactive Balaerion Prototype" '## Interactive Balaerion Prototype
* [Open Interactive Balaerion Prototype](demo/index.html)'

append_once "syndicate/04-Unit-Share-NAV-Ledger-and-Operations.md" "## Interactive Syndicate Prototype" '## Interactive Syndicate Prototype
* [Open Interactive Syndicate Prototype](demo/index.html)'

npx honkit build
ls -la _book/DEMO/index.html _book/balaerion/demo/index.html _book/syndicate/demo/index.html
