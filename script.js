// script.js - With dynamic score coloring in custom HTML tooltip

let bigFiveRadarChart = null;
let umapKmeansScatterChart = null;
let allMoviesData = [];
let allMainCharactersBig5ForClustering = [];
let chartConfig = {};

let movieSelector;
let characterProfileTitle;
let bigFiveRadarChartCanvas;
let umapKmeansScatterChartCanvas;
let kSelector;

function drawBigFiveRadarChart(characterName, bigFiveData) {
  const currentRadarErrorDisplay = document.getElementById("radarErrorMessage");
  if (currentRadarErrorDisplay) currentRadarErrorDisplay.textContent = "";

  if (!bigFiveData) {
    if (characterProfileTitle) characterProfileTitle.textContent = "Select a character to view their profile";
    if (bigFiveRadarChart) { bigFiveRadarChart.destroy(); bigFiveRadarChart = null; }
    return;
  }

  const bigFiveLabels = Object.keys(bigFiveData);
  const bigFiveScores = bigFiveLabels.map((trait) => bigFiveData[trait].score);

  if (!bigFiveRadarChartCanvas) {
      if (currentRadarErrorDisplay) currentRadarErrorDisplay.textContent = "Radar chart canvas not found.";
      console.error("Radar chart canvas DOM element not found in drawBigFiveRadarChart");
      return;
  }
  const ctx = bigFiveRadarChartCanvas.getContext("2d");

  if (bigFiveRadarChart) bigFiveRadarChart.destroy();
  if (characterProfileTitle) characterProfileTitle.textContent = `${characterName}'s Personality Profile`;

  bigFiveRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
        labels: bigFiveLabels,
        datasets: [{
            label: `${characterName}'s Big Five Traits`,
            data: bigFiveScores,
            backgroundColor: "rgba(97, 175, 239, 0.15)",
            borderColor: "#61afef",
            pointBackgroundColor: "#61afef",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "#61afef",
            borderWidth: 3,
        }],
    },
    options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 1.2,
        plugins: {
            legend: { display: true, position: "top", labels: { color: "#dedede", font: { size: 14 }, padding: 20, }, },
            tooltip: { backgroundColor: "#2c313a", borderColor: "#434343", borderWidth: 1, titleColor: "#dedede", bodyColor: "#abb2bf", titleFont: { weight: "bold" }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 6, },
        },
        scales: {
            r: { angleLines: { display: true, color: "rgba(128, 128, 128, 0.3)" }, grid: { color: "rgba(128, 128, 128, 0.3)" }, pointLabels: { font: { size: 13, weight: "500" }, color: "#dedede", padding: 8, }, min: 0, max: 5, ticks: { stepSize: 1, display: true, backdropColor: "rgba(44, 49, 58, 0.8)", color: "#abb2bf", font: { size: 10 }, z: 1, }, },
        },
        elements: { line: { borderWidth: 3 }, point: { radius: 6, hoverRadius: 8 }, },
    },
  });
}

function populateMovieSelector() {
  if (!movieSelector) { console.error("Movie selector DOM element not found in populateMovieSelector"); return; }
  movieSelector.innerHTML = "<option disabled selected>Select a movie...</option>";
  const moviesWithProfiles = allMoviesData.filter(m => m.character_profile_big5 && m.character_list && m.character_list.length > 0);
  moviesWithProfiles.forEach((movie) => {
    const option = document.createElement("option");
    option.value = movie.movie_title;
    option.textContent = movie.movie_title;
    movieSelector.appendChild(option);
  });
}

function updateRadarChartForSelectedMovie() {
  if (!movieSelector) { console.error("Movie selector DOM element not found in updateRadarChartForSelectedMovie"); return; }
  const selectedMovieTitle = movieSelector.value;
  const selectedMovie = allMoviesData.find((movie) => movie.movie_title === selectedMovieTitle);
  if (selectedMovie) {
    const mainCharacterName = selectedMovie.character_list[0]?.name || selectedMovie.movie_title;
    const mainCharacterBig5 = selectedMovie.character_profile_big5;
    drawBigFiveRadarChart(mainCharacterName, mainCharacterBig5);
  } else {
    drawBigFiveRadarChart(null, null);
  }
}

