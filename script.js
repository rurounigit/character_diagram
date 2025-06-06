// script.js - FINAL VERSION 7.0 - Correcting the inexcusable function call error.

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

let selectedTraitsForClustering = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
let currentlySyncedMovieTitle = null;

if (Chart.Tooltip && Chart.Tooltip.positioners) {
    Chart.Tooltip.positioners.customNearPoint = function(activeElements, eventPosition) {
        if (!activeElements || !activeElements.length) return false;
        const el = activeElements[0].element;
        if (el && typeof el.x === 'number' && typeof el.y === 'number') return { x: el.x, y: el.y };
        return eventPosition;
    };
}

function drawBigFiveRadarChart(characterName, bigFiveData, movieTitleForSync = null) {
  const currentRadarErrorDisplay = document.getElementById("radarErrorMessage");
  if (currentRadarErrorDisplay) currentRadarErrorDisplay.textContent = "";
  if (!bigFiveData) {
    if (characterProfileTitle) characterProfileTitle.textContent = "Select a character to view their profile";
    if (bigFiveRadarChart) { bigFiveRadarChart.destroy(); bigFiveRadarChart = null; }
    currentlySyncedMovieTitle = null;
    if (umapKmeansScatterChart) highlightPointInScatterPlot(null);
    return;
  }
  if (movieTitleForSync) currentlySyncedMovieTitle = movieTitleForSync;
  const bigFiveLabels = Object.keys(bigFiveData);
  const bigFiveScores = bigFiveLabels.map((trait) => bigFiveData[trait].score);
  if (!bigFiveRadarChartCanvas) {
      if (currentRadarErrorDisplay) currentRadarErrorDisplay.textContent = "Radar chart canvas not found.";
      return;
  }
  const ctx = bigFiveRadarChartCanvas.getContext("2d");
  if (bigFiveRadarChart) bigFiveRadarChart.destroy();
  if (characterProfileTitle) characterProfileTitle.textContent = `${characterName}'s Personality Profile`;
  const radarChartUserConfig = chartConfig.radarChart || {};
  const tooltipUserConfig = radarChartUserConfig.tooltip || {};
  const defaultTooltipOptions = {
    enabled: true, backgroundColor: "#2c313a", borderColor: "#434343", borderWidth: 1,
    titleColor: "#dedede", bodyColor: "#abb2bf", padding: 12, cornerRadius: 6,
    titleFont: { family: "'Roboto', sans-serif", weight: "bold", size: 14 },
    bodyFont: { family: "'Roboto', sans-serif", size: 12 }, displayColors: false,
    caretPadding: tooltipUserConfig.caretPadding || 8,
    callbacks: {
      label: function(tooltipItem) {
        const traitName = tooltipItem.label;
        const traitDataForCurrentPoint = bigFiveData[traitName];
        if (traitDataForCurrentPoint) {
          const scoreLine = `Score: ${traitDataForCurrentPoint.score.toFixed(1)}`;
          const explanationText = traitDataForCurrentPoint.explanation && String(traitDataForCurrentPoint.explanation).trim() !== "" ? String(traitDataForCurrentPoint.explanation) : "No explanation provided.";
          const explanationOutputLines = [];
          const maxLineLength = 55;
          if (explanationText !== "No explanation provided." && explanationText.length > 0) {
              let currentLine = ""; const words = explanationText.split(' ');
              for (const word of words) {
                  if (currentLine.length > 0 && (currentLine + " " + word).length > maxLineLength) {
                      explanationOutputLines.push(currentLine.trim()); currentLine = word;
                  } else { currentLine = currentLine.length > 0 ? currentLine + " " + word : word; }
              }
              if (currentLine.trim().length > 0) explanationOutputLines.push(currentLine.trim());
          } else { explanationOutputLines.push(explanationText); }
          return [scoreLine, '', ...explanationOutputLines];
        }
        return `Score: ${tooltipItem.formattedValue}`;
      }
    }
  };
  const finalTooltipOptions = { ...defaultTooltipOptions, ...tooltipUserConfig, titleFont: { ...(defaultTooltipOptions.titleFont || {}), ...(tooltipUserConfig.titleFont || {}) }, bodyFont: { ...(defaultTooltipOptions.bodyFont || {}), ...(tooltipUserConfig.bodyFont || {}) }, callbacks: tooltipUserConfig.callbacks ? { ...(defaultTooltipOptions.callbacks || {}), ...tooltipUserConfig.callbacks } : (defaultTooltipOptions.callbacks || {}) };
  if (tooltipUserConfig.hasOwnProperty('enabled') && tooltipUserConfig.enabled === false) finalTooltipOptions.enabled = false;
  const positionMode = tooltipUserConfig.positionMode || 'default';
  if (positionMode === 'customNearPoint' && Chart.Tooltip.positioners.customNearPoint) {
      finalTooltipOptions.position = 'customNearPoint';
      finalTooltipOptions.xAlign = tooltipUserConfig.customXAlign || 'center';
      finalTooltipOptions.yAlign = tooltipUserConfig.customYAlign || 'bottom';
  } else { delete finalTooltipOptions.position; delete finalTooltipOptions.xAlign; delete finalTooltipOptions.yAlign; }
  if (tooltipUserConfig.hasOwnProperty('caretPadding')) finalTooltipOptions.caretPadding = tooltipUserConfig.caretPadding;
  bigFiveRadarChart = new Chart(ctx, { type: "radar", data: { labels: bigFiveLabels, datasets: [{ label: `${characterName}'s Big Five Traits`, data: bigFiveScores, backgroundColor: "rgba(97, 175, 239, 0.15)", borderColor: "#61afef", pointBackgroundColor: "#61afef", pointBorderColor: "#fff", pointHoverBackgroundColor: "#fff", pointHoverBorderColor: "#61afef", borderWidth: 3, }] }, options: { responsive: true, maintainAspectRatio: true, aspectRatio: 1.2, plugins: { legend: { display: true, position: "top", labels: { color: "#dedede", font: { size: 14 }, padding: 20, }, }, tooltip: finalTooltipOptions, }, scales: { r: { angleLines: { display: true, color: "rgba(128, 128, 128, 0.3)" }, grid: { color: "rgba(128, 128, 128, 0.3)" }, pointLabels: { font: { size: 13, weight: "500" }, color: "#dedede", padding: 8, }, min: 0, max: 5, ticks: { stepSize: 1, display: true, backdropColor: "rgba(44, 49, 58, 0.8)", color: "#abb2bf", font: { size: 10 }, z: 1, }, }, }, elements: { line: { borderWidth: 3 }, point: { radius: 6, hoverRadius: 8 }, }, }, });
  if (umapKmeansScatterChart && currentlySyncedMovieTitle) highlightPointInScatterPlot(currentlySyncedMovieTitle);
}

