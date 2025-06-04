# Movie Character Personality Profiler

This project visualizes the personality profiles of movie characters based on the Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism). It features an interactive radar chart for individual character profiles and a dynamic scatter plot that clusters characters using UMAP for dimensionality reduction and k-means for clustering.

## ✨ Features

*   **Individual Character Profiles:** Select a movie and view the main character's Big Five personality trait scores on a radar chart.
*   **Dynamic Personality Clustering:**
    *   Visualizes characters from various movies in a 2D space using UMAP based on their Big Five scores.
    *   Groups characters into clusters using the k-means algorithm.
    *   The number of clusters (k) can be adjusted by the user (default 2-8).
*   **Descriptive Cluster Names:**
    *   Clusters are automatically named based on their dominant personality traits (up to 3 defining traits).
    *   The naming logic attempts to de-emphasize traits that are globally common across all characters in the current dataset, highlighting what makes each cluster unique.
*   **Custom HTML Tooltips:**
    *   Hovering over points in the scatter plot reveals a detailed tooltip showing:
        *   Movie Title
        *   Character Name
        *   Full Big Five scores for the character.
    *   Trait scores in the tooltip are dynamically colored: greenish for high scores, reddish for low scores, and neutral for mid-range scores.
*   **Configuration via `config.yaml`:**
    *   Many visual aspects, especially for the cluster chart and tooltips (including custom HTML tooltip classes and score coloring thresholds/colors), are configurable through `config.yaml` without needing to modify the JavaScript.
*   **Data-Driven:** Populates movie and character data from `clean_movie_database.yaml`.

## 📸 Preview

**(Consider adding a screenshot or GIF of the application in action here!)**
Example:
`![App Screenshot](path/to/your/screenshot.png)`

## 🛠️ Technologies Used

*   **HTML5**
*   **CSS3**
*   **JavaScript (ES6+)**
*   **Chart.js:** For rendering radar and scatter plots.
*   **UMAP-JS:** For Uniform Manifold Approximation and Projection (dimensionality reduction).
*   **kMeans-JS:** For k-means clustering.
*   **js-yaml:** For parsing YAML data files (`clean_movie_database.yaml` and `config.yaml`).

## 🚀 Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```

2.  **Prepare Data Files:**
    *   Ensure you have your character data in `clean_movie_database.yaml` in the root directory. The structure should be an array of movie objects, where each object contains `movie_title`, `character_list` (with at least one character having a `name`), and `character_profile_big5` (for the primary character, with scores for `Openness`, `Conscientiousness`, `Extraversion`, `Agreeableness`, `Neuroticism`).
    *   A `config.yaml` file is used for styling and behavior configurations. An example structure is provided below (and should be in your repository).

3.  **Run a local web server:**
    Due to browser security restrictions (CORS policy), `fetch()` requests for local files (like your YAML files) won't work if you simply open `index.html` directly from the file system (`file:///...`). You need to serve the files through a local web server.

    *   **Using Python 3:**
        ```bash
        python -m http.server
        ```
        Then open `http://localhost:8000` (or the port indicated) in your browser.

    *   **Using Node.js (with `http-server` or `live-server`):**
        If you have Node.js, you can install a simple server:
        ```bash
        npm install -g http-server
        http-server .
        ```
        Or, for live reloading:
        ```bash
        npm install -g live-server
        live-server
        ```
        Then open the URL provided by the server (usually `http://localhost:8080` or `http://127.0.0.1:8080`).

    *   **Using VS Code Live Server Extension:** If you use VS Code, the "Live Server" extension is a convenient option.

## 📖 Usage

1.  Open `index.html` via your local web server in a modern web browser.
2.  **Radar Chart:**
    *   Use the "Select Movie" dropdown to choose a movie.
    *   The radar chart will display the Big Five personality profile of the main character from the selected movie.
3.  **Personality Clusters (Scatter Plot):**
    *   The scatter plot visualizes all main characters from the dataset.
    *   Use the "Number of Clusters (k)" input to change the number of clusters k-means will identify. The plot will update automatically.
    *   Hover over any point (character) in the scatter plot to see a detailed tooltip with their movie, name, and Big Five scores.
    *   The legend displays the dynamically generated names for each cluster.

## ⚙️ Configuration (`config.yaml`)

The `config.yaml` file allows you to customize various aspects of the application without directly editing the JavaScript.

Key configurable sections include:

*   **`customHtmlTooltip`**:
    *   `enabled`: `true` to use the custom HTML tooltip, `false` for the default Chart.js tooltip.
    *   `containerId`: ID of the `div` element used for the custom tooltip.
    *   Class names for different parts of the tooltip (`titleClass`, `movieTitleClass`, `characterNameClass`, `bodyClass`, `bigFiveItemClass`, `traitNameClass`, `traitScoreClass`). These allow for fine-grained CSS styling.
    *   `scoreColors`: Define thresholds (`lowThreshold`, `highThreshold`) and colors (`lowColor`, `midColor`, `highColor`) for dynamically coloring trait scores in the tooltip.
*   **`tooltip`**: (Used if `customHtmlTooltip.enabled` is `false`, or as fallback) Standard Chart.js tooltip options like `backgroundColor`, `titleColor`, `bodyColor`, `padding`, `cornerRadius`, etc.
*   **`clusterChart`**:
    *   `point`: Styling for points in the scatter plot (`radius`, `hoverRadius`, `borderWidth`).
    *   `legend`: Options for the legend display (`display`, `position`, `labels`).
    *   `axes`: Styling and titles for the X and Y axes (`title`, `titleColor`, `ticksColor`, `gridColor`).
*   **`clusterNameDescriptors`**: (Optional) You can define the specific words used for "high", "low", and "opposite" for each Big Five trait when generating cluster names. If not provided, the script uses internal defaults.

Example snippet from `config.yaml`:
```yaml
customHtmlTooltip:
  enabled: true
  containerId: "chartjs-custom-tooltip"
  movieTitleClass: "movie-title-custom-style"
  scoreColors:
    lowThreshold: 2.2
    highThreshold: 3.8
    lowColor: "#D95C5C"
    midColor: "#D4B16A"
    highColor: "#7BCC70"

clusterChart:
  point:
    radius: 9
  axes:
    x:
      title: "Personality Dimension A (UMAP)"
```

## 📁 File Structure

```
.
├── index.html                # Main HTML file
├── script.js                 # Core JavaScript logic
├── config.yaml               # Configuration for styling and behavior
├── clean_movie_database.yaml # Character personality data
└── README.md                 # This file
```

## 💡 Code Highlights

*   **Dynamic Cluster Naming (`getDescriptiveClusterName` in `script.js`):** This function analyzes the average Big Five scores for each cluster and considers the global trait profile across all characters to generate meaningful, multi-part names that highlight distinguishing characteristics.
*   **Custom HTML Tooltips (`externalTooltipHandler` in `script.js`):** Demonstrates how to use Chart.js's `external` tooltip option to render fully custom HTML tooltips, allowing for complex content and fine-grained CSS styling, including dynamic coloring of scores.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please feel free to check the issues page or open a new one.

## 📄 License

MIT