function getDescriptiveClusterName(averageScores, globalTraitProfile = null) {
    const HIGH_THRESHOLD = 3.7;
    const LOW_THRESHOLD = 2.3;
    const NEUTRAL_MIDPOINT = 3.0;
    // Using your provided descriptors
    const descriptors = {
        Openness: { high: "Open", low: "Settled" },
        Conscientiousness: { high: "Diligent", low: "Flexible" },
        Extraversion: { high: "Extrovert", low: "Introvert" },
        Agreeableness: { high: "Agreeable", low: "Lone Wolf" },
        Neuroticism: { high: "Neurotic", low: "Composed" }
    };

    let processedTraits = Object.entries(averageScores).map(([trait, score]) => {
        let type = 'neutral', descriptorText = '';
        let isGenerallyHigh = globalTraitProfile ? globalTraitProfile[trait] === 'high' : false;
        let isGenerallyLow = globalTraitProfile ? globalTraitProfile[trait] === 'low' : false;

        // Determine initial type and descriptor based on score
        if (score >= HIGH_THRESHOLD) {
            type = 'high';
            descriptorText = descriptors[trait]?.high || trait;
        } else if (score <= LOW_THRESHOLD) {
            type = 'low';
            descriptorText = descriptors[trait]?.low || trait;
        }

        return {
            trait,
            score,
            type,
            descriptorText,
            deviation: Math.abs(score - NEUTRAL_MIDPOINT),
            isGenerallyHigh, // Mark if trait is high across all clusters
            isGenerallyLow   // Mark if trait is low across all clusters
        };
    });

    // Filter out traits that are generally high or low across all clusters, UNLESS they are exceptionally prominent for THIS cluster
    // This addresses the "redundant high traits" concern.
    const MIN_DEVIATION_TO_OVERRIDE_GLOBAL = 1.0; // If deviation is >= this, keep it even if globally common

    let significantDefiningTraits = processedTraits
        .filter(t => t.type !== 'neutral') // Only consider traits that are high or low for this cluster
        .map(t => {
            // Penalize deviation if the trait's type (high/low) matches its global trend, unless it's an extreme score for this cluster
            let effectiveDeviation = t.deviation;
            if ((t.isGenerallyHigh && t.type === 'high') || (t.isGenerallyLow && t.type === 'low')) {
                 // If it's common AND its deviation isn't massive for this specific cluster, reduce its significance
                if (t.deviation < MIN_DEVIATION_TO_OVERRIDE_GLOBAL + 0.5) { // Add a bit more buffer
                    effectiveDeviation *= 0.5; // Halve its importance for sorting
                }
            }
            return { ...t, effectiveDeviation };
        })
        .sort((a, b) => b.effectiveDeviation - a.effectiveDeviation); // Sort by (potentially adjusted) deviation


    let nameParts = [];

    // Take up to 3 most deviant significant traits that have descriptors
    for (let i = 0; i < significantDefiningTraits.length && nameParts.length < 3; i++) {
        const traitInfo = significantDefiningTraits[i];
        if (traitInfo.descriptorText && traitInfo.descriptorText.length > 0) {
            if (!nameParts.includes(traitInfo.descriptorText)) { // Avoid duplicate descriptors
                 nameParts.push(traitInfo.descriptorText);
            }
        }
    }

    if (nameParts.length === 0) {
        // Fallback: if all defining traits were filtered or had no descriptor,
        // pick the single most deviant trait from the original list that has a descriptor.
        const allTraitsRankedOriginal = processedTraits.sort((a, b) => b.deviation - a.deviation);
        for (let i = 0; i < allTraitsRankedOriginal.length; i++) {
            if (allTraitsRankedOriginal[i].descriptorText && allTraitsRankedOriginal[i].descriptorText.length > 0) {
                nameParts.push(allTraitsRankedOriginal[i].descriptorText);
                break;
            }
        }
        if (nameParts.length === 0) return "Balanced Profile"; // Further fallback
    }

    return nameParts.join(" & ");
}