function populateMovieSelector() {
  if (!movieSelector) return;
  movieSelector.innerHTML = "<option disabled selected>Select a movie...</option>";
  const moviesWithProfiles = allMoviesData.filter(m => m.character_profile_big5 && m.character_list && m.character_list.length > 0);
  moviesWithProfiles.forEach((movie) => { const option = document.createElement("option"); option.value = movie.movie_title; option.textContent = movie.movie_title; movieSelector.appendChild(option); });
}

function updateRadarChartForSelectedMovie(isTriggeredByScatterClick = false) {
  if (!movieSelector) return;
  const selectedMovieTitle = movieSelector.value;
  if (!isTriggeredByScatterClick) {
      currentlySyncedMovieTitle = selectedMovieTitle;
      if (umapKmeansScatterChart) highlightPointInScatterPlot(selectedMovieTitle);
  }
  const selectedMovie = allMoviesData.find((movie) => movie.movie_title === selectedMovieTitle);
  if (selectedMovie) { const mainCharacterName = selectedMovie.character_list[0]?.name || selectedMovie.movie_title; const mainCharacterBig5Profile = selectedMovie.character_profile_big5; drawBigFiveRadarChart(mainCharacterName, mainCharacterBig5Profile, selectedMovieTitle); }
  else { drawBigFiveRadarChart(null, null); }
}

