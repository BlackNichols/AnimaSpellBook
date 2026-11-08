# LaTeX SpellBook Specification (Anima: Beyond Fantasy)

## 1. Overview

This specification defines the LaTeX layout and generation rules to render the JSON spell database into a multi-column reference book matching the style of the official *Anima: Beyond Fantasy* sourcebooks (Core Exxet).

---

## 2. Document Layout & Typography

* **Orientation & Columns**: Standard A4 paper, two-column layout (`twocolumn` documentclass option or `multicol` package).
* **Column Separation**: `0.8cm` separation with a subtle vertical rule (`0.2pt`).
* **Visual Hierarchy**:
  * **Spell Name**: Large, bold, stylized dark red (`RGB: 128, 16, 16`).
  * **Classification Subtitle**: Small, bold, dark grey (`RGB: 60, 60, 60`) indicating Path, Level, Action, Type, AoE status, and Magic Resistance cap.
  * **Concept Description**: Small, italicized body text.
  * **Metrics Table**: Compact 4-column summary table (`Init.`, `Inter.`, `Adv.`, `Arcane`) with Zeon, Minimum Intelligence, and Maintenance.
  * **Grade Descriptions**: Detailed mechanics formatted with bold grade labels.

---

## 3. Data-to-LaTeX Transformation Rules

When generating LaTeX from the JSON database:

| JSON Field | Formatting in LaTeX |
|---|---|
| Special characters (`%`, `&`, `_`, `#`) | Must be escaped: `\%`, `\&`, `\_`, `\#`. |
| `maintenance == null` | Rendered as `--` (dash) to indicate unmaintainable. |
| `maintenance` numeric | Rendered as integer value. If `daily_maintenance == true`, optionally marked (e.g. `10 (D)` or noted in header). |
| `magic_resistance_cap == null` | Omitted from header or marked `MR: --`. |
| `magic_resistance_cap` numeric | Formatted as `MR: <val>` (e.g. `MR: 140`). |
| `is_aoe == true` | Formatted as `AoE: Yes` (or `Área`). |
| `category == "free_access"` | Header shows bracket: `Free Access [10-20]`. |

---

## 4. LaTeX Macro Specification (`\animaspell`)

The standard layout is packaged into an 8-argument macro:

```latex
\newcommand{\animaspell}[8]{
  % #1: Name (e.g. Bola de Fuego)
  % #2: Subheader (Path/Level, Action, Type, Maint frequency, MR, AoE)
  % #3: Zeon values row (z1 & z2 & z3 & z4)
  % #4: Intelligence values row (i1 & i2 & i3 & i4)
  % #5: Maintenance values row (m1 & m2 & m3 & m4)
  % #6: Concept effect / summary
  % #7: Grade descriptions (Initial, Intermediate, Advanced, Arcane)
  \noindent
  {\color{animared}\large\textbf{#1}}\par
  \vspace{-1pt}
  {\footnotesize\color{darkgray}\textbf{#2}}\par
  \vspace{1.5mm}
  {\small\textit{#6}}\par
  \vspace{1.5mm}
  % Compact Metrics Table
  \noindent
  {\footnotesize
  \begin{tabularx}{\columnwidth}{@{}lYYYY@{}}
    \toprule
    \textbf{Grade} & \textbf{Init.} & \textbf{Inter.} & \textbf{Adv.} & \textbf{Arcane} \\
    \midrule
    \textbf{Zeon} & #3 \\
    \textbf{Min. Int} & #4 \\
    \textbf{Maint.} & #5 \\
    \bottomrule
  \end{tabularx}}
  \vspace{1.5mm}
  % Detailed Grade Descriptions
  {\small
  #7
  }
  \vspace{4.0mm}
}
```

---

## 5. Complete Standalone LaTeX Example

The following standalone document demonstrates the compiled appearance:

```latex
\documentclass[10pt,a4paper,twocolumn]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=1.5cm]{geometry}
\usepackage{booktabs}
\usepackage{tabularx}
\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{microtype}

% Theme Colors
\definecolor{animared}{RGB}{128, 16, 16}
\definecolor{darkgray}{RGB}{60, 60, 60}

% Column rules
\setlength{\columnsep}{0.8cm}
\setlength{\columnseprule}{0.2pt}

% Column type for evenly spaced metrics table
\newcolumntype{Y}{>{\centering\arraybackslash}X}

% Spell Macro
\newcommand{\animaspell}[7]{
  \noindent
  {\color{animared}\large\textbf{#1}}\par
  \vspace{-1pt}
  {\footnotesize\color{darkgray}\textbf{#2}}\par
  \vspace{1.5mm}
  {\small\textit{#6}}\par
  \vspace{1.5mm}
  \noindent
  {\footnotesize
  \begin{tabularx}{\columnwidth}{@{}lYYYY@{}}
    \toprule
    \textbf{Grade} & \textbf{Init.} & \textbf{Inter.} & \textbf{Adv.} & \textbf{Arcane} \\
    \midrule
    \textbf{Zeon} & #3 \\
    \textbf{Min. Int} & #4 \\
    \textbf{Maint.} & #5 \\
    \bottomrule
  \end{tabularx}}
  \vspace{1.5mm}
  {\small
  #7
  }
  \vspace{4.0mm}
}

\begin{document}

\section*{Path of Fire}

\animaspell
  {Bola de Fuego}
  {Fire (Level 12) $\bullet$ Active / Attack $\bullet$ AoE: Yes}
  {40 & 70 & 110 & 150}
  {6 & 7 & 9 & 11}
  {-- & -- & -- & --}
  {Creates a sphere of flames that flies towards the target and detonates upon impact.}
  {
    \textbf{Initial:} Inflicts a base damage of 40 Heat in a 5-meter radius.\\
    \textbf{Intermediate:} Inflicts a base damage of 60 Heat in a 10-meter radius.\\
    \textbf{Advanced:} Inflicts a base damage of 80 Heat in a 25-meter radius.\\
    \textbf{Arcane:} Inflicts a base damage of 100 Heat in a 50-meter radius.
  }

\animaspell
  {Alter Destiny}
  {Chaos (Level 24) $\bullet$ Active / Spiritual $\bullet$ MR: 140}
  {50 & 90 & 130 & 180}
  {6 & 8 & 10 & 12}
  {10 & 20 & 30 & 40}
  {Disrupts the thread of probability surrounding an opponent.}
  {
    \textbf{Initial:} Target suffers a -20 penalty to all rolls for 1 turn.\\
    \textbf{Intermediate:} Target suffers a -40 penalty to all rolls for 1 turn.\\
    \textbf{Advanced:} Target suffers a -60 penalty to all rolls for 1 turn.\\
    \textbf{Arcane:} Target suffers a -80 penalty to all rolls for 1 turn.
  }

\end{document}
```

---

## 6. Python Jinja2 Automation Template

A script generating the `.tex` files from the JSON database should use the following Jinja2 template pattern:

```python
import json
from jinja2 import Template

def escape_tex(text: str) -> str:
    if not text:
        return ""
    chars = {"&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#", "_": r"\_"}
    for k, v in chars.items():
        text = text.replace(k, v)
    return text

def format_maint(val, is_daily):
    if val is None:
        return "--"
    return f"{val} (D)" if is_daily else str(val)

template_code = r"""
\animaspell
  { {{- escape_tex(spell.name) -}} }
  { {{- spell.path or "Free Access" }} (Level {{ spell.level if spell.level else (spell.level_bracket[0] ~ "-" ~ spell.level_bracket[1]) }}) $\bullet$ {{ spell.action }} / {{ spell.type }}{{ " $\bullet$ AoE" if spell.metadata.is_aoe }}{{ " $\bullet$ MR: " ~ spell.metadata.magic_resistance_cap if spell.metadata.magic_resistance_cap }} }
  { {{ spell.grades.initial.zeon }} & {{ spell.grades.intermediate.zeon }} & {{ spell.grades.advanced.zeon }} & {{ spell.grades.arcane.zeon }} }
  { {{ spell.grades.initial.min_int }} & {{ spell.grades.intermediate.min_int }} & {{ spell.grades.advanced.min_int }} & {{ spell.grades.arcane.min_int }} }
  { {{ format_maint(spell.grades.initial.maintenance, spell.daily_maintenance) }} & {{ format_maint(spell.grades.intermediate.maintenance, spell.daily_maintenance) }} & {{ format_maint(spell.grades.advanced.maintenance, spell.daily_maintenance) }} & {{ format_maint(spell.grades.arcane.maintenance, spell.daily_maintenance) }} }
  { {{- escape_tex(spell.effect) -}} }
  {
    \textbf{Initial:} {{ escape_tex(spell.grades.initial.description) }}\\
    \textbf{Intermediate:} {{ escape_tex(spell.grades.intermediate.description) }}\\
    \textbf{Advanced:} {{ escape_tex(spell.grades.advanced.description) }}\\
    \textbf{Arcane:} {{ escape_tex(spell.grades.arcane.description) }}
  }
"""
```