// Custom HTML Tooltip Handler
const externalTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    const customHtmlCfg = chartConfig.customHtmlTooltip || {};
    const tooltipElId = customHtmlCfg.containerId || 'chartjs-custom-tooltip';
    let tooltipEl = document.getElementById(tooltipElId);

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = tooltipElId;
        document.body.appendChild(tooltipEl);
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.transition = 'opacity 0.1s ease-in-out';
    }

    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        tooltipEl.classList.remove('tooltip-visible');
        return;
    }

    if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
        const pointData = tooltip.dataPoints[0].raw;
        const movieTitle = pointData?.movieTitle || "Unknown Movie";
        const characterName = pointData?.name || "Unknown Character";

        let innerHtml = `<div class="${customHtmlCfg.titleClass || 'tooltip-header'}">`;
        innerHtml += `<span class="${customHtmlCfg.movieTitleClass || 'movie-title'}">${movieTitle}</span>`;
        innerHtml += `<span class="${customHtmlCfg.characterNameClass || 'character-name'}">${characterName}</span>`;
        innerHtml += '</div>';

        innerHtml += `<div class="${customHtmlCfg.bodyClass || 'tooltip-body-content'}">`;
        if (pointData?.fullBig5) {
            const scoreColorConfig = chartConfig.customHtmlTooltip?.scoreColors || {};
            const lowThreshold = scoreColorConfig.lowThreshold !== undefined ? scoreColorConfig.lowThreshold : 2.0;
            const highThreshold = scoreColorConfig.highThreshold !== undefined ? scoreColorConfig.highThreshold : 4.0;
            const lowColor = scoreColorConfig.lowColor || "#e06c75";    // Reddish
            const midColor = scoreColorConfig.midColor || "#e5c07b";    // Yellow/Orange
            const highColor = scoreColorConfig.highColor || "#98c379";  // Greenish

            Object.entries(pointData.fullBig5).forEach(([trait, data]) => {
                const scoreValue = data?.score;
                const scoreDisplay = scoreValue !== undefined ? scoreValue.toFixed(1) : "N/A";

                let scoreColor = midColor;
                if (scoreValue !== undefined) {
                    if (scoreValue <= lowThreshold) {
                        scoreColor = lowColor;
                    } else if (scoreValue >= highThreshold) {
                        scoreColor = highColor;
                    }
                }

                innerHtml += `<div class="${customHtmlCfg.bigFiveItemClass || 'big5-item'}">`;
                innerHtml += `  <span class="${customHtmlCfg.traitNameClass || 'trait-name'}">${trait}:</span>`;
                innerHtml += `  <span class="${customHtmlCfg.traitScoreClass || 'trait-score'}" style="color: ${scoreColor};">${scoreDisplay}</span>`;
                innerHtml += `</div>`;
            });
        }
        innerHtml += '</div>';
        tooltipEl.innerHTML = innerHtml;
    }

    tooltipEl.style.opacity = 1;
    tooltipEl.classList.add('tooltip-visible');

    const canvasRect = chart.canvas.getBoundingClientRect();
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const pointXInCanvas = tooltip.caretX;
    const pointYInCanvas = tooltip.caretY;
    const Y_OFFSET = 10;
    const X_OFFSET = 15;
    const EDGE_PADDING = 10;
    let desiredLeft = canvasRect.left + window.scrollX + pointXInCanvas + X_OFFSET;
    let desiredTop = canvasRect.top + window.scrollY + pointYInCanvas + Y_OFFSET;
    if ((desiredLeft - window.scrollX) + tooltipWidth > window.innerWidth - EDGE_PADDING) {
        desiredLeft = canvasRect.left + window.scrollX + pointXInCanvas - tooltipWidth - X_OFFSET;
    }
    if (desiredLeft < window.scrollX + EDGE_PADDING) {
        desiredLeft = window.scrollX + EDGE_PADDING;
    }
    if ((desiredTop - window.scrollY) + tooltipHeight > window.innerHeight - EDGE_PADDING) {
        desiredTop = canvasRect.top + window.scrollY + pointYInCanvas - tooltipHeight - Y_OFFSET;
    }
    if (desiredTop < window.scrollY + EDGE_PADDING) {
        desiredTop = window.scrollY + EDGE_PADDING;
    }
    tooltipEl.style.left = desiredLeft + 'px';
    tooltipEl.style.top = desiredTop + 'px';
};


