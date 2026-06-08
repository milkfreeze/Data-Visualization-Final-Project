// Define chart scales
const chartDiv = document.getElementById("chart");
const width = chartDiv.clientWidth;
const height = window.innerHeight;
const projectMeta = document.getElementById("project-meta");
const gameSearchInput = document.getElementById("game-search");
const gameSearchButton = document.getElementById("game-search-button");
const gameSearchClear = document.getElementById("game-search-clear");
const gameSearchStatus = document.getElementById("game-search-status");
const angleDistStatus = document.getElementById("angle-dist-status");

// Define centre of the canvas
const centreX = width / 2;
const centreY = height / 2;

// Meta tags to exclude when determining primary genre
const metaTags = ["Indie", "Early Access", "Free To Play"];


// Define canvas
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define int attributes
const intAttributes = new Set([
    "releaseYear", "Peak CCU", "Metacritic score", "User score",
    "Positive", "Negative", "Score rank", "Achievements",
    "Recommendations", "Average playtime forever", "Average playtime two weeks",
    "Median playtime forever", "Median playtime two weeks"
]);

const snapIntAttributes = new Set([
    "releaseYear", "Metacritic score", "User score"
]);

// Font size of price labels
const PRICE_LABEL_FONT_SIZE = 15;

// Define angle view's starting angle
const ANGLE_OFFSET = -Math.PI / 2;

// Adding sparks at the background
const bgStars = svg.append("g").attr("class", "bg-stars");
const numBg = 500;
for (let i = 0; i < numBg; i++) {
    bgStars.append("circle")
        .attr("cx", Math.random() * width)
        .attr("cy", Math.random() * height)
        .attr("r", Math.random() * 1.2 + 0.2)
        .attr("fill", "white")
        .attr("opacity", Math.random() * 0.6 + 0.15);
}

// Zooming behavior
const g = svg.append("g");


// Decorating stars
const defs = svg.append("defs");
const glowFilter = defs.append("filter")
    .attr("id", "star-glow")
    .attr("x", "-60%").attr("y", "-60%")
    .attr("width", "220%").attr("height", "220%");

glowFilter.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 1.8)
    .attr("result", "blur");

const feMerge = glowFilter.append("feMerge");
feMerge.append("feMergeNode").attr("in", "blur");
feMerge.append("feMergeNode").attr("in", "SourceGraphic");


// Star size explanation
const sizeSection = d3.select("#sidebar").append("section");
const sizeLegendTitle = sizeSection.append("h3").text("Star Size:").append("h4").text("Positive Reviews");

const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
        const k = event.transform.k;

        g.selectAll(".price-line")
            .attr("stroke-width", 1 / k);

        g.selectAll(".price-label")
            .attr("font-size", `${PRICE_LABEL_FONT_SIZE / k}px`)

        // Hide guidelines while zooming
        guideLine.style("display", "none");
        guideLabel.style("display", "none");
    });

// Add attribute guidelines
svg.call(zoom);

const guideLine = svg.append("line")
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4")
    .style("display", "none")
    .style("pointer-events", "none");

const guideLabel = svg.append("text")
    .attr("fill", "gray")
    .attr("font-size", "12px")
    .style("display", "none")
    .style("pointer-events", "none");


// Loading data file
// d3.csv("data/steam_game_data_clean.csv").then(function (data) {
d3.csv("data/steam_game_data_clean.csv").then(function (data) {

    // Data preprocessing
    data.forEach(d => {
        d.Price = +d.Price;
        d.Positive = +d.Positive;

        const genres = d.Genres ? d.Genres.split(",").map(g => g.trim()) : [];
        const filtered = genres.filter(g => !metaTags.includes(g));
        d.primaryGenre = filtered.length > 0 ? filtered[0] : (genres[0] || "Unknown");

        // Define star angles
        d.angle = Math.random() * 2 * Math.PI;
        d.releaseYear = new Date(d["Release date"]).getFullYear();
        d.releaseDate = new Date(d["Release date"]).getTime();
        d["Peak CCU"] = +d["Peak CCU"];
        d["Metacritic score"] = +d["Metacritic score"];
        d["User score"] = +d["User score"];
        d["Negative"] = +d["Negative"];
        d["Score rank"] = +d["Score rank"];
        d["Achievements"] = +d["Achievements"];
        d["Recommendations"] = +d["Recommendations"];
        d["Average playtime forever"] = +d["Average playtime forever"];
        d["Average playtime two weeks"] = +d["Average playtime two weeks"];
        d["Median playtime forever"] = +d["Median playtime forever"];
        d["Median playtime two weeks"] = +d["Median playtime two weeks"];

    });

    const skewedAttrs = new Set([
        "Positive", "Negative", "Recommendations", "Peak CCU",
        "Average playtime forever", "Average playtime two weeks",
        "Median playtime forever", "Median playtime two weeks"
    ]);

    const genreCount = new Set(data.map(d => d.primaryGenre)).size;
    if (projectMeta) {
        projectMeta.innerHTML = `
            <div class="meta-card">
                <span class="meta-label">Games</span>
                <strong class="meta-value">${data.length.toLocaleString()}</strong>
            </div>
            <div class="meta-card">
                <span class="meta-label">Genres</span>
                <strong class="meta-value">${genreCount}</strong>
            </div>
            <div class="meta-card">
                <span class="meta-label">Mode</span>
                <strong class="meta-value">Interactive</strong>
            </div>
        `;
    }

    // Function for filter
    function createRangeFilter(parentSel, label, minVal, maxVal, step, fmt, onChange) {
        parentSel.append("h4").text(label);

        const display = parentSel.append("div").attr("class", "range-display");
        const minSpan = display.append("span").text(fmt(minVal));
        const maxSpan = display.append("span").text(fmt(maxVal));

        const container = parentSel.append("div").attr("class", "double-slider-container");

        const minInput = container.append("input")
            .attr("type", "range")
            .attr("min", minVal).attr("max", maxVal)
            .attr("step", step).attr("value", minVal);

        const maxInput = container.append("input")
            .attr("type", "range")
            .attr("min", minVal).attr("max", maxVal)
            .attr("step", step).attr("value", maxVal);

        function update() {
            let lo = +minInput.node().value;
            let hi = +maxInput.node().value;
            if (lo > hi) { [lo, hi] = [hi, lo]; }
            minSpan.text(fmt(lo));
            maxSpan.text(fmt(hi));
            onChange(lo, hi);
        }

        minInput.on("input", update);
        maxInput.on("input", update);
    }

    const attrValueSets = {};
    intAttributes.forEach(attr => {
        attrValueSets[attr] = new Set(
            data.map(d => d[attr]).filter(v => isFinite(v))
        );
    });

    const attrSortedValues = {};
    skewedAttrs.forEach(attr => {
        attrSortedValues[attr] = data
            .map(d => d[attr])
            .filter(v => isFinite(v))
            .sort((a, b) => a - b);
    });

    // Tracking for current angle attribute
    let currentAngleAttr = "random";
    let currentAngleDist = "linear";
    let highlightedAppId = null;
    let activeRadialScale = null;


    // Radial scale (inside .then() because maxPrice needs data)
    const maxPrice = d3.max(data, d => d.Price);
    const maxRadius = Math.min(width, height) / 2 - 40;
    const scales = {
        linear: d3.scaleLinear()
            .domain([0, maxPrice])
            .range([0, maxRadius]),

        sqrt: d3.scaleSqrt()
            .domain([0, maxPrice])
            .range([0, maxRadius]),

        log: d3.scaleLog()
            .domain([0.01, maxPrice])
            .range([0, maxRadius])
    };

    activeRadialScale = scales.log;
    let radialScale = scales.linear;
    // Price lines：round up maxPrice to nearest 50, divide into 5 lines
    const nLines = 5;
    const niceMax = Math.ceil(maxPrice / 50) * 50;
    const priceInterval = niceMax / nLines;
    const priceLineValues = d3.range(priceInterval, niceMax + priceInterval, priceInterval);

    // Define color scale for genres
    const genres = [...new Set(data.map(d => d.primaryGenre))];
    const colorRange = d3.quantize(d3.interpolateSinebow, genres.length);
    const colorScale = d3.scaleOrdinal(colorRange).domain(genres);

    // Define size of stars based on positive comments
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.Positive)])
        .range([1, 8]);

    // Draw price lines and labels
    function drawPriceLines(scale) {
        g.selectAll(".price-line").remove();
        g.selectAll(".price-label").remove();

        // Price lines
        g.selectAll(".price-line")
            .data(priceLineValues)
            .enter()
            .append("circle")
            .attr("class", "price-line")
            .attr("cx", centreX)
            .attr("cy", centreY)
            .attr("r", d => scale(d))
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4,4")
            .attr("stroke-opacity", 0.5);

        // Price labels
        g.selectAll(".price-label")
            .data(priceLineValues)
            .enter()
            .append("text")
            .attr("class", "price-label")
            .attr("x", d => centreX + scale(d) * Math.cos(-Math.PI / 2))
            .attr("y", d => centreY + scale(d) * Math.sin(-Math.PI / 2) - 4)
            .attr("text-anchor", "middle")
            .attr("fill", "gray")
            .attr("font-size", `${PRICE_LABEL_FONT_SIZE}px`)
            .text(d => `$${d}`);
    }

    // Define angle of data
    function getAngleScale(attr) {
        if (attr === "random") return null;
        const values = data.map(d => d[attr]).filter(v => isFinite(v) && v !== null);
        const uniqueCount = new Set(values).size;
        const range = [0, 2 * Math.PI * (uniqueCount - 1) / uniqueCount];

        if (currentAngleDist === "sqrt") {
            return d3.scaleSqrt()
                .domain([0, d3.max(values)])
                .range(range);
        }
        return d3.scaleLinear()
            .domain([d3.min(values), d3.max(values)])
            .range(range);
    }

    const filterState = {
        genres: new Set(genres),
        price: { min: 0, max: maxPrice },
        year: { min: d3.min(data, d => d.releaseYear), max: d3.max(data, d => d.releaseYear) },
        ccu: { min: 0, max: d3.max(data, d => d["Peak CCU"]) },
        meta: { min: 0, max: 100 },
        pos: { min: 0, max: d3.max(data, d => d.Positive) },
        neg: { min: 0, max: d3.max(data, d => d["Negative"]) },
        rec: { min: 0, max: d3.max(data, d => d["Recommendations"]) }
    };

    function passesFilters(d) {
        return filterState.genres.has(d.primaryGenre)
            && d.Price >= filterState.price.min && d.Price <= filterState.price.max
            && d.releaseYear >= filterState.year.min && d.releaseYear <= filterState.year.max
            && d["Peak CCU"] >= filterState.ccu.min && d["Peak CCU"] <= filterState.ccu.max
            && d["Metacritic score"] >= filterState.meta.min && d["Metacritic score"] <= filterState.meta.max
            && d.Positive >= filterState.pos.min && d.Positive <= filterState.pos.max
            && d["Negative"] >= filterState.neg.min && d["Negative"] <= filterState.neg.max
            && d["Recommendations"] >= filterState.rec.min && d["Recommendations"] <= filterState.rec.max;
    }

    function applyFilters() {
        g.selectAll(".star")
            .style("display", d => {
                const isHighlighted = highlightedAppId !== null && d.AppID === highlightedAppId;
                return passesFilters(d) || isHighlighted ? null : "none";
            });
    }

    function setSearchStatus(message, type = "") {
        if (!gameSearchStatus) return;
        gameSearchStatus.textContent = message;
        gameSearchStatus.className = `search-status ${type}`.trim();
    }

    function clearHighlightedGame() {
        highlightedAppId = null;
        g.selectAll(".star.search-highlight")
            .classed("search-highlight", false)
            .attr("stroke", null)
            .attr("stroke-width", null);
        applyFilters();
        setSearchStatus("Highlight cleared.");
    }

    function panToGame(d, radialScale) {
        const starX = centreX + radialScale(Math.max(d.Price, 0.01)) * Math.cos(d.currentAngle + ANGLE_OFFSET);
        const starY = centreY + radialScale(Math.max(d.Price, 0.01)) * Math.sin(d.currentAngle + ANGLE_OFFSET);
        const currentTransform = d3.zoomTransform(svg.node());
        const k = Math.max(currentTransform.k, 1.6);

        svg.transition().duration(650)
            .call(zoom.transform, d3.zoomIdentity
                .translate(width / 2 - k * starX, height / 2 - k * starY)
                .scale(k));
    }

    function highlightGame(d, shouldPan = true) {
        highlightedAppId = d.AppID;

        g.selectAll(".star.search-highlight")
            .classed("search-highlight", false)
            .attr("stroke", null)
            .attr("stroke-width", null);

        const selected = g.selectAll(".star")
            .filter(star => star.AppID === highlightedAppId)
            .style("display", null)
            .classed("search-highlight", true)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 3)
            .raise();

        if (!selected.empty() && shouldPan) {
            panToGame(d, activeRadialScale);
        }

        setSearchStatus(`Found: ${d.Name}`, "success");
    }

    function runGameSearch() {
        const query = gameSearchInput ? gameSearchInput.value.trim().toLowerCase() : "";
        if (!query) {
            clearHighlightedGame();
            return;
        }

        const exactMatch = data.find(d => d.Name && d.Name.toLowerCase() === query);
        const partialMatch = data.find(d => d.Name && d.Name.toLowerCase().includes(query));
        const match = exactMatch || partialMatch;

        if (!match) {
            setSearchStatus("No matching game found.", "error");
            return;
        }

        highlightGame(match);
    }

    function updateAngleDistributionState() {
        const isRandom = currentAngleAttr === "random";
        d3.selectAll("input[name='angle-dist']")
            .property("disabled", isRandom);

        if (angleDistStatus) {
            angleDistStatus.textContent = isRandom
                ? "Select an angle attribute to enable distribution controls."
                : "Controls how selected values are spread around the circle.";
            angleDistStatus.className = isRandom
                ? "control-hint muted"
                : "control-hint";
        }
    }

    function computeAngles(attr) {
        if (attr === "random") {
            data.forEach(d => { d.currentAngle = d.angle; });
            return;
        }

        if (currentAngleDist === "rank") {
            if (!attrSortedValues[attr]) {
                attrSortedValues[attr] = data
                    .map(d => d[attr])
                    .filter(v => isFinite(v))
                    .sort((a, b) => a - b);
            }
            const sorted = [...data]
                .filter(d => isFinite(d[attr]))
                .sort((a, b) => a[attr] - b[attr]);
            const n = sorted.length;
            sorted.forEach((d, rank) => {
                d.currentAngle = (rank / n) * 2 * Math.PI * (n - 1) / n;
            });
            data.filter(d => !isFinite(d[attr]))
                .forEach(d => { d.currentAngle = d.angle; });
        } else {
            const angleScale = getAngleScale(attr);
            data.forEach(d => {
                const val = d[attr];
                d.currentAngle = angleScale && isFinite(val) ? angleScale(val) : d.angle;
            });
        }
    }


    // Draw stars
    function drawStars(radialScale) {
        g.selectAll(".stars-group").remove();

        const starsGroup = g.append("g")
            .attr("class", "stars-group")
            .attr("filter", "url(#star-glow)");

        starsGroup.selectAll(".star")
            .data(data)
            .enter()
            .append("circle")
            .on("mouseover", function (event, d) {
                const skipInExtra = new Set(["random", "releaseDate", "releaseYear"]);
                const extraLine = !skipInExtra.has(currentAngleAttr)
                    ? `<br>${angleAttrLabels[currentAngleAttr]}: ${d[currentAngleAttr]}`
                    : "";

                d3.select("#metadata")
                    .style("display", "block")
                    .html(`
            <strong>${d.Name}</strong><br>
            Genre: ${d.Genres}<br>
            Release date: ${d["Release date"]}<br>
            Price: $${d.Price}<br>
            Positive: ${d.Positive}<br>
            Estimated owners: ${d["Estimated owners"]}<br>
            Developers: ${d.Developers}<br>
            Publishers: ${d.Publishers}<br>
            ${extraLine}
        `);
            })
            .on("mousemove", function (event) {
                d3.select("#metadata")
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                d3.select("#metadata")
                    .style("display", "none");
            })
            .on("click", function (event, d) {
                const starX = centreX + radialScale(Math.max(d.Price, 0.01)) * Math.cos(d.currentAngle + ANGLE_OFFSET);
                const starY = centreY + radialScale(Math.max(d.Price, 0.01)) * Math.sin(d.currentAngle + ANGLE_OFFSET);

                const k = d3.zoomTransform(svg.node()).k;
                svg.transition().duration(750)
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(width / 2 - k * starX, height / 2 - k * starY)
                        .scale(k));
            })
            .attr("class", "star")
            .attr("cx", d => centreX + radialScale(Math.max(d.Price, 0.01)) * Math.cos(d.currentAngle + ANGLE_OFFSET))
            .attr("cy", d => centreY + radialScale(Math.max(d.Price, 0.01)) * Math.sin(d.currentAngle + ANGLE_OFFSET))
            .attr("r", d => sizeScale(d.Positive))
            .attr("fill", d => colorScale(d.primaryGenre));

        if (highlightedAppId !== null) {
            const selectedDatum = data.find(d => d.AppID === highlightedAppId);
            if (selectedDatum) highlightGame(selectedDatum, false);
        }

        applyFilters();
    }

    // Star color legend
    const genreSection = d3.select("#sidebar").append("section");
    genreSection.append("h3").text("Genre");

    genreSection.selectAll(".legend-item")
        .data(genres)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .html(d => `
        <span class="legend-dot" style="background-color:${colorScale(d)}"></span>
        <span>${d}</span>
    `);


    // drawStars(scales.linear);
    // drawStars(scales.sqrt);

    // Label table
    const angleAttrLabels = {
        // "releaseYear": "Release Year",
        "releaseDate": "Release Date",
        "Peak CCU": "Peak CCU",
        "Metacritic score": "Metacritic Score",
        "User score": "User Score",
        "Positive": "Positive Reviews",
        "Negative": "Negative Reviews",
        "Score rank": "Score Rank",
        "Achievements": "Achievements",
        "Recommendations": "Recommendations",
        "Average playtime forever": "Avg Playtime (All Time)",
        "Average playtime two weeks": "Avg Playtime (2 Weeks)",
        "Median playtime forever": "Median Playtime (All Time)",
        "Median playtime two weeks": "Median Playtime (2 Weeks)"
    };

    computeAngles("random");
    updateAngleDistributionState();
    drawPriceLines(scales.log);
    drawStars(scales.log);
    const filterSection = d3.select("#sidebar").append("section");
    filterSection.append("h3").text("Filters");

    // Genre checkboxes
    const genreFilter = filterSection.append("div").attr("class", "range-filter-section");
    genreFilter.append("h4").text("Genre");
    genres.forEach(genre => {
        const lbl = genreFilter.append("label").style("display", "block").style("font-size", "11px");
        lbl.append("input")
            .attr("type", "checkbox")
            .attr("checked", true)
            .property("checked", true)
            .on("change", function () {
                if (this.checked) filterState.genres.add(genre);
                else filterState.genres.delete(genre);
                applyFilters();
            });
        lbl.append("span").text(" " + genre);
    });

    // Range sliders
    const rs = filterSection.append("div").attr("class", "range-filter-section");

    createRangeFilter(rs, "Price ($)", 0, maxPrice, 1,
        v => `$${v}`,
        (lo, hi) => { filterState.price = { min: lo, max: hi }; applyFilters(); });

    createRangeFilter(rs, "Release Year", filterState.year.min, filterState.year.max, 1,
        v => v,
        (lo, hi) => { filterState.year = { min: lo, max: hi }; applyFilters(); });

    createRangeFilter(rs, "Peak CCU", 0, filterState.ccu.max, 100,
        v => d3.format(".2s")(v),
        (lo, hi) => { filterState.ccu = { min: lo, max: hi }; applyFilters(); });

    createRangeFilter(rs, "Metacritic Score", 0, 100, 1,
        v => v,
        (lo, hi) => { filterState.meta = { min: lo, max: hi }; applyFilters(); });

    createRangeFilter(rs, "Positive Reviews", 0, filterState.pos.max, 1000,
        v => d3.format(".2s")(v),
        (lo, hi) => { filterState.pos = { min: lo, max: hi }; applyFilters(); });

    createRangeFilter(rs, "Negative Reviews", 0, filterState.neg.max, 100,
        v => d3.format(".2s")(v),
        (lo, hi) => { filterState.neg = { min: lo, max: hi }; applyFilters(); });

    createRangeFilter(rs, "Recommendations", 0, filterState.rec.max, 100,
        v => d3.format(".2s")(v),
        (lo, hi) => { filterState.rec = { min: lo, max: hi }; applyFilters(); });
    d3.selectAll("input[name='scale']").on("change", function () {
        const newScale = scales[this.value];
        activeRadialScale = newScale;
        drawPriceLines(newScale);
        drawStars(newScale);
    });
    d3.select("#angle-select").on("change", function () {
        currentAngleAttr = this.value;
        updateAngleDistributionState();

        // Hide guideline in random mode
        if (this.value === "random") {
            guideLine.style("display", "none");
            guideLabel.style("display", "none");
        }

        const attr = this.value;
        computeAngles(attr);

        const currentScaleValue = d3.select("input[name='scale']:checked").node().value;
        const currentRadialScale = scales[currentScaleValue];
        activeRadialScale = currentRadialScale;

        g.selectAll(".star")
            .transition().duration(600)
            .attr("cx", d => centreX + currentRadialScale(Math.max(d.Price, 0.01)) * Math.cos(d.currentAngle + ANGLE_OFFSET))
            .attr("cy", d => centreY + currentRadialScale(Math.max(d.Price, 0.01)) * Math.sin(d.currentAngle + ANGLE_OFFSET))
            .on("end", function (d) {
                if (highlightedAppId !== null && d.AppID === highlightedAppId) {
                    highlightGame(d, false);
                }
            });
    });


    d3.selectAll("input[name='angle-dist']").on("change", function () {
        if (currentAngleAttr === "random") return;

        currentAngleDist = this.value;
        computeAngles(currentAngleAttr);

        const currentScaleValue = d3.select("input[name='scale']:checked").node().value;
        const currentRadialScale = scales[currentScaleValue];

        g.selectAll(".star")
            .transition().duration(600)
            .attr("cx", d => centreX + currentRadialScale(Math.max(d.Price, 0.01)) * Math.cos(d.currentAngle + ANGLE_OFFSET))
            .attr("cy", d => centreY + currentRadialScale(Math.max(d.Price, 0.01)) * Math.sin(d.currentAngle + ANGLE_OFFSET));
    });

    if (gameSearchButton) {
        gameSearchButton.addEventListener("click", runGameSearch);
    }

    if (gameSearchInput) {
        gameSearchInput.addEventListener("keydown", event => {
            if (event.key === "Enter") runGameSearch();
            if (event.key === "Escape") clearHighlightedGame();
        });
    }

    if (gameSearchClear) {
        gameSearchClear.addEventListener("click", clearHighlightedGame);
    }

    svg.on("mousemove", function (event) {
        if (currentAngleAttr === "random") return;

        const transform = d3.zoomTransform(svg.node());
        const visualCentreX = transform.applyX(centreX);
        const visualCentreY = transform.applyY(centreY);
        const k = transform.k;

        const [mouseX, mouseY] = d3.pointer(event);
        const dx = mouseX - visualCentreX;
        const dy = mouseY - visualCentreY;
        const mouseAngle = Math.atan2(dy, dx);

        const rawAngle = mouseAngle - ANGLE_OFFSET;
        const normalizedAngle = ((rawAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        const angleScaleForAttr = getAngleScale(currentAngleAttr);
        if (!angleScaleForAttr) return;

        let lineAngle;
        let displayValue;

        if (currentAngleDist === "rank") {
            if (!attrSortedValues[currentAngleAttr]) {
                attrSortedValues[currentAngleAttr] = data
                    .map(d => d[currentAngleAttr])
                    .filter(v => isFinite(v))
                    .sort((a, b) => a - b);
            }
            const sorted = attrSortedValues[currentAngleAttr];
            const maxAngle = 2 * Math.PI * (sorted.length - 1) / sorted.length;
            const percentile = Math.min(normalizedAngle / maxAngle, 1);
            const idx = Math.round(percentile * (sorted.length - 1));
            displayValue = sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
            lineAngle = mouseAngle;

        } else if (intAttributes.has(currentAngleAttr)) {
            const rawValue = angleScaleForAttr.invert(normalizedAngle);
            const snapped = Math.round(rawValue);
            const [minVal, maxVal] = angleScaleForAttr.domain();
            const clamped = Math.max(minVal, Math.min(maxVal, snapped));
            if (snapIntAttributes.has(currentAngleAttr)) {
                if (!attrValueSets[currentAngleAttr].has(clamped)) {
                    guideLine.style("display", "none");
                    guideLabel.style("display", "none");
                    return;
                }
            }
            displayValue = clamped;
            lineAngle = angleScaleForAttr(clamped) + ANGLE_OFFSET;
        } else {
            const rawValue = angleScaleForAttr.invert(normalizedAngle);
            if (currentAngleAttr === "releaseDate") {
                displayValue = d3.timeFormat("%b %Y")(new Date(rawValue));
            } else {
                displayValue = rawValue.toFixed(2);
            }
            lineAngle = mouseAngle;
        }

        const lineLength = maxRadius * k;
        const endX = visualCentreX + lineLength * Math.cos(lineAngle);
        const endY = visualCentreY + lineLength * Math.sin(lineAngle);

        guideLine
            .style("display", "block")
            .attr("x1", visualCentreX).attr("y1", visualCentreY)
            .attr("x2", endX).attr("y2", endY);

        guideLabel
            .style("display", "block")
            .attr("x", mouseX + 10)
            .attr("y", mouseY - 5)
            .text(`${angleAttrLabels[currentAngleAttr]}: ${displayValue}`);
    });
});
