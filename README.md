# Movie Character Personality Profiler

This project is an interactive dashboard for visualizing the personality profiles of movie characters using the Big Five model. It goes beyond static charts by providing a user-driven, exploratory interface to discover how characters cluster and compare based on their unique traits.

## ✨ Features

*   **Individual Character Profiles:** Use the dropdown to select a movie and see the main character's Big Five personality traits rendered on a detailed radar chart.
*   **Interactive, User-Defined Clustering:** This is the core of the application. You can dynamically control the clustering algorithm by clicking on the trait cards in the "Global Dataset Profile."
    *   Choose to cluster characters based on a single dimension (like Openness) or any combination of the five traits.
    *   The UMAP scatter plot instantly re-calculates and re-renders to show the new personality groupings based on your selection.
*   **Context-Aware Cluster Naming:** The legend labels are intelligently generated to reflect the current clustering dimensions.
    *   When clustering by **one trait**, names are ranked to show the opposing poles (e.g., "Open," "Mid-Range," "Settled").
    *   When clustering by **multiple traits**, names are a composite of the most defining characteristics of that group (e.g., "Introvert & Diligent").
*   **Synced Views:** The charts are fully synchronized. Clicking a character on the scatter plot updates the radar chart, and using the dropdown highlights the character on the plot, creating a seamless exploratory experience.
*   **Custom HTML Tooltips:** Hovering over a point on the scatter plot reveals a rich tooltip with the character's name, movie, and their complete Big Five scores, with high/low values colored for quick analysis.
*   **Data-Driven:** The entire application is populated from a `clean_movie_database.yaml` file, making it easy to use with your own datasets.
*   **Configurable Appearance:** Key visual elements, such as colors, fonts, and tooltip styles, can be easily modified through the `config.yaml` file.

## 📸 Preview

**(A new screenshot showing the interactive "Global Dataset Profile" selectors would be highly recommended here!)**
Example:
`![App Screenshot](README01.jpg)`

## 🛠️ Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Charting:** Chart.js
*   **Data Science Libraries:** UMAP-JS (for dimensionality reduction), kMeans-JS (for clustering)
*   **Data Parsing:** js-yaml

## 🚀 Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rurounigit/character_diagram.git
    cd your-repository-name
    ```
2.  **Prepare Data Files:**
    *   Your character data should be in `clean_movie_database.yaml` in the root directory. The expected structure is an array of movie objects, each with a `movie_title`, `character_list`, and a complete `character_profile_big5` for the main character.
    *   The `config.yaml` file is used for visual styling and is ready to be modified.
3.  **Run a Local Web Server:** Because the application fetches local data files, it must be served by a web server due to browser CORS policies.
    *   **The simple way (Python 3):**
        ```bash
        python -m http.server
        ```
        Then, open `http://localhost:8000` in your browser.

## 📖 Usage Guide

1.  **Open the application** by navigating to your local server's address.
2.  **Select a Movie** from the dropdown to view an individual character's profile on the radar chart.
3.  **Explore Personality Clusters** on the scatter plot:
    *   The chart initializes by clustering on all five traits.
    *   **Click the "Global Dataset Profile" cards** to toggle which traits are used in the clustering algorithm. The chart will update on every click.
    *   Use the **"Number of Clusters (k)"** input to change how many groups are formed (from 2 to 5).
    *   **Hover** over any point to see that character's details.
    *   **Click** any point to sync it with the radar chart above.

## ⚙️ Configuration (`config.yaml`)

You can customize the look and feel of the application via `config.yaml` without editing the JavaScript.

*   **`clusterNameDescriptors`**: This is an important one. It lets you define the high/low descriptor words for each trait (e.g., `high: "Diligent"`).
*   **`globalHighThreshold` / `globalLowThreshold`**: These only affect the visual "High/Mid/Low" tags on the interactive selector cards. They do not change the naming logic.
*   **`customHtmlTooltip`**: Change the CSS classes and colors used in the scatter plot's detailed tooltip.
*   **`radarChart` & `clusterChart`**: Configure visual properties for both charts, such as point sizes, fonts, and colors.

## 📁 File Structure

```
.
├── index.html                # Main HTML file
├── script.js                 # Core JavaScript logic
├── config.yaml               # Configuration for styling and behavior
├── clean_movie_database.yaml # Character personality data
└── README.md                 # This file
```