function drawUmapKmeansPlot() {
  const currentScatterErrorDisplay = document.getElementById("scatterErrorMessage");
  if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Computing personality clusters...";

  if (!allMainCharactersBig5ForClustering || allMainCharactersBig5ForClustering.length === 0) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "No character data."; return; }
  if (allMainCharactersBig5ForClustering.length < 3) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Need 3+ characters."; return; }
  if (typeof UMAP === "undefined" || typeof kMeans === "undefined") { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Clustering libs not loaded."; return; }
  if (!umapKmeansScatterChartCanvas) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Cluster chart canvas not ready."; console.error("Cluster chart canvas DOM element not found in drawUmapKmeansPlot"); return; }

  const dataVectors = allMainCharactersBig5ForClustering.map(c => [ c.fullBig5.Openness?.score||0, c.fullBig5.Conscientiousness?.score||0, c.fullBig5.Extraversion?.score||0, c.fullBig5.Agreeableness?.score||0, c.fullBig5.Neuroticism?.score||0 ]);
  const nNeighbors = Math.min(15, Math.max(2, Math.floor(dataVectors.length / 3)));
  const umapInstance = new UMAP({ nNeighbors, minDist: 0.1, nComponents: 2, spread: 1.0 });
  let umapEmbeddings; try { umapEmbeddings = umapInstance.fit(dataVectors); } catch (e) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = `UMAP: ${e.message}`; return; }
  if (!umapEmbeddings || umapEmbeddings.length === 0) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "No UMAP embeddings."; return; }

  const kValue = Math.min(Number.parseInt(kSelector.value,10)||3, Math.floor(umapEmbeddings.length/2), 8);
  let clusterAssignments; try { const km = new kMeans({K:kValue}); km.autoCluster(umapEmbeddings); clusterAssignments = Array(umapEmbeddings.length).fill(0); km.clusters.forEach((idx, cid) => idx.forEach(i => {if(i<clusterAssignments.length) clusterAssignments[i]=cid;})); } catch (e) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = `kMeans: ${e.message}`; return; }

  const clusteredPoints = umapEmbeddings.map((coord, i) => ({
    x: coord[0], y: coord[1], name: allMainCharactersBig5ForClustering[i]?.name || `Char ${i+1}`,
    fullBig5: allMainCharactersBig5ForClustering[i]?.fullBig5 || {}, cluster: clusterAssignments[i] || 0,
    movieTitle: allMainCharactersBig5ForClustering[i]?.movieTitle || "Unknown Movie"
  }));

  const clusterColors = ["#61afef", "#e06c75", "#98c379", "#e5c07b", "#c678dd", "#56b6c2", "#d19a66", "#abb2bf"];


    // Calculate Global Trait Profile to identify consistently high/low traits
    let globalTraitSums = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };
    let globalTraitCounts = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };

    allMainCharactersBig5ForClustering.forEach(charData => { // Use all characters for a true global average
        if (charData.fullBig5 && typeof charData.fullBig5 === 'object') {
            Object.entries(charData.fullBig5).forEach(([trait, data]) => {
                if (data && typeof data.score === 'number' && globalTraitSums.hasOwnProperty(trait)) {
                    globalTraitSums[trait] += data.score;
                    globalTraitCounts[trait]++;
                }
            });
        }
    });

    const globalTraitAverages = {};
    Object.keys(globalTraitSums).forEach(trait => {
        if (globalTraitCounts[trait] > 0) {
            globalTraitAverages[trait] = globalTraitSums[trait] / globalTraitCounts[trait];
        } else {
            globalTraitAverages[trait] = 3.0; // Neutral if no data for a trait across all characters
        }
    });

    const GLOBAL_HIGH_THRESHOLD = 3.6;
    const GLOBAL_LOW_THRESHOLD = 2.4;
    const globalTraitProfile = {};
    Object.entries(globalTraitAverages).forEach(([trait, avgScore]) => {
        if (avgScore >= GLOBAL_HIGH_THRESHOLD) globalTraitProfile[trait] = 'high';
        else if (avgScore <= GLOBAL_LOW_THRESHOLD) globalTraitProfile[trait] = 'low';
        else globalTraitProfile[trait] = 'mid';
    });
    // End of Global Trait Profile Calculation

    const uniqueClusters = [...new Set(clusterAssignments)].sort((a, b) => a - b);
  const pointCfg = chartConfig.clusterChart?.point || {};

  const groupedDatasets = uniqueClusters.map((clusterId) => {
    const pointsInCluster = clusteredPoints.filter(p => p.cluster === clusterId);
    let descriptiveName = `Cluster ${clusterId + 1}`;
    if (pointsInCluster.length > 0) {
        const avgScores = {O:0,C:0,E:0,A:0,N:0}, traitMap = {O:"Openness",C:"Conscientiousness",E:"Extraversion",A:"Agreeableness",N:"Neuroticism"};
        let validCount = 0;
        pointsInCluster.forEach(p => { if (p.fullBig5 && Object.keys(p.fullBig5).length === 5) { Object.keys(traitMap).forEach(k => avgScores[k] += p.fullBig5[traitMap[k]]?.score||0); validCount++; }});
        if (validCount > 0) { const finalAvg = {}; Object.keys(traitMap).forEach(k => finalAvg[traitMap[k]] = avgScores[k]/validCount); descriptiveName = getDescriptiveClusterName(finalAvg, globalTraitProfile); }
        else { descriptiveName = `Cluster ${clusterId + 1} (No Data)`;}
    }
    return {
      label: descriptiveName, data: pointsInCluster, backgroundColor: clusterColors[clusterId % clusterColors.length],
      borderColor: "rgba(255,255,255,0.8)", borderWidth: pointCfg.borderWidth || 2, pointRadius: pointCfg.radius || 8,
      pointHoverRadius: pointCfg.hoverRadius || 12, pointBorderWidth: pointCfg.borderWidth || 2,
      pointHoverBorderWidth: pointCfg.hoverBorderWidth || 3,
    };
  });

  if (umapKmeansScatterChart) umapKmeansScatterChart.destroy();
  const ctx = umapKmeansScatterChartCanvas.getContext("2d");

  const defaultTooltipCfg = chartConfig.tooltip || {};
  const customHtmlTooltipCfg = chartConfig.customHtmlTooltip || {};
  const legendCfg = chartConfig.clusterChart?.legend || {};
  const axesCfg = chartConfig.clusterChart?.axes || { x: {}, y: {} };
  const useCustomHtml = customHtmlTooltipCfg.enabled === true;

  let finalTooltipOptions = {
      enabled: !useCustomHtml,
      backgroundColor: defaultTooltipCfg.backgroundColor || "#2c313a", borderColor: defaultTooltipCfg.borderColor || "#434343", borderWidth: defaultTooltipCfg.borderWidth || 1, titleColor: defaultTooltipCfg.titleColor || "#dedede", bodyColor: defaultTooltipCfg.bodyColor || "#abb2bf", titleFont: defaultTooltipCfg.titleFont || { weight: "bold", size: 13 }, bodyFont: defaultTooltipCfg.bodyFont || { size: 11 }, padding: defaultTooltipCfg.padding || 12, cornerRadius: defaultTooltipCfg.cornerRadius || 6, displayColors: defaultTooltipCfg.displayColors !== undefined ? defaultTooltipCfg.displayColors : false, caretSize: defaultTooltipCfg.caretSize || 5, caretPadding: defaultTooltipCfg.caretPadding || 2, titleMarginBottom: defaultTooltipCfg.titleMarginBottom || 6,
      callbacks: { title: (items) => { if (!items.length) return ""; const data = items[0].raw; return [data?.movieTitle||"Unknown Movie", data?.name||"Unknown Character"]; }, label: (item) => { const d = item.raw; const lines = []; if (d.fullBig5) Object.entries(d.fullBig5).forEach(([t,v])=>lines.push(`${t}: ${v?.score?.toFixed(1)||"N/A"}`)); return lines; }, },
  };

  if (useCustomHtml) {
      finalTooltipOptions.enabled = false;
      finalTooltipOptions.external = externalTooltipHandler;
  }

  umapKmeansScatterChart = new Chart(ctx, {
    type: "scatter",
    data: { datasets: groupedDatasets },
    options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: "nearest", intersect: true, },
        plugins: {
            legend: { display: legendCfg.display !== undefined ? legendCfg.display : true, position: legendCfg.position || "top", labels: { color: legendCfg.labels?.color || "#dedede", font: legendCfg.labels?.font || { size: 12 }, padding: legendCfg.labels?.padding || 15, usePointStyle: legendCfg.labels?.usePointStyle !== undefined ? legendCfg.labels.usePointStyle : true, pointStyle: legendCfg.labels?.pointStyle || "circle", }, },
            tooltip: finalTooltipOptions,
        },
        scales: {
            x: { title: { display: true, text: axesCfg.x?.title || "UMAP Dimension 1", color: axesCfg.x?.titleColor || "#dedede", font: axesCfg.x?.titleFont || { size: 13, weight: "500" }, }, ticks: { color: axesCfg.x?.ticksColor || "#abb2bf", font: axesCfg.x?.ticksFont || { size: 11 } }, grid: { color: axesCfg.x?.gridColor || "rgba(128, 128, 128, 0.2)", drawBorder: false }, },
            y: { title: { display: true, text: axesCfg.y?.title || "UMAP Dimension 2", color: axesCfg.y?.titleColor || "#dedede", font: axesCfg.y?.titleFont || { size: 13, weight: "500" }, }, ticks: { color: axesCfg.y?.ticksColor || "#abb2bf", font: axesCfg.y?.ticksFont || { size: 11 } }, grid: { color: axesCfg.y?.gridColor || "rgba(128, 128, 128, 0.2)", drawBorder: false }, },
        },
    },
  });
  if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "";
}

