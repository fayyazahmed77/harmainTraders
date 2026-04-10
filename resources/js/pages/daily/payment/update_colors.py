import os
import re

file_path = r"c:\xampp\htdocs\Harnain\resources\js\pages\daily\payment\create.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove ACCENT_GRADIENT constant and definitions
content = re.sub(r'const ACCENT_GRADIENT = ".*?";\n', '', content)

# 2. Add the dynamic `t` object right where `paymentType` is initialized or under `// State`
state_anchor = "const [paymentAccountId, setPaymentAccountId] = useState<string>(\"\"); // Cash/Bank"
theme_obj = """
  const t = useMemo(() => {
    return paymentType === 'RECEIPT' ? {
      text: "text-emerald-600 dark:text-emerald-500",
      textLight: "text-emerald-500",
      textDark: "text-emerald-600",
      bgHover: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
      bgHoverRow: "hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5",
      bgSelectedRow: "bg-emerald-500/5",
      borderHover: "hover:border-emerald-500",
      borderHoverAlpha: "hover:border-emerald-500/30",
      border: "border-emerald-500",
      groupHoverBg: "group-hover:bg-emerald-500",
      gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
      gradientShadow: "shadow-emerald-500/20",
      checkboxChecked: "data-[state=checked]:bg-emerald-500",
      focusRing: "focus-visible:ring-emerald-500",
      blob: "bg-emerald-500/5",
      alphaBox: "bg-emerald-500/5 border border-emerald-500/10",
      borderAlpha: "border-emerald-500/30",
      borderLight: "border-emerald-200 dark:border-emerald-500/20",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
      badgeBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
      groupHoverBorder: "border-emerald-500/20 group-hover:border-emerald-500",
      scrollbarHover: "#10b981", // emerald-500
    } : {
      text: "text-rose-600 dark:text-rose-500",
      textLight: "text-rose-500",
      textDark: "text-rose-600",
      bgHover: "hover:bg-rose-50 dark:hover:bg-rose-500/10",
      bgHoverRow: "hover:bg-rose-50/30 dark:hover:bg-rose-500/5",
      bgSelectedRow: "bg-rose-500/5",
      borderHover: "hover:border-rose-500",
      borderHoverAlpha: "hover:border-rose-500/30",
      border: "border-rose-500",
      groupHoverBg: "group-hover:bg-rose-500",
      gradient: "bg-gradient-to-r from-rose-500 to-red-500",
      gradientShadow: "shadow-rose-500/20",
      checkboxChecked: "data-[state=checked]:bg-rose-500",
      focusRing: "focus-visible:ring-rose-500",
      blob: "bg-rose-500/5",
      alphaBox: "bg-rose-500/5 border border-rose-500/10",
      borderAlpha: "border-rose-500/30",
      borderLight: "border-rose-200 dark:border-rose-500/20",
      btnBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20",
      badgeBox: "bg-rose-500/10 text-rose-600 dark:text-rose-500",
      groupHoverBorder: "border-rose-500/20 group-hover:border-rose-500",
      scrollbarHover: "#f43f5e", // rose-500
    };
  }, [paymentType]);
"""

if "const t = useMemo(" not in content:
    content = content.replace(state_anchor, state_anchor + "\n" + theme_obj)

# 3. Handle standard class replacements
replacements = {
    # Text and Border
    "text-orange-600 dark:text-orange-500": "${t.text}",
    "text-orange-600 dark:text-orange-400": "${t.text}",
    "text-orange-600": "${t.textDark}",
    "text-orange-500": "${t.textLight}",
    "hover:border-orange-500/30": "${t.borderHoverAlpha}",
    "hover:border-orange-500": "${t.borderHover}",
    "border-orange-200 dark:border-orange-500/20": "${t.borderLight}",
    "border-orange-500/30": "${t.borderAlpha}",
    "border-orange-500/20 group-hover:border-orange-500": "${t.groupHoverBorder}",
    
    # Backgrounds and States
    "hover:bg-orange-50 dark:hover:bg-orange-500/10": "${t.bgHover}",
    "hover:bg-orange-50/30 dark:hover:bg-orange-500/5": "${t.bgHoverRow}",
    "bg-orange-500/5 border border-orange-500/10": "${t.alphaBox}",
    "bg-orange-500/5 border-orange-500/10": "${t.alphaBox}", # Handle slightly different ones too if they exist
    "bg-orange-500/10 text-orange-600 dark:text-orange-500": "${t.badgeBox}",
    "bg-orange-500/10 rounded-md text-orange-600 dark:text-orange-500": "${t.badgeBox} rounded-md",
    "bg-orange-500/5": "${t.blob}",
    "group-hover:bg-orange-500": "${t.groupHoverBg}",
    "data-[state=checked]:bg-orange-500": "${t.checkboxChecked}",
    "focus-visible:ring-orange-500": "${t.focusRing}",
    "bg-orange-600 hover:bg-orange-700": "${t.btnBg}",
    
    # Shadows and Gradients
    "shadow-orange-500/20": "${t.gradientShadow}",
    "${ACCENT_GRADIENT}": "${t.gradient}",
    "ACCENT_GRADIENT": "t.gradient",
    
    # Scrollbar
    "#f97316": "${t.scrollbarHover}",
}

for old, new in replacements.items():
    content = content.replace(old, new)


# The replacements above will introduce ${...} syntax where there might just be normal string bounds.
# A regex pass to properly convert static class strings like `className="foo bar ${t.text}"`
# to `className={\`foo bar ${t.text}\`}` where necessary.

import re

def fix_classnames(match):
    # match is like: className="some-classes ${t.something} other-classes"
    inner_content = match.group(1)
    if '${t.' in inner_content and not inner_content.startswith('`'):
        # convert to template literal
        return f"className={{`{inner_content}`}}"
    return match.group(0)

content = re.sub(r'className="([^"]*\$\{t\.[^}]+\}[^"]*)"', fix_classnames, content)

# 4. Handle edge cases found
# <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-500">Rs {(amount - discount).toLocaleString()}</div>
# -> text-emerald-600 dark:text-emerald-500 is used statically on lines 977 and another spot, they should probably reflect the total, but maybe it's fine.

content = content.replace("'border-orange-500'", "t.border")
content = content.replace("${!originalChequeId && 'border-orange-500'}", "${!originalChequeId && t.border}")
content = content.replace("${!chequeNo && 'border-orange-500'}", "${!chequeNo && t.border}")
content = content.replace("${!row.original_cheque_id && 'border-orange-500'}", "${!row.original_cheque_id && t.border}")
content = content.replace("${!row.cheque_no && 'border-orange-500'}", "${!row.cheque_no && t.border}")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