function highlightPointInScatterPlot(movieTitleToHighlight) {
    if (!umapKmeansScatterChart || !umapKmeansScatterChart.data.datasets) return;
    const pointCfg = chartConfig.clusterChart?.point || {};
    const baseRadius = pointCfg.radius || 8; const highlightRadius = baseRadius + 4;
    const baseBorderWidth = pointCfg.borderWidth || 2; const highlightBorderWidth = baseBorderWidth + 2;
    const highlightBorderColor = pointCfg.highlightBorderColor || "#FFFFFF";
    let found = false;
    umapKmeansScatterChart.data.datasets.forEach(dataset => {
        dataset.pointRadius = dataset.data.map(point => point.movieTitle === movieTitleToHighlight ? (found = true, highlightRadius) : baseRadius);
        dataset.pointBorderWidth = dataset.data.map(point => point.movieTitle === movieTitleToHighlight ? highlightBorderWidth : baseBorderWidth);
        dataset.pointBorderColor = dataset.data.map(point => { const originalBorderColor = dataset.backgroundColor ? Chart.helpers.color(dataset.backgroundColor).alpha(0.8).rgbString() : "rgba(255,255,255,0.7)"; return point.movieTitle === movieTitleToHighlight ? highlightBorderColor : (pointCfg.borderColor || originalBorderColor); });
    });
    if (found || movieTitleToHighlight === null) umapKmeansScatterChart.update('none');
}

function getDescriptiveClusterName(clusterAverageScores, selectedTraits, globalAverageScores) {
    const DEVIATION_THRESHOLD = 0.4;
    const descriptors = chartConfig.clusterNameDescriptors || {
        Openness: { high: "Open", low: "Settled" }, Conscientiousness: { high: "Diligent", low: "Flexible" },
        Extraversion: { high: "Extrovert", low: "Introvert" }, Agreeableness: { high: "Agreeable", low: "Lone Wolf" },
        Neuroticism: { high: "Neurotic", low: "Composed" }
    };

    let processedTraits = selectedTraits.map(trait => {
        const clusterScore = clusterAverageScores[trait];
        const globalScore = globalAverageScores[trait];
        const deviationFromGlobal = clusterScore - globalScore;

        let descriptorText = '';
        if (deviationFromGlobal > DEVIATION_THRESHOLD) {
            descriptorText = descriptors[trait]?.high || trait;
        } else if (deviationFromGlobal < -DEVIATION_THRESHOLD) {
            descriptorText = descriptors[trait]?.low || trait;
        }

        return { descriptorText, deviation: Math.abs(deviationFromGlobal) };
    });

    let nameParts = processedTraits.filter(t => t.descriptorText).sort((a, b) => b.deviation - a.deviation).map(t => t.descriptorText);
    if (nameParts.length === 0) return "Balanced Profile";
    return nameParts.join(" & ");
}