window.onload = async () => {
  movieSelector = document.getElementById("movieSelector");
  characterProfileTitle = document.getElementById("characterProfileTitle");
  bigFiveRadarChartCanvas = document.getElementById("bigFiveRadarChart");
  umapKmeansScatterChartCanvas = document.getElementById("umapKmeansScatterChart");
  kSelector = document.getElementById("kSelector");
  const radarErrorMessageDisplay = document.getElementById("radarErrorMessage");
  const scatterErrorMessageDisplay = document.getElementById("scatterErrorMessage");

  if (!movieSelector || !characterProfileTitle || !bigFiveRadarChartCanvas || !umapKmeansScatterChartCanvas || !kSelector || !radarErrorMessageDisplay || !scatterErrorMessageDisplay) {
      console.error("CRITICAL: One or more essential DOM elements are missing! Check IDs in HTML.");
      alert("Error: Page elements missing. App cannot start correctly.");
      return;
  }

  if (kSelector) {
    kSelector.addEventListener("change", () => {
        if (allMainCharactersBig5ForClustering.length > 0) drawUmapKmeansPlot();
    });
  } else { console.error("kSelector element not found, cannot attach event listener."); }

  if (movieSelector) {
    movieSelector.addEventListener("change", updateRadarChartForSelectedMovie);
  } else { console.error("movieSelector element not found, cannot attach event listener."); }

  try {
    radarErrorMessageDisplay.textContent = "";
    scatterErrorMessageDisplay.textContent = "Loading configuration and data...";

    try {
        const configRes = await fetch("config.yaml");
        if (!configRes.ok) throw new Error(`Config load failed: ${configRes.status}`);
        const configYamlText = await configRes.text();
        chartConfig = jsyaml.load(configYamlText);
        if (typeof chartConfig !== 'object' || chartConfig === null) { chartConfig = {}; console.warn("Config not an object, using defaults.");}
    } catch (configError) {
        console.error("Config load error:", configError);
        scatterErrorMessageDisplay.textContent = `Config error. Using default styles.`;
    }

    const res = await fetch("clean_movie_database.yaml");
    if (!res.ok) throw new Error(`Movie data load failed: ${res.status}`);
    const yamlText = await res.text();
    allMoviesData = jsyaml.load(yamlText);
    if (!Array.isArray(allMoviesData) || allMoviesData.length === 0) throw new Error("No movie data found");

    populateMovieSelector();

    allMainCharactersBig5ForClustering = allMoviesData
      .filter(m => m.character_profile_big5 && typeof m.character_profile_big5 === 'object' &&
        ['Openness','Conscientiousness','Extraversion','Agreeableness','Neuroticism'].every(t => m.character_profile_big5[t] && typeof m.character_profile_big5[t].score === 'number') &&
        m.character_list && Array.isArray(m.character_list) && m.character_list.length > 0
      )
      .map(m => ({ name: m.character_list[0]?.name||m.movie_title||"Unknown Character", fullBig5: m.character_profile_big5, movieTitle: m.movie_title }));

    const firstMovie = allMoviesData.find(m => m.character_profile_big5 && typeof m.character_profile_big5 === 'object' && Object.keys(m.character_profile_big5).length === 5 && m.character_list && m.character_list.length > 0);
    if (firstMovie) {
        if (movieSelector) movieSelector.value = firstMovie.movie_title;
        updateRadarChartForSelectedMovie();
    }

    if (allMainCharactersBig5ForClustering.length > 0) {
      drawUmapKmeansPlot();
    } else {
      scatterErrorMessageDisplay.textContent = "No characters with complete profiles for clustering.";
    }

  } catch (error) {
    const errorMsg = `Initialization error: ${error.message}`;
    console.error(errorMsg, error);
    if (radarErrorMessageDisplay) radarErrorMessageDisplay.textContent = errorMsg;
    if (scatterErrorMessageDisplay && !scatterErrorMessageDisplay.textContent.startsWith("Config error")) {
        scatterErrorMessageDisplay.textContent = errorMsg;
    }
  }
};