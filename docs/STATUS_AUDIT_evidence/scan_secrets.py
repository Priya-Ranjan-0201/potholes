import os
import re

secret_patterns = [
    (r'(?i)(api[_-]?key|secret[_-]?key|auth[_-]?token|private[_-]?key|password)\s*[:=]\s*[\'"][^\'"]{8,}[\'"]', 'Secret Assignment'),
    (r'ghp_[A-Za-z0-9]{36}', 'GitHub Token'),
    (r'AIza[0-9A-Za-z\-_]{35}', 'Google API Key'),
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key'),
    (r'-----BEGIN\s+(RSA|OPENSSH|EC|DSA)?\s*PRIVATE KEY-----', 'Private Key Block')
]

findings = []
ignore_dirs = {'.git', 'node_modules', 'dist', '__pycache__', '.pytest_cache', '.venv', 'venv'}

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    for f in files:
        if f.endswith(('.py', '.ts', '.tsx', '.json', '.yaml', '.yml', '.env', '.sh', '.md')):
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                    for lno, line in enumerate(fp, 1):
                        for pat, label in secret_patterns:
                            if re.search(pat, line):
                                findings.append(f"{fpath}:{lno} [{label}] (value hidden)")
            except Exception:
                pass

with open('docs/STATUS_AUDIT_evidence/secrets_scan.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total potential secret references: {len(findings)}\n")
    for item in findings:
        out.write(f"  {item}\n")

print(f"Total potential secret references: {len(findings)}")
for item in findings[:15]:
    print(" ", item)