const externalTooltipHandler = (context) => {
    const { chart, tooltip } = context; const customHtmlCfg = chartConfig.customHtmlTooltip || {};
    const tooltipElId = customHtmlCfg.containerId || 'chartjs-custom-tooltip';
    let tooltipEl = document.getElementById(tooltipElId);
    if (!tooltipEl) {
        tooltipEl = document.createElement('div'); tooltipEl.id = tooltipElId;
        tooltipEl.className = customHtmlCfg.tooltipBaseClass || '';
        document.body.appendChild(tooltipEl);
        tooltipEl.style.position = 'absolute'; tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.transition = 'opacity 0.1s ease-in-out';
    }
    if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; tooltipEl.classList.remove('tooltip-visible'); return; }
    if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
        const pointData = tooltip.dataPoints[0].raw;
        const movieTitle = pointData?.movieTitle || "Unknown Movie";
        const characterName = pointData?.name || "Unknown Character";
        let innerHtml = `<div class="${customHtmlCfg.titleClass || 'tooltip-header'}">`;
        innerHtml += `<span class="${customHtmlCfg.movieTitleClass || 'movie-title'}">${movieTitle}</span>`;
        innerHtml += `<span class="${customHtmlCfg.characterNameClass || 'character-name'}">${characterName}</span></div>`;
        innerHtml += `<div class="${customHtmlCfg.bodyClass || 'tooltip-body-content'}">`;
        if (pointData?.fullBig5) {
            const scoreColorConfig = chartConfig.customHtmlTooltip?.scoreColors || {};
            const lowThreshold = scoreColorConfig.lowThreshold !== undefined ? scoreColorConfig.lowThreshold : 2.0;
            const highThreshold = scoreColorConfig.highThreshold !== undefined ? scoreColorConfig.highThreshold : 4.0;
            const lowColor = scoreColorConfig.lowColor || "#e06c75"; const midColor = scoreColorConfig.midColor || "#e5c07b"; const highColor = scoreColorConfig.highColor || "#98c379";
            Object.entries(pointData.fullBig5).forEach(([trait, data]) => {
                const scoreValue = data?.score; const scoreDisplay = scoreValue !== undefined ? scoreValue.toFixed(1) : "N/A";
                let scoreColor = midColor;
                if (scoreValue !== undefined) { if (scoreValue <= lowThreshold) scoreColor = lowColor; else if (scoreValue >= highThreshold) scoreColor = highColor; }
                innerHtml += `<div class="${customHtmlCfg.bigFiveItemClass || 'big5-item'}"><span class="${customHtmlCfg.traitNameClass || 'trait-name'}">${trait}:</span><span class="${customHtmlCfg.traitScoreClass || 'trait-score'}" style="color: ${scoreColor};">${scoreDisplay}</span></div>`;
            });
        }
        innerHtml += '</div>'; tooltipEl.innerHTML = innerHtml;
    }
    tooltipEl.style.opacity = 1; tooltipEl.classList.add('tooltip-visible');
    const canvasRect = chart.canvas.getBoundingClientRect();
    const tooltipWidth = tooltipEl.offsetWidth; const tooltipHeight = tooltipEl.offsetHeight;
    const pointXInCanvas = tooltip.caretX; const pointYInCanvas = tooltip.caretY;
    const Y_OFFSET = 10; const X_OFFSET = 15; const EDGE_PADDING = 10;
    let desiredLeft = canvasRect.left + window.scrollX + pointXInCanvas + X_OFFSET;
    let desiredTop = canvasRect.top + window.scrollY + pointYInCanvas + Y_OFFSET;
    if ((desiredLeft - window.scrollX) + tooltipWidth > window.innerWidth - EDGE_PADDING) desiredLeft = canvasRect.left + window.scrollX + pointXInCanvas - tooltipWidth - X_OFFSET;
    if (desiredLeft < window.scrollX + EDGE_PADDING) desiredLeft = window.scrollX + EDGE_PADDING;
    if ((desiredTop - window.scrollY) + tooltipHeight > window.innerHeight - EDGE_PADDING) desiredTop = canvasRect.top + window.scrollY + pointYInCanvas - tooltipHeight - Y_OFFSET;
    if (desiredTop < window.scrollY + EDGE_PADDING) desiredTop = window.scrollY + EDGE_PADDING;
    tooltipEl.style.left = desiredLeft + 'px'; tooltipEl.style.top = desiredTop + 'px';
};

