# TolStack Pro: Engineering Tolerance Analysis Suite

> **Live Application:** [https://tol-stack-pro2.vercel.app/](https://tol-stack-pro2.vercel.app/)
> 
> *This application was created using Google Gemini.*

## 1. Executive Summary
**TolStack Pro** is a professional-grade web application designed for Mechanical and Quality Engineers. It performs geometric dimension loop analysis (tolerance stack-ups) using three distinct mathematical models: **Worst Case**, **Root Sum Square (RSS)**, and **Monte Carlo Simulation**.

The tool integrates **Process Capability ($C_{pk}$)** data to bridge the gap between theoretical design and manufacturing reality, estimating production yields and interference risks before physical prototyping.

---

## 2. Theoretical Background & Literature

### 2.1 What is Tolerance Stack-up?
Tolerance stack-up analysis is the process of calculating the cumulative effect of part tolerances on an assembly's overall fit and function. When parts are assembled, their individual variations sum up, potentially causing interference (parts not fitting) or excessive gaps (loose assemblies).

### 2.2 The Vector Loop Method
This application uses the **1D Vector Loop Method**. 
*   **Positive (+) Vectors:** Dimensions that contribute to the size of the stack in the direction of the analysis.
*   **Negative (-) Vectors:** Dimensions that subtract from the size (closing the loop).

**Formula for Gap:**
$$ G = \sum_{i=1}^{n} (D_i \cdot S_i) $$
*Where $D_i$ is the dimension value and $S_i$ is the sign ($\pm 1$).*

### 2.3 Mathematical Models Implemented

#### A. Worst Case (Arithmetic)
This method assumes every part in the assembly is produced at its maximum or minimum tolerance limit simultaneously. It is purely additive.

*   **Usage:** Critical safety features where failure is not an option.
*   **Formula:**
    $$ T_{asm} = \sum T_i $$
*   **Pros:** guarantees 100% interchangeability.
*   **Cons:** Often results in overly tight, expensive component tolerances.

#### B. Root Sum Square (RSS) - Statistical
This method assumes variations follow a Normal Distribution (Gaussian). It relies on the statistical probability that it is unlikely all parts will be at their worst-case limits simultaneously.

*   **Usage:** Mass production assemblies.
*   **Formula:**
    $$ \sigma_{asm} = \sqrt{ \sum \sigma_i^2 } $$
    $$ T_{asm} = 3 \cdot \sigma_{asm} $$
*   **Assumption:** The app derives $\sigma_i$ from the input tolerance and $C_{pk}$ (see section 2.4).

#### C. Monte Carlo Simulation
The application runs **10,000 iterations** of virtual assemblies. For each iteration, it randomly selects values for every dimension based on their defined probability distribution (Normal, Uniform, etc.) and calculates the resulting gap.

*   **Usage:** Complex assemblies with non-normal distributions or mixed manufacturing processes.
*   **Output:** Generates a histogram and calculates true projected Yield %.

---

## 3. Process Capability ($C_{pk}$) & Quality

A unique feature of TolStack Pro is the integration of $C_{pk}$. The $C_{pk}$ index measures how close a process is to its specification limits, relative to the natural variability of the process.

**Relationship between Tolerance and Standard Deviation:**
$$ \sigma = \frac{\text{Tolerance}}{3 \cdot C_{pk}} $$

### Impact of Cpk on Manufacturing (Reference Table)

| Cpk Value | Sigma Level | PPM (Parts Per Million Defective) | Interpretation | Cost Implication |
| :--- | :--- | :--- | :--- | :--- |
| **0.67** | 2$\sigma$ | 45,500 | **Poor.** Process is not capable. | High scrap/rework costs. Requires 100% inspection. |
| **1.00** | 3$\sigma$ | 2,700 | **Marginal.** The process width equals the tolerance width. | Statistical control is difficult. Frequent tuning required. |
| **1.33** | 4$\sigma$ | 63 | **Standard.** Industry standard for "Capable". | Good balance of cost and quality. Sample inspection sufficient. |
| **1.67** | 5$\sigma$ | 0.57 | **High Precision.** | Very low defect rate. |
| **2.00** | 6$\sigma$ | ~0.002 | **Six Sigma (World Class).** | Virtually zero defects. Allows for automated assembly. |

*In TolStack Pro, selecting a manufacturing process (e.g., "Machining (Standard)") automatically assigns a standard tolerance and a $C_{pk}$ of 1.33, effectively assuming a 4-sigma quality level.*

---

## 4. Application Documentation

### 4.1 Inputs (Build Stack Tab)

| Input Field | Description |
| :--- | :--- |
| **Stackup Name** | Title for the analysis (e.g., "Pivot Pin Clearance"). |
| **Target Limits (LSL/USL)** | The required design constraints. <br> *Example:* For a clearance fit, LSL = 0 (no interference). |
| **Dimension Name** | Identifier for the part (e.g., "Housing Depth"). |
| **Sign (+/-)** | Direction of the vector. <br> **+** adds to the gap.<br> **-** subtracts from the gap. |
| **Nominal** | The basic dimension value. |
| **Tol (+/-)** | The upper and lower tolerance deviations. |
| **Process** | *Dropdown.* Auto-fills tolerances based on manufacturing standards (ISO 2768 / IT Grades). |
| **Cpk** | Manufacturing capability index. Defaults to 1.33. Used to calculate standard deviation for RSS. |

### 4.2 Outputs (Analyze Results Tab)

1.  **Worst Case Gap:** The absolute minimum and maximum possible gap.
2.  **RSS Gap:** The 3-sigma statistical range.
3.  **Monte Carlo Yield:** The percentage of virtual assemblies that fell within the defined LSL and USL.
4.  **Contribution Analysis:** A bar chart showing which dimension contributes most to the overall variation. *Use this to identify which tolerances to tighten to reduce cost effectively.*

---

## 5. Example Case Study: Pin in Hole Fit

**Scenario:** A 10mm Pin fits into a 10mm Hole. We need to ensure there is always clearance (Gap > 0).

**Setup:**

1.  **Hole (Dim 1):**
    *   Type: Hole
    *   Process: Drilling (Standard)
    *   Nominal: 10.00
    *   Tol: +0.10 / -0.00
    *   Sign: **(+)** (The hole creates space)

2.  **Pin (Dim 2):**
    *   Type: Shaft
    *   Process: Turning (Precision)
    *   Nominal: 9.95
    *   Tol: +0.00 / -0.05
    *   Sign: **(-)** (The pin fills space)

**Results:**
*   **Nominal Gap:** $10.00 - 9.95 = 0.05$ mm
*   **Worst Case Min:** $10.00 (\text{min hole}) - 9.95 (\text{max pin}) = 0.05$ mm.
*   *Note: If Pin max was 10.05, WC Min would be -0.05 (Interference).*

---

## 6. References & Standards

The logic and data used in TolStack Pro are derived from the following engineering standards:

1.  **ASME Y14.5-2018**: *Dimensioning and Tolerancing.* (Geometric Dimensioning and Tolerancing rules).
2.  **ISO 2768-1**: *General Tolerances for linear and angular dimensions without individual tolerance indications.* (Used for standard process baselines).
3.  **Drake, Paul J.**: *Dimensioning and Tolerancing Handbook.* McGraw-Hill, 1999. (Source for Vector Loop Method and RSS derivation).
4.  **Harry, Mikel & Schroeder, Richard**: *Six Sigma: The Breakthrough Management Strategy.* (Source for $C_{pk}$ and PPM correlation tables).
5.  **AIAG (Automotive Industry Action Group)**: *Statistical Process Control (SPC) Reference Manual.*
