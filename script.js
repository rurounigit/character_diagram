// Note: Chart.js and js-yaml are loaded via <script> tags in index.html.
// js-yaml is expected to populate the global 'jsyaml' object (window.jsyaml).

// Global variable for the Chart.js instance
let bigFiveChart = null;
// Global variable to store all loaded movie data
let allMoviesData = [];

// DOM Elements
const movieSelector = document.getElementById('movieSelector');
const characterProfileTitle = document.getElementById('characterProfileTitle');
const bigFiveRadarChartCanvas = document.getElementById('bigFiveRadarChart');
const errorMessageDisplay = document.getElementById('errorMessage');

// Function to draw or update the radar chart
function drawBigFiveRadarChart(characterName, bigFiveData) {
    errorMessageDisplay.textContent = ''; // Clear previous errors

    if (!bigFiveData) {
        characterProfileTitle.textContent = `No Personality Profile for ${characterName}`;
        if (bigFiveChart) {
            bigFiveChart.destroy(); // Destroy old chart
            bigFiveChart = null; // Clear reference
        }
        return;
    }

    const bigFiveLabels = Object.keys(bigFiveData);
    const bigFiveScores = bigFiveLabels.map(trait => bigFiveData[trait].score);

    const ctx = bigFiveRadarChartCanvas.getContext('2d');

    // Destroy existing chart if it exists
    if (bigFiveChart) {
        bigFiveChart.destroy();
    }

    bigFiveChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: bigFiveLabels,
            datasets: [{
                label: `${characterName}'s Big Five Traits`,
                data: bigFiveScores,
                backgroundColor: 'rgba(97, 175, 239, 0.2)', // Theme blue with transparency
                borderColor: '#61afef',      // Solid theme blue
                pointBackgroundColor: '#61afef',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#61afef'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Fixes the "falls down" issue
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#dedede', // Theme color for legend text
                        font: {
                            size: 14
                        }
                    }
                },
                title: { // This title is part of the Chart.js canvas, so it's hidden as we have an H2
                    display: false,
                },
                tooltip: { // Styling tooltips to match your theme
                    backgroundColor: '#2c313a',
                    borderColor: '#434343',
                    borderWidth: 1,
                    titleColor: '#dedede',
                    bodyColor: '#abb2bf',
                    titleFont: { weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 4
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(128, 128, 128, 0.2)'
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    },
                    pointLabels: {
                        font: {
                            size: 14
                        },
                        color: '#dedede'
                    },
                    min: 0,
                    max: 5, // Big Five scores are 1-5
                    ticks: {
                        stepSize: 1,
                        display: true,
                        backdropColor: 'rgba(44, 49, 58, 0.7)',
                        color: '#abb2bf',
                        font: {
                            size: 10
                        },
                        z: 1
                    }
                }
            },
            elements: {
                line: { borderWidth: 3 },
                point: { radius: 5, hoverRadius: 7 }
            }
        }
    });
}

// Function to populate the movie selector dropdown
function populateMovieSelector() {
    movieSelector.innerHTML = '<option disabled selected>Select a movie...</option>'; // Default option
    allMoviesData.forEach(movie => {
        // Only add movies that have a character_profile_big5 and a main character listed
        if (movie.character_profile_big5 && movie.character_list && movie.character_list.length > 0) {
            const option = document.createElement('option');
            option.value = movie.movie_title;
            option.textContent = movie.movie_title;
            movieSelector.appendChild(option);
        }
    });
}

// Function to update the chart based on the selected movie
function updateChartForSelectedMovie() {
    const selectedMovieTitle = movieSelector.value;
    const selectedMovie = allMoviesData.find(movie => movie.movie_title === selectedMovieTitle);

    if (selectedMovie) {
        // Assume character_profile_big5 always refers to the main character (first in list)
        const mainCharacterName = selectedMovie.character_list[0]?.name || selectedMovie.movie_title;
        const mainCharacterBig5 = selectedMovie.character_profile_big5;

        characterProfileTitle.textContent = `${mainCharacterName}'s Personality Profile`;
        drawBigFiveRadarChart(mainCharacterName, mainCharacterBig5);
    } else {
        characterProfileTitle.textContent = "No Movie Selected / Data Unavailable";
        drawBigFiveRadarChart(null, null); // Clear the chart
    }
}

// Initial data load and setup
async function initializeChartPage() {
    try {
        // 1. Fetch the YAML file
        const response = await fetch('clean_movie_database.yaml');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - Could not load clean_movie_database.yaml`);
        }
        const yamlText = await response.text();

        // 2. Parse the YAML content using the global jsyaml object
        // The previous error "jsyaml.load is not a function" happened because 'jsyaml' was imported via 'import * as jsyaml from ...'
        // which can wrap the exports. By relying on the global 'window.jsyaml', we access it as intended by the CDN.
        allMoviesData = window.jsyaml.load(yamlText);

        // 3. Populate the movie selector
        populateMovieSelector();

        // 4. Select the first available movie (if any) and draw its chart
        if (allMoviesData.length > 0) {
            // Find the first movie that actually has Big5 data
            const firstMovieWithBig5 = allMoviesData.find(movie => movie.character_profile_big5 && movie.character_list && movie.character_list.length > 0);
            if (firstMovieWithBig5) {
                movieSelector.value = firstMovieWithBig5.movie_title; // Set selector to this movie
                updateChartForSelectedMovie(); // Draw chart for this movie
            } else {
                errorMessageDisplay.textContent = 'No movies with Big Five personality data found.';
                characterProfileTitle.textContent = 'No Data Available';
                drawBigFiveRadarChart(null, null); // Clear chart
            }
        } else {
            errorMessageDisplay.textContent = 'No movie data loaded from YAML file.';
            characterProfileTitle.textContent = 'No Data Available';
            drawBigFiveRadarChart(null, null); // Clear chart
        }

    } catch (error) {
        console.error("Error loading or processing data:", error);
        errorMessageDisplay.textContent = `Error: ${error.message}. Please ensure 'clean_movie_database.yaml' is in the same directory and accessible via a local web server.`;
        characterProfileTitle.textContent = 'Failed to Load Data';
        drawBigFiveRadarChart(null, null); // Clear chart
    }
}

// Add event listener for movie selection change
movieSelector.addEventListener('change', updateChartForSelectedMovie);

// Initialize the page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeChartPage);