function drawUmapKmeansPlot() {
    const currentScatterErrorDisplay = document.getElementById("scatterErrorMessage");
    if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Computing personality clusters...";
    const globalProfileContainer = document.getElementById('globalProfileContainer');
    if (globalProfileContainer) globalProfileContainer.innerHTML = '';
    if (!allMainCharactersBig5ForClustering || allMainCharactersBig5ForClustering.length < 3 || typeof UMAP === "undefined" || typeof kMeans === "undefined" || !umapKmeansScatterChartCanvas) {
        if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Error: Core components not ready for clustering.";
        return;
    }
    if (selectedTraitsForClustering.length === 0) {
        if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "Please select at least one trait to cluster by.";
        if (umapKmeansScatterChart) { umapKmeansScatterChart.destroy(); umapKmeansScatterChart = null; }
        return;
    }

    const dataVectors = allMainCharactersBig5ForClustering.map(c => selectedTraitsForClustering.map(trait => c.fullBig5[trait]?.score || 0));
    const nNeighbors = Math.min(15, Math.max(2, Math.floor(dataVectors.length / 3)));
    const umapInstance = new UMAP({ nNeighbors, minDist: 0.1, nComponents: 2, spread: 1.0 });
    let umapEmbeddings; try { umapEmbeddings = umapInstance.fit(dataVectors); } catch (e) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = `UMAP Error: ${e.message}`; return; }
    if (!umapEmbeddings || umapEmbeddings.length === 0) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = "UMAP failed to produce embeddings."; return; }

    const kValue = Math.min(Number.parseInt(kSelector.value, 10) || 3, Math.max(2, Math.floor(umapEmbeddings.length / 2)), 5);
    kSelector.value = kValue;
    let clusterAssignments;
    try {
        const km = new kMeans({ K: kValue }); km.autoCluster(umapEmbeddings);
        clusterAssignments = Array(umapEmbeddings.length).fill(0);
        km.clusters.forEach((clusterIndices, clusterId) => clusterIndices.forEach(pointIndex => { if (pointIndex < clusterAssignments.length) clusterAssignments[pointIndex] = clusterId; }));
    } catch (e) { if (currentScatterErrorDisplay) currentScatterErrorDisplay.textContent = `kMeans Error: ${e.message}`; return; }

    const clusteredPoints = umapEmbeddings.map((coord, i) => ({ x: coord[0], y: coord[1], name: allMainCharactersBig5ForClustering[i]?.name || `Character ${i + 1}`, fullBig5: allMainCharactersBig5ForClustering[i]?.fullBig5 || {}, cluster: clusterAssignments[i] || 0, movieTitle: allMainCharactersBig5ForClustering[i]?.movieTitle || "Unknown Movie" }));

    const nameGenCfg = chartConfig.clusterNameGeneration || {};
    const globalHighThreshold = nameGenCfg.globalHighThreshold !== undefined ? nameGenCfg.globalHighThreshold : 3.6;
    const globalLowThreshold = nameGenCfg.globalLowThreshold !== undefined ? nameGenCfg.globalLowThreshold : 2.4;
    const globalTraitAverages = {};
    const globalTraitSums = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };
    const globalTraitCounts = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };
    allMainCharactersBig5ForClustering.forEach(charData => { Object.entries(charData.fullBig5).forEach(([trait, data]) => { if (data && typeof data.score === 'number' && globalTraitSums.hasOwnProperty(trait)) { globalTraitSums[trait] += data.score; globalTraitCounts[trait]++; } }); });
    Object.keys(globalTraitSums).forEach(trait => { globalTraitAverages[trait] = (globalTraitCounts[trait] > 0) ? globalTraitSums[trait] / globalTraitCounts[trait] : 3.0; });

    const globalTraitProfile = {};
    Object.entries(globalTraitAverages).forEach(([trait, avgScore]) => {
        if (avgScore >= globalHighThreshold) globalTraitProfile[trait] = 'high';
        else if (avgScore <= globalLowThreshold) globalTraitProfile[trait] = 'low';
        else globalTraitProfile[trait] = 'mid';
    });

    if (globalProfileContainer) {
        let htmlContent = '<span class="profile-header">Global Dataset Profile (Click to Cluster)</span><div class="items-wrapper">';
        Object.keys(globalTraitAverages).forEach(trait => {
            const average = globalTraitAverages[trait].toFixed(2);
            const flag = globalTraitProfile[trait] || 'mid';
            const flagCapitalized = flag.charAt(0).toUpperCase() + flag.slice(1);
            const isActive = selectedTraitsForClustering.includes(trait);
            htmlContent += `<div class="profile-item ${isActive ? 'active' : ''}" data-trait="${trait}"><span class="trait-name">${trait}</span><span class="trait-average">${average}</span><span class="trait-flag flag-${flag}">${flagCapitalized}</span></div>`;
        });
        htmlContent += '</div>';
        globalProfileContainer.innerHTML = htmlContent;
        globalProfileContainer.querySelectorAll('.profile-item').forEach(button => {
            button.addEventListener('click', () => {
                const trait = button.dataset.trait;
                const currentlyActive = button.classList.contains('active');
                if (currentlyActive && globalProfileContainer.querySelectorAll('.profile-item.active').length === 1) return;
                button.classList.toggle('active');
                selectedTraitsForClustering = Array.from(globalProfileContainer.querySelectorAll('.profile-item.active')).map(btn => btn.dataset.trait);
                drawUmapKmeansPlot();
            });
        });
    }

    const clusterColors = ["#61afef", "#e06c75", "#98c379", "#e5c07b", "#c678dd", "#56b6c2", "#d19a66", "#abb2bf"];
    const uniqueClusters = [...new Set(clusterAssignments)].sort((a, b) => a - b);
    const pointCfg = chartConfig.clusterChart?.point || {};

    const clusterAverages = uniqueClusters.map(clusterId => {
        const pointsInCluster = clusteredPoints.filter(p => p.cluster === clusterId);
        const avgScores = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };
        if (pointsInCluster.length > 0) {
            const validPoints = pointsInCluster.filter(p => p.fullBig5 && Object.keys(p.fullBig5).length === 5);
            if (validPoints.length > 0) {
                Object.keys(avgScores).forEach(traitKey => {
                    avgScores[traitKey] = validPoints.reduce((sum, p) => sum + p.fullBig5[traitKey].score, 0) / validPoints.length;
                });
            }
        }
        return { clusterId, avgScores };
    });

    // *** MASTER NAMING LOGIC ***
    let clusterIdToNameMap = {};

    // Path 1: User selected multiple traits for clustering
    if (selectedTraitsForClustering.length > 1) {
        clusterAverages.forEach(ca => {
            // I made a mistake here before. The function name was wrong. It is now correct.
            clusterIdToNameMap[ca.clusterId] = getDescriptiveClusterName(ca.avgScores, selectedTraitsForClustering, globalTraitAverages);
        });
    }
    // Path 2: User selected only ONE trait
    else if (selectedTraitsForClustering.length === 1) {
        const trait = selectedTraitsForClustering[0];
        const descriptors = chartConfig.clusterNameDescriptors || {};
        const highDesc = descriptors[trait]?.high || trait;
        const lowDesc = descriptors[trait]?.low || `Low ${trait}`;
        const midDesc = `Mid-Range`;

        const sortedClusters = clusterAverages.slice().sort((a, b) => a.avgScores[trait] - b.avgScores[trait]);

        // This logic now robustly handles all k values from 2 to 5 for 1D
        if (kValue === 2) {
            clusterIdToNameMap[sortedClusters[0].clusterId] = lowDesc;
            clusterIdToNameMap[sortedClusters[1].clusterId] = highDesc;
        } else if (kValue === 3) {
            clusterIdToNameMap[sortedClusters[0].clusterId] = lowDesc;
            clusterIdToNameMap[sortedClusters[1].clusterId] = midDesc;
            clusterIdToNameMap[sortedClusters[2].clusterId] = highDesc;
        } else if (kValue === 4) {
             clusterIdToNameMap[sortedClusters[0].clusterId] = lowDesc;
             clusterIdToNameMap[sortedClusters[1].clusterId] = `Low-Mid`;
             clusterIdToNameMap[sortedClusters[2].clusterId] = `High-Mid`;
             clusterIdToNameMap[sortedClusters[3].clusterId] = highDesc;
        } else if (kValue === 5) {
             clusterIdToNameMap[sortedClusters[0].clusterId] = lowDesc;
             clusterIdToNameMap[sortedClusters[1].clusterId] = `Low-Mid`;
             clusterIdToNameMap[sortedClusters[2].clusterId] = midDesc;
             clusterIdToNameMap[sortedClusters[3].clusterId] = `High-Mid`;
             clusterIdToNameMap[sortedClusters[4].clusterId] = highDesc;
        }
    }

    const groupedDatasets = uniqueClusters.map((clusterId) => {
        const pointsInCluster = clusteredPoints.filter(p => p.cluster === clusterId);
        return {
            label: clusterIdToNameMap[clusterId] || `Cluster ${clusterId + 1}`,
            data: pointsInCluster,
            backgroundColor: clusterColors[clusterId % clusterColors.length],
            borderColor: pointCfg.borderColor || "rgba(255,255,255,0.8)",
            borderWidth: pointCfg.borderWidth || 2,
            pointHoverRadius: pointCfg.hoverRadius || 12,
            pointHoverBorderWidth: pointCfg.hoverBorderWidth || 3,
        };
    });

    if (umapKmeansScatterChart) umapKmeansScatterChart.destroy();
    const ctx = umapKmeansScatterChartCanvas.getContext("2d");
    const defaultTooltipCfg = chartConfig.tooltip || {}; const customHtmlTooltipCfg = chartConfig.customHtmlTooltip || {};
    const legendCfg = chartConfig.clusterChart?.legend || {}; const axesCfg = chartConfig.clusterChart?.axes || { x: {}, y: {} };
    const useCustomHtml = customHtmlTooltipCfg.enabled === true;
    let finalTooltipOptions = { enabled: !useCustomHtml, backgroundColor: "#2c313a", borderColor: "#434343", borderWidth: 1, titleColor: "#dedede", bodyColor: "#abb2bf", titleFont: { weight: "bold", size: 13 }, bodyFont: { size: 11 }, padding: 12, cornerRadius: 6, displayColors: false, caretSize: 5, caretPadding: 2, titleMarginBottom: 6, callbacks: { title: (items) => { if (!items.length) return ""; const data = items[0].raw; return [data?.movieTitle || "Unknown Movie", data?.name || "Unknown Character"]; }, label: (item) => { const d = item.raw; const lines = []; if (d.fullBig5) Object.entries(d.fullBig5).forEach(([t, v]) => lines.push(`${t}: ${v?.score?.toFixed(1) || "N/A"}`)); return lines; }, }, };
    if (useCustomHtml) { finalTooltipOptions.enabled = false; finalTooltipOptions.external = externalTooltipHandler; }

    umapKmeansScatterChart = new Chart(ctx, { type: "scatter", data: { datasets: groupedDatasets }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "nearest", intersect: true, }, plugins: { legend: { display: legendCfg.display !== undefined ? legendCfg.display : true, position: legendCfg.position || "top", labels: { color: "#dedede", font: { size: 12 }, padding: 15, usePointStyle: true, pointStyle: "circle", generateLabels: (chart) => { const datasets = chart.data.datasets; const pointConfig = chartConfig.clusterChart?.point || {}; const defaultBorderColor = pointConfig.borderColor || "rgba(255,255,255,0.8)"; const defaultBorderWidth = pointConfig.borderWidth || 2; return datasets.map((dataset, i) => ({ text: dataset.label, fillStyle: dataset.backgroundColor, strokeStyle: defaultBorderColor, lineWidth: defaultBorderWidth, hidden: !chart.isDatasetVisible(i), datasetIndex: i, })); } }, }, tooltip: finalTooltipOptions, }, scales: { x: { title: { display: true, text: "UMAP Dimension 1", color: "#dedede", font: { size: 13, weight: "500" }, }, ticks: { color: "#abb2bf", font: { size: 11 } }, grid: { color: "rgba(128, 128, 128, 0.2)", drawBorder: false }, }, y: { title: { display: true, text: "UMAP Dimension 2", color: "#dedede", font: { size: 13, weight: "500" }, }, ticks: { color: "#abb2bf", font: { size: 11 } }, grid: { color: "rgba(128, 128, 128, 0.2)", drawBorder: false }, }, }, onClick: (event, elements) => { if (elements.length > 0) { const { datasetIndex, index } = elements[0]; const clickedPointData = umapKmeansScatterChart.data.datasets[datasetIndex].data[index]; if (clickedPointData && clickedPointData.movieTitle) { currentlySyncedMovieTitle = clickedPointData.movieTitle; if (movieSelector) movieSelector.value = clickedPointData.movieTitle; updateRadarChartForSelectedMovie(true); highlightPointInScatterPlot(clickedPointData.movieTitle); } } } }, });
    if (currentlySyncedMovieTitle) highlightPointInScatterPlot(currentlySyncedMovieTitle);
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
        console.error("CRITICAL: One or more essential DOM elements are missing!");
        const msg = "Error: Essential page elements missing. App cannot start.";
        if (radarErrorMessageDisplay) radarErrorMessageDisplay.textContent = msg;
        if (scatterErrorMessageDisplay) scatterErrorMessageDisplay.textContent = msg;
        alert(msg); return;
    }

    kSelector.addEventListener("change", () => { if (allMainCharactersBig5ForClustering.length > 0) drawUmapKmeansPlot(); });
    movieSelector.addEventListener("change", () => updateRadarChartForSelectedMovie(false));

    try {
        scatterErrorMessageDisplay.textContent = "Loading configuration and data...";
        try {
            const configRes = await fetch("config.yaml");
            if (!configRes.ok) throw new Error(`Config file load failed: ${configRes.statusText}`);
            const configYamlText = await configRes.text();
            chartConfig = jsyaml.load(configYamlText) || {};
        } catch (configError) {
            console.error("Error loading or parsing config.yaml:", configError);
            chartConfig = {};
        }

        const res = await fetch("clean_movie_database.yaml");
        if (!res.ok) throw new Error(`Movie database load failed: ${res.statusText}`);
        const yamlText = await res.text();
        allMoviesData = jsyaml.load(yamlText) || [];
        if (allMoviesData.length === 0) throw new Error("No movie data found.");

        populateMovieSelector();

        allMainCharactersBig5ForClustering = allMoviesData.filter(m => m.character_profile_big5 && Object.keys(m.character_profile_big5).length === 5 && m.character_list && m.character_list.length > 0).map(m => ({
            name: m.character_list[0]?.name || m.movie_title,
            fullBig5: m.character_profile_big5,
            movieTitle: m.movie_title
        }));

        const firstValidMovieForRadar = allMoviesData.find(m => m.character_profile_big5 && Object.keys(m.character_profile_big5).length > 0 && m.character_list && m.character_list.length > 0);
        if (firstValidMovieForRadar) {
            if (movieSelector) movieSelector.value = firstValidMovieForRadar.movie_title;
            updateRadarChartForSelectedMovie(false);
        } else {
            if (characterProfileTitle) characterProfileTitle.textContent = "No movie profiles available.";
        }

        if (allMainCharactersBig5ForClustering.length > 0) {
            drawUmapKmeansPlot();
        } else if (scatterErrorMessageDisplay) {
            scatterErrorMessageDisplay.textContent = "No characters with complete Big Five profiles for clustering.";
        }

    } catch (error) {
        console.error(`Initialization Error: ${error.message}`);
        const errorMsg = `Initialization Error: ${error.message}`;
        if (radarErrorMessageDisplay) radarErrorMessageDisplay.textContent = errorMsg;
        if (scatterErrorMessageDisplay) scatterErrorMessageDisplay.textContent = errorMsg;
    }